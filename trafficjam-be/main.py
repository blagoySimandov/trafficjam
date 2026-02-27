import asyncio
import json
import uuid
import logging
from contextlib import asynccontextmanager
from io import StringIO
from typing import List, Optional

import nats as nats_lib
import httpx
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette import EventSourceResponse

from pydantic import BaseModel
from agents.models import Building as AgentBuilding
from agents.plans import generate_plan_for_agent, MATSimXMLWriter
from agents.agent_creation import create_agents_from_network
from agents.config import AgentConfig
from config import get_settings
from consumers import EventConsumer
from db import (
    engine,
    async_session_factory,
    RunRepository,
    RunStatus,
    ScenarioRepository,
)
from api.scenarios import router as scenarios_router

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
    yield
    app.state.status_worker.cancel()
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
            async for _, run_id, status_raw in consumer.listen_all_statuses():
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


def _agent_config_from_plan_params(plan_params: dict) -> AgentConfig:
    return AgentConfig(
        default_population_density=plan_params.get("populationDensity", 100),
        shopping_probability=plan_params.get("shoppingProbability", 0.40),
        max_shopping_distance_km=plan_params.get("maxShoppingDistanceKm", 5.0),
        healthcare_chance=plan_params.get("healthcareChance", 0.30),
        elderly_age_threshold=plan_params.get("elderlyAgeThreshold", 65),
        kindergarten_age=plan_params.get("kindergartenAge", 6),
        min_independent_school_age=plan_params.get("minIndependentSchoolAge", 12),
        errand_min_minutes=plan_params.get("errandMinMinutes", 30),
        errand_max_minutes=plan_params.get("errandMaxMinutes", 120),
        child_dropoff_min_minutes=plan_params.get("childDropoffMinMinutes", 5),
        child_dropoff_max_minutes=plan_params.get("childDropoffMaxMinutes", 10),
    )


def _generate_plans_xml(
    bounds: dict,
    buildings: List[AgentBuilding],
    agent_config: AgentConfig,
    max_agents: int,
) -> str:
    writer = MATSimXMLWriter()
    writer.create_plans_document()

    agents = create_agents_from_network(
        bounds=bounds,
        buildings=buildings,
        transport_routes=[],
        country_code="IRL",
        agent_config=agent_config,
        max_agents=max_agents,
    )

    for agent in agents:
        plan = generate_plan_for_agent(agent, buildings, agent_config)
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
):
    settings = get_settings()
    repo = RunRepository(async_session_factory)
    parsed_scenario_id = uuid.UUID(scenario_id)
    run = await repo.create_run(parsed_scenario_id)
    run_id = str(run.id)

    if not buildings or not bounds:
        raise HTTPException(
            status_code=400,
            detail="Buildings and bounds are required for plan generation.",
        )

    scenario_repo = ScenarioRepository(async_session_factory)
    scenario = await scenario_repo.get_scenario(parsed_scenario_id)
    plan_params = (scenario.plan_params or {}) if scenario else {}
    agent_config = _agent_config_from_plan_params(plan_params)
    max_agents = plan_params.get("maxAgents", 1000)

    try:
        buildings_list, bounds_dict = _parse_buildings_and_bounds(buildings, bounds)
        plans_xml = await asyncio.to_thread(
            _generate_plans_xml, bounds_dict, buildings_list, agent_config, max_agents
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
