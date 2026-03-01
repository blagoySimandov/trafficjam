import logging
import uuid

from fastapi import APIRouter, HTTPException, Request

from db import async_session_factory, ScenarioRepository
from schemas import ScenarioCreate, ScenarioUpdate, ScenarioResponse, ScenarioSummary

router = APIRouter(prefix="/scenarios", tags=["scenarios"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[ScenarioSummary])
async def list_scenarios():
    repo = ScenarioRepository(async_session_factory)
    return await repo.list_scenarios()


@router.get("/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(scenario_id: uuid.UUID):
    repo = ScenarioRepository(async_session_factory)
    scenario = await repo.get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.post("", response_model=ScenarioResponse, status_code=201)
async def create_scenario(body: ScenarioCreate):
    repo = ScenarioRepository(async_session_factory)
    return await repo.create_scenario(
        name=body.name,
        description=body.description,
        network_config=body.network_config,
        plan_params=body.plan_params,
        matsim_config=body.matsim_config,
    )


@router.put("/{scenario_id}", response_model=ScenarioResponse)
async def update_scenario(scenario_id: uuid.UUID, body: ScenarioUpdate):
    repo = ScenarioRepository(async_session_factory)
    scenario = await repo.update_scenario(
        scenario_id=scenario_id,
        name=body.name,
        description=body.description,
        network_config=body.network_config,
        plan_params=body.plan_params,
        matsim_config=body.matsim_config,
    )
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


async def _purge_nats_messages(js, scenario_id: uuid.UUID):
    try:
        await js.purge_stream("SIMULATIONS", subject=f"sim.{scenario_id}.>")
    except Exception as e:
        logger.warning(f"NATS purge failed for scenario {scenario_id}: {e}")


@router.delete("/{scenario_id}", status_code=204)
async def delete_scenario(scenario_id: uuid.UUID, request: Request):
    await _purge_nats_messages(request.app.state.js, scenario_id)
    repo = ScenarioRepository(async_session_factory)
    deleted = await repo.delete_scenario(scenario_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scenario not found")
