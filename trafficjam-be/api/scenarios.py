import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request

from db import ScenarioRepository
from dependencies import get_scenario_repo
from schemas import ScenarioCreate, ScenarioUpdate, ScenarioResponse, ScenarioSummary

router = APIRouter(prefix="/scenarios", tags=["scenarios"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[ScenarioSummary], summary="List all scenarios")
async def list_scenarios(repo: ScenarioRepository = Depends(get_scenario_repo)):
    return await repo.list_scenarios()


@router.get(
    "/{scenario_id}",
    response_model=ScenarioResponse,
    summary="Get a scenario",
    response_description="Full scenario including network config and MATSim settings",
)
async def get_scenario(
    scenario_id: uuid.UUID,
    repo: ScenarioRepository = Depends(get_scenario_repo),
):
    scenario = await repo.get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.post(
    "",
    response_model=ScenarioResponse,
    status_code=201,
    summary="Create a scenario",
    response_description="Newly created scenario",
)
async def create_scenario(
    body: ScenarioCreate,
    repo: ScenarioRepository = Depends(get_scenario_repo),
):
    return await repo.create_scenario(
        name=body.name,
        description=body.description,
        network_config=body.network_config,
        plan_params=body.plan_params,
        matsim_config=body.matsim_config,
    )


@router.put(
    "/{scenario_id}",
    response_model=ScenarioSummary,
    summary="Update a scenario",
    response_description="Updated scenario summary",
)
async def update_scenario(
    scenario_id: uuid.UUID,
    body: ScenarioUpdate,
    repo: ScenarioRepository = Depends(get_scenario_repo),
):
    scenario = await repo.update_scenario(
        scenario_id=scenario_id,
        name=body.name,
        description=body.description,
        plan_params=body.plan_params,
    )
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.put(
    "/{scenario_id}/network",
    status_code=204,
    summary="Update network config",
    description="Replace the road network configuration for a scenario without affecting other fields.",
)
async def update_network(
    scenario_id: uuid.UUID,
    body: dict,
    repo: ScenarioRepository = Depends(get_scenario_repo),
):
    updated = await repo.update_network_config(scenario_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Scenario not found")


async def _purge_nats_messages(js, scenario_id: uuid.UUID):
    try:
        await js.purge_stream("SIMULATIONS", subject=f"sim.{scenario_id}.>")
    except Exception as e:
        logger.warning(f"NATS purge failed for scenario {scenario_id}: {e}")


@router.delete(
    "/{scenario_id}",
    status_code=204,
    summary="Delete a scenario",
    description="Deletes the scenario and all its runs. Also purges all associated NATS messages from the `SIMULATIONS` stream.",
)
async def delete_scenario(
    scenario_id: uuid.UUID,
    request: Request,
    repo: ScenarioRepository = Depends(get_scenario_repo),
):
    await _purge_nats_messages(request.app.state.js, scenario_id)
    deleted = await repo.delete_scenario(scenario_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scenario not found")
