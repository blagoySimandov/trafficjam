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
import fastapi.responses
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette import EventSourceResponse

from pydantic import BaseModel
from agents.models import PlanCreationRequest, PlannerConfig, Building as AgentBuilding
from agents.plans import generate_plan_for_agent, MATSimXMLWriter
from agents.agent_creation import create_agents_from_network
from config import get_settings
from consumers import EventConsumer
from db import engine, async_session_factory, RunRepository, RunStatus
from api.scenarios import router as scenarios_router

MAX_AGENTS = 1000

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StatusMessage(BaseModel):
    status: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.nc = await nats_lib.connect(settings.nats_url)
    app.state.js = app.state.nc.jetstream()
    app.state.status_worker = asyncio.create_task(_monitor_all_statuses(app.state.js))
    app.state.simwrapper_worker = asyncio.create_task(_monitor_simwrapper_ready(app.state.js))
    yield
    app.state.status_worker.cancel()
    app.state.simwrapper_worker.cancel()
    await app.state.nc.drain()
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(scenarios_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _monitor_all_statuses(js):
    consumer = EventConsumer(js, "*", "*")
    while True:
        try:
            async for scenario_id, run_id, status_raw in consumer.listen_all_statuses():
                try:
                    status_msg = StatusMessage.model_validate(status_raw)
                    parsed_run_id = uuid.UUID(run_id)
                    repo = RunRepository(async_session_factory)
                    new_status = _map_status(status_msg.status)
                    if new_status:
                        await repo.update_status(parsed_run_id, new_status)
                except Exception as e:
                    logger.error(f"Status update failed for {run_id}: {e}")
        except Exception:
            await asyncio.sleep(5)


async def _monitor_simwrapper_ready(js):
    consumer = EventConsumer(js, "*", "*")
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            async for run_id, bucket_name in consumer.listen_simwrapper_ready():
                if not bucket_name:
                    continue
                try:
                    parsed_run_id = uuid.UUID(run_id)
                    repo = RunRepository(async_session_factory)
                    await repo.update_simwrapper_bucket(parsed_run_id, bucket_name)
                    logger.info(f"Updated SimWrapper bucket {bucket_name} for run {run_id}")
                    
                    # Reset error count on successful processing
                    error_count = 0
                except Exception as e:
                    logger.error(f"SimWrapper bucket update failed for {run_id}: {e}")
            
            # If the async for loop exits normally
            error_count = 0
            
        except Exception as e:
            error_count += 1
            if error_count >= max_errors:
                # Print a bright red error message directly to the running terminal
                print(f"\033[91m\n[CRITICAL FAILURE] SimWrapper NATS Consumer crashed {max_errors} times in a row! Shutting down listener.\nLast Error: {e}\033[0m")
                break
                
            logger.warning(f"SimWrapper listener error (Attempt {error_count}/{max_errors}): {e}")
            await asyncio.sleep(5)


def _map_status(status: str) -> RunStatus | None:
    return {
        "running": RunStatus.RUNNING,
        "completed": RunStatus.COMPLETED,
        "failed": RunStatus.FAILED,
        "stopped": RunStatus.FAILED,
    }.get(status.lower())


@app.get("/")
def root():
    return {"message": "Hello World! This is the main page."}


@app.get("/scenarios/{scenario_id}/runs")
async def list_runs(scenario_id: str):
    repo = RunRepository(async_session_factory)
    try:
        parsed_scenario_id = uuid.UUID(scenario_id)
    except ValueError:
        raise HTTPException(400, "Invalid scenario ID")
    runs = await repo.list_runs(parsed_scenario_id)
    return [
        {
            "id": str(r.id),
            "scenarioId": str(r.scenario_id),
            "status": r.status,
            "iterations": r.iterations,
            "randomSeed": r.random_seed,
            "note": r.note,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        }
        for r in runs
    ]


@app.post("/scenarios/{scenario_id}/runs")
async def create_run(scenario_id: str, run_id: str | None = None):
    repo = RunRepository(async_session_factory)
    parsed_scenario_id = uuid.UUID(scenario_id)
    parsed_id = uuid.UUID(run_id) if run_id else None
    run = await repo.create_run(parsed_scenario_id, parsed_id)
    return {
        "scenario_id": str(run.scenario_id),
        "run_id": str(run.id),
        "status": run.status,
    }


def _generate_plans_xml(bounds: dict, buildings: List[AgentBuilding]) -> str:
    config = PlannerConfig()
    writer = MATSimXMLWriter()
    writer.create_plans_document()

    agents = create_agents_from_network(
        bounds=bounds,
        buildings=buildings,
        transport_routes=[],
        country_code="IRL",
        config=config,
    )

    if len(agents) > MAX_AGENTS:
        agents = agents[:MAX_AGENTS]

    for agent in agents:
        plan = generate_plan_for_agent(agent, buildings, config)
        if plan:
            writer.add_person_plan(agent.id, plan)

    stream = StringIO()
    writer.write_to_stream(stream)
    return stream.getvalue()


def _parse_buildings_and_bounds(buildings_json: str, bounds_json: str):
    buildings_list = [
        AgentBuilding.model_validate(b) for b in json.loads(buildings_json)
    ]
    bounds_dict = json.loads(bounds_json)
    return buildings_list, bounds_dict


@app.post("/scenarios/{scenario_id}/runs/start")
async def start_run(
    scenario_id: str,
    networkFile: UploadFile = File(...),
    buildings: Optional[str] = Form(None),
    bounds: Optional[str] = Form(None),
    iterations: int = Form(1),
    randomSeed: int | None = Form(None),
    note: str | None = Form(None),
):
    settings = get_settings()
    repo = RunRepository(async_session_factory)
    try:
        parsed_scenario_id = uuid.UUID(scenario_id)
    except ValueError:
        raise HTTPException(400, "Invalid scenario ID")
    run = await repo.create_run(
        parsed_scenario_id,
        iterations=iterations,
        random_seed=randomSeed,
        note=note,
    )
    run_id = str(run.id)

    if not buildings or not bounds:
        raise HTTPException(
            status_code=400,
            detail="Buildings and bounds are required for plan generation.",
        )

    try:
        buildings_list, bounds_dict = _parse_buildings_and_bounds(buildings, bounds)
        plans_xml = await asyncio.to_thread(
            _generate_plans_xml, bounds_dict, buildings_list
        )
    except Exception as e:
        logger.error(f"Failed to generate plans: {e}")
        await repo.update_status(run.id, RunStatus.FAILED)
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {e}")

    return await _submit_to_simengine(
        settings,
        repo,
        run,
        scenario_id,
        run_id,
        networkFile,
        plans_xml,
        iterations,
        randomSeed,
    )


async def _submit_to_simengine(
    settings,
    repo,
    run,
    scenario_id,
    run_id,
    networkFile,
    plans_xml,
    iterations,
    randomSeed,
):
    files = {
        "networkFile": (
            networkFile.filename,
            await networkFile.read(),
            networkFile.content_type,
        ),
        "plansFile": ("plans.xml", plans_xml, "application/xml"),
    }
    data = {"iterations": iterations, "scenarioId": scenario_id, "runId": run_id}
    if randomSeed:
        data["randomSeed"] = randomSeed

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.simengine_url}/api/simulations",
                files=files,
                data=data,
                timeout=60.0,
            )
            response.raise_for_status()
            sim_data = response.json()
    except Exception as e:
        logger.error(f"SimEngine request failed: {e}")
        await repo.update_status(run.id, RunStatus.FAILED)
        raise HTTPException(
            status_code=500, detail=f"Failed to start simulation in SimEngine: {e}"
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
        config=request.config,
    )

    if len(agents) > MAX_AGENTS:
        agents = agents[:MAX_AGENTS]

    for agent in agents:
        plan = generate_plan_for_agent(agent, request.buildings, request.config)
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
    parsed_scenario_id = uuid.UUID(scenario_id)
    run = await repo.get_run_by_scenario(parsed_scenario_id, parsed_id)
    if not run:
        raise HTTPException(404, "Run not found")

    is_replay = run.status == RunStatus.COMPLETED
    consumer = EventConsumer(request.app.state.js, scenario_id, str(parsed_id))

    return EventSourceResponse(consumer.stream_events(request, is_replay))


