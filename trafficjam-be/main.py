import asyncio
import uuid
import logging
import json
from contextlib import asynccontextmanager
from io import StringIO
from typing import List, Optional

import nats as nats_lib
import httpx
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form
from sse_starlette import EventSourceResponse

from pydantic import BaseModel
from agents.models import PlanCreationRequest, Building as AgentBuilding
from agents.plans import generate_plan_for_agent, MATSimXMLWriter
from agents.agent_creation import create_agents_from_network
from config import get_settings
from consumers import EventConsumer
from db import engine, async_session_factory, Base, RunRepository, RunStatus

MAX_AGENTS = 1000

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StatusMessage(BaseModel):
    status: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.state.nc = await nats_lib.connect(settings.nats_url)
    app.state.js = app.state.nc.jetstream()
    app.state.status_worker = asyncio.create_task(_monitor_all_statuses(app.state.js))
    yield
    app.state.status_worker.cancel()
    await app.state.nc.drain()
    await engine.dispose()


app = FastAPI(lifespan=lifespan)


async def _monitor_all_statuses(js):
    consumer = EventConsumer(js, "*", "*")
    while True:
        try:
            async for scenario_id, run_id, status_raw in consumer.listen_all_statuses():
                try:
                    status_msg = StatusMessage.model_validate(status_raw)
                    status = status_msg.status
                    parsed_run_id = uuid.UUID(run_id)
                    repo = RunRepository(async_session_factory)

                    status_map = {
                        "running": RunStatus.RUNNING,
                        "completed": RunStatus.COMPLETED,
                        "failed": RunStatus.FAILED,
                        "stopped": RunStatus.FAILED,
                    }

                    new_status = status_map.get(status.lower())
                    if new_status:
                        await repo.update_status(parsed_run_id, new_status)
                except Exception as e:
                    logger.error(f"Status update failed for {run_id}: {e}")
        except Exception:
            await asyncio.sleep(5)


@app.get("/")
def root():
    return {"message": "Hello World! This is the main page."}


@app.post("/scenarios/{scenario_id}/runs")
async def create_run(scenario_id: str, run_id: str | None = None):
    repo = RunRepository(async_session_factory)
    parsed_id = uuid.UUID(run_id) if run_id else None
    run = await repo.create_run(scenario_id, parsed_id)
    return {"scenario_id": run.scenario_id, "run_id": str(run.id), "status": run.status}


def _generate_plans_xml(bounds: dict, buildings: List[AgentBuilding]) -> str:
    writer = MATSimXMLWriter()
    writer.create_plans_document()

    agents = create_agents_from_network(
        bounds=bounds,
        buildings=buildings,
        transport_routes=[],
        country_code="IRL",
    )

    if len(agents) > MAX_AGENTS:
        agents = agents[:MAX_AGENTS]

    for agent in agents:
        plan = generate_plan_for_agent(agent, buildings)
        if plan:
            writer.add_person_plan(agent.id, plan)

    stream = StringIO()
    writer.write_to_stream(stream)
    return stream.getvalue()


@app.post("/scenarios/{scenario_id}/runs/start")
async def start_run(
    scenario_id: str,
    networkFile: UploadFile = File(...),
    buildings: Optional[str] = Form(None),
    bounds: Optional[str] = Form(None),
    iterations: int = Form(1),
    randomSeed: int | None = Form(None),
):
    settings = get_settings()
    repo = RunRepository(async_session_factory)
    run = await repo.create_run(scenario_id)
    run_id = str(run.id)

    # Generate plans if buildings and bounds are provided
    plans_xml = None
    if buildings and bounds:
        try:
            buildings_list = [
                AgentBuilding.model_validate(b) for b in json.loads(buildings)
            ]
            bounds_dict = json.loads(bounds)
            plans_xml = _generate_plans_xml(bounds_dict, buildings_list)
        except Exception as e:
            logger.error(f"Failed to generate plans: {e}")
            # Fallback or error? For now, we continue if plans_xml is None,
            # but simengine might fail if it's required.

    async with httpx.AsyncClient() as client:
        files = {
            "networkFile": (
                networkFile.filename,
                await networkFile.read(),
                networkFile.content_type,
            )
        }

        if plans_xml:
            files["plansFile"] = ("plans.xml", plans_xml, "application/xml")
        else:
            # If no plans generated, we might need a dummy or existing plans file.
            # SimEngine currently REQUIRES plansFile.
            # For now, let's just send an empty plans file if it fails,
            # or better, raise an error if they are missing.
            raise HTTPException(
                status_code=400,
                detail="Buildings and bounds are required for plan generation.",
            )

        data = {
            "iterations": iterations,
            "scenarioId": scenario_id,
            "runId": run_id,
        }
        if randomSeed:
            data["randomSeed"] = randomSeed

        try:
            response = await client.post(
                f"{settings.simengine_url}/api/simulations",
                files=files,
                data=data,
                timeout=60.0,  # Increased timeout for plan generation + upload
            )
            response.raise_for_status()
            sim_data = response.json()
        except Exception as e:
            logger.error(f"SimEngine request failed: {e}")
            await repo.update_status(run.id, RunStatus.FAILED)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to start simulation in SimEngine: {str(e)}",
            )

    return {
        "scenario_id": scenario_id,
        "run_id": run_id,
        "simulation_id": sim_data.get("simulationId"),
        "status": "RUNNING",
    }


@app.post("/plan_creation")
async def plan_creation(request: PlanCreationRequest):
    writer = MATSimXMLWriter()
    writer.create_plans_document()

    agents = create_agents_from_network(
        bounds=request.bounds,
        buildings=request.buildings,
        transport_routes=[],
        country_code=request.country_code,
    )

    if len(agents) > MAX_AGENTS:
        agents = agents[:MAX_AGENTS]

    for agent in agents:
        plan = generate_plan_for_agent(agent, request.buildings)
        if plan:
            writer.add_person_plan(agent.id, plan)

    stream = StringIO()
    writer.write_to_stream(stream)
    xml_content = stream.getvalue()

    with open("output/test.xml", "w", encoding="utf-8") as f:
        f.write(xml_content)
    return


@app.get("/scenarios/{scenario_id}/runs/{run_id}/events/stream")
async def stream_run_events(scenario_id: str, run_id: str, request: Request):
    try:
        parsed_id = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(400, "Invalid run ID")

    repo = RunRepository(async_session_factory)
    run = await repo.get_run_by_scenario(scenario_id, parsed_id)
    if not run:
        raise HTTPException(404, "Run not found")

    is_replay = run.status == RunStatus.COMPLETED
    consumer = EventConsumer(request.app.state.js, scenario_id, str(parsed_id))

    return EventSourceResponse(consumer.stream_events(request, is_replay))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
