import logging
import uuid

from fastapi import APIRouter, HTTPException, Request

from db import async_session_factory, ScenarioRepository
from schemas import ScenarioCreate, ScenarioUpdate, ScenarioResponse, ScenarioSummary

router = APIRouter(prefix="/scenarios", tags=["scenarios"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[ScenarioSummary])
async def list_scenarios():
    """
    Retrieve a summarized list of all scenarios in the database.

    Returns:
        list[ScenarioSummary]: A list of objects containing basic metadata 
            (ID, name, description, dates) without the heavy network config payloads.
    """
    repo = ScenarioRepository(async_session_factory)
    return await repo.list_scenarios()


@router.get("/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(scenario_id: uuid.UUID):
    """
    Retrieve the full details of a specific scenario, including its network configuration.

    Args:
        scenario_id (uuid.UUID): The unique identifier of the scenario.

    Returns:
        ScenarioResponse: The full scenario object.

    Raises:
        HTTPException(404): If the scenario cannot be found.
    """
    repo = ScenarioRepository(async_session_factory)
    scenario = await repo.get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.post("", response_model=ScenarioResponse, status_code=201)
async def create_scenario(body: ScenarioCreate):
    """
    Create a new blank scenario or instantiate one with an initial configuration.

    Args:
        body (ScenarioCreate): The payload containing the requested name, optional description,
            and any initial plan parameters or network settings.

    Returns:
        ScenarioResponse: The newly created scenario, including its generated UUID.
    """
    repo = ScenarioRepository(async_session_factory)
    return await repo.create_scenario(
        name=body.name,
        description=body.description,
        network_config=body.network_config,
        plan_params=body.plan_params,
        matsim_config=body.matsim_config,
    )


@router.put("/{scenario_id}", response_model=ScenarioSummary)
async def update_scenario(scenario_id: uuid.UUID, body: ScenarioUpdate):
    """
    Update a scenario's basic metadata or agent plan generation parameters.

    Args:
        scenario_id (uuid.UUID): The UUID of the scenario to update.
        body (ScenarioUpdate): The payload containing fields to update (name, description, etc.).

    Returns:
        ScenarioSummary: The updated summary object.

    Raises:
        HTTPException(404): If the scenario does not exist.
    """
    repo = ScenarioRepository(async_session_factory)
    scenario = await repo.update_scenario(
        scenario_id=scenario_id,
        name=body.name,
        description=body.description,
        plan_params=body.plan_params,
    )
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.put("/{scenario_id}/network", status_code=204)
async def update_network(scenario_id: uuid.UUID, body: dict):
    """
    Update the heavy network graph configuration of a scenario.

    This endpoint specifically handles partial or full replacements of the underlying
    JSON network map (links, nodes, building geometries).

    Args:
        scenario_id (uuid.UUID): The scenario UUID.
        body (dict): The new or updated network JSON payload.

    Raises:
        HTTPException(404): If the scenario does not exist.
    """
    repo = ScenarioRepository(async_session_factory)
    updated = await repo.update_network_config(scenario_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Scenario not found")


async def _purge_nats_messages(js, scenario_id: uuid.UUID):
    """
    Clean up NATS JetStream events related to a scenario when it is being deleted.
    """
    try:
        await js.purge_stream("SIMULATIONS", subject=f"sim.{scenario_id}.>")
    except Exception as e:
        logger.warning(f"NATS purge failed for scenario {scenario_id}: {e}")


@router.delete("/{scenario_id}", status_code=204)
async def delete_scenario(scenario_id: uuid.UUID, request: Request):
    """
    Completely remove a scenario, its associated runs, and its NATS streams.

    Args:
        scenario_id (uuid.UUID): The scenario to delete.
        request (Request): Standard request object to access the NATS JetStream client.

    Raises:
        HTTPException(404): If the scenario doesn't exist.
    """
    await _purge_nats_messages(request.app.state.js, scenario_id)
    repo = ScenarioRepository(async_session_factory)
    deleted = await repo.delete_scenario(scenario_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scenario not found")