@app.get("/scenarios/{scenario_id}/runs/{run_id}/simwrapper/{filename:path}")
async def get_simwrapper_file(scenario_id: str, run_id: str, filename: str, request: Request):
    try:
        parsed_id = uuid.UUID(run_id)
        parsed_scenario_id = uuid.UUID(scenario_id)
    except ValueError:
        raise HTTPException(400, "Invalid UUID format")

    repo = RunRepository(async_session_factory)
    run = await repo.get_run_by_scenario(parsed_scenario_id, parsed_id)
    
    if not run:
        raise HTTPException(404, "Run not found")
        
    if not run.simwrapper_bucket:
        raise HTTPException(404, "SimWrapper data not available for this run yet")

    try:
        os = await request.app.state.js.object_store(run.simwrapper_bucket)
        
        # Determine content type
        content_type = "application/octet-stream"
        if filename.endswith(".yaml") or filename.endswith(".yml"):
            content_type = "application/x-yaml"
        elif filename.endswith(".csv"):
            content_type = "text/csv"
        elif filename.endswith(".json"):
            content_type = "application/json"
            
        # Get the object from NATS
        obj = await os.get(filename)
        headers = {
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "public, max-age=3600"
        }
        
        return fastapi.responses.Response(
            content=obj.data,
            media_type=content_type,
            headers=headers
        )
    except nats_lib.js.errors.NotFoundError:
        raise HTTPException(404, f"File {filename} not found in Object Store")
    except Exception as e:
        logger.error(f"Error fetching simwrapper file {filename}: {e}")
        raise HTTPException(500, "Failed to retrieve file")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
