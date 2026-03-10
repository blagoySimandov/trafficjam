import asyncio
import logging
import uuid
from typing import Optional

import nats as nats_lib
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
import fastapi.responses
from sse_starlette import EventSourceResponse

from adapters.simengine import SimulationEnginePort
from agents.config import AgentConfig
from agents.plans.population import generate_plans_xml, parse_buildings_and_bounds
from consumers import EventConsumer
from db import RunRepository, RunStatus, ScenarioRepository
from dependencies import get_run_repo, get_scenario_repo, get_sim_engine

router = APIRouter(prefix="/scenarios", tags=["runs"])
logger = logging.getLogger(__name__)


@router.get("/{scenario_id}/runs")
async def list_runs(
    scenario_id: str,
    repo: RunRepository = Depends(get_run_repo),
):
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


@router.post("/{scenario_id}/runs")
async def create_run(
    scenario_id: str,
    run_id: str | None = None,
    repo: RunRepository = Depends(get_run_repo),
):
    parsed_scenario_id = uuid.UUID(scenario_id)
    parsed_id = uuid.UUID(run_id) if run_id else None
    run = await repo.create_run(parsed_scenario_id, parsed_id)
    return {
        "scenario_id": str(run.scenario_id),
        "run_id": str(run.id),
        "status": run.status,
    }


@router.post("/{scenario_id}/runs/start")
async def start_run(
    scenario_id: str,
    networkFile: UploadFile = File(...),
    buildings: Optional[str] = Form(None),
    bounds: Optional[str] = Form(None),
    iterations: int = Form(1),
    randomSeed: int | None = Form(None),
    note: str | None = Form(None),
    run_repo: RunRepository = Depends(get_run_repo),
    scenario_repo: ScenarioRepository = Depends(get_scenario_repo),
    sim_engine: SimulationEnginePort = Depends(get_sim_engine),
):
    try:
        parsed_scenario_id = uuid.UUID(scenario_id)
    except ValueError:
        raise HTTPException(400, "Invalid scenario ID")

    run = await run_repo.create_run(
        parsed_scenario_id,
        iterations=iterations,
        random_seed=randomSeed,
        note=note,
    )

    if not buildings or not bounds:
        raise HTTPException(400, "Buildings and bounds are required for plan generation.")

    scenario = await scenario_repo.get_scenario(parsed_scenario_id)
    plan_params = (scenario.plan_params or {}) if scenario else {}
    agent_config = AgentConfig.from_plan_params(plan_params)
    max_agents = plan_params.get("maxAgents", 1000)

    try:
        buildings_list, bounds_dict = parse_buildings_and_bounds(buildings, bounds)
        plans_xml = await asyncio.to_thread(
            generate_plans_xml, bounds_dict, buildings_list, agent_config, max_agents
        )
    except Exception as e:
        logger.error(f"Failed to generate plans: {e}")
        await run_repo.update_status(run.id, RunStatus.FAILED)
        raise HTTPException(500, f"Plan generation failed: {e}")

    run_id = str(run.id)
    try:
        result = await sim_engine.start(
            scenario_id=scenario_id,
            run_id=run_id,
            network_filename=networkFile.filename,
            network_file=await networkFile.read(),
            network_content_type=networkFile.content_type,
            plans_xml=plans_xml,
            iterations=iterations,
            random_seed=randomSeed,
        )
    except Exception as e:
        logger.error(f"SimEngine request failed: {e}")
        await run_repo.update_status(run.id, RunStatus.FAILED)
        raise HTTPException(500, f"Failed to start simulation in SimEngine: {e}")

    return {
        "scenario_id": scenario_id,
        "run_id": run_id,
        "simulation_id": result.simulation_id,
        "status": "RUNNING",
    }


@router.get("/{scenario_id}/runs/{run_id}/events/stream")
async def stream_run_events(
    scenario_id: str,
    run_id: str,
    request: Request,
    repo: RunRepository = Depends(get_run_repo),
):
    try:
        parsed_id = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(400, "Invalid run ID")

    run = await repo.get_run_by_scenario(uuid.UUID(scenario_id), parsed_id)
    if not run:
        raise HTTPException(404, "Run not found")

    consumer = EventConsumer(request.app.state.js, scenario_id, str(parsed_id))
    return EventSourceResponse(consumer.stream_events(request, run.status == RunStatus.COMPLETED))


@router.get("/{scenario_id}/runs/{run_id}/simwrapper/{filename:path}")
async def get_simwrapper_file(
    scenario_id: str,
    run_id: str,
    filename: str,
    request: Request,
    repo: RunRepository = Depends(get_run_repo),
):
    try:
        parsed_id = uuid.UUID(run_id)
        parsed_scenario_id = uuid.UUID(scenario_id)
    except ValueError:
        raise HTTPException(400, "Invalid UUID format")

    run = await repo.get_run_by_scenario(parsed_scenario_id, parsed_id)
    if not run:
        raise HTTPException(404, "Run not found")

    try:
        obj_store = await request.app.state.js.object_store(f"sim-outputs-{run_id}")
        obj = await obj_store.get(filename)
        return fastapi.responses.Response(
            content=obj.data,
            media_type=_content_type_for(filename),
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Cache-Control": "public, max-age=3600",
            },
        )
    except nats_lib.js.errors.NotFoundError:
        raise HTTPException(404, f"File {filename} not found in Object Store")
    except Exception as e:
        logger.error(f"Error fetching simwrapper file {filename}: {e}")
        raise HTTPException(500, "Failed to retrieve file")


def _content_type_for(filename: str) -> str:
    if filename.endswith((".yaml", ".yml")):
        return "application/x-yaml"
    if filename.endswith(".csv"):
        return "text/csv"
    if filename.endswith(".json"):
        return "application/json"
    return "application/octet-stream"
