from fastapi import Depends

from adapters.simengine import HttpSimEngineAdapter, SimulationEnginePort
from config import Settings, get_settings
from db import RunRepository, ScenarioRepository, async_session_factory


def get_run_repo() -> RunRepository:
    return RunRepository(async_session_factory)


def get_scenario_repo() -> ScenarioRepository:
    return ScenarioRepository(async_session_factory)


def get_sim_engine(settings: Settings = Depends(get_settings)) -> SimulationEnginePort:
    return HttpSimEngineAdapter(settings.simengine_url)
