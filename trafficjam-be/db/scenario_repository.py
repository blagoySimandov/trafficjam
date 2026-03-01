import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker
from db.models import Scenario

class ScenarioRepository:
    def __init__(self, session_factory: async_sessionmaker):
        self.session_factory = session_factory

    async def create_scenario(
        self,
        name: str,
        plan_params: str,
        network_config: dict | None = None,
        description: str | None = None,
        matsim_config: dict | None = None,
    ) -> Scenario:
        async with self.session_factory() as session:
            scenario = Scenario(
                name=name,
                description=description,
                network_config=network_config,
                plan_params=plan_params,
                matsim_config=matsim_config,
            )
            session.add(scenario)
            await session.commit()
            await session.refresh(scenario)
            return scenario

    async def get_scenario(self, scenario_id: uuid.UUID) -> Scenario | None:
        async with self.session_factory() as session:
            return await session.get(Scenario, scenario_id)

    async def list_scenarios(self) -> list[Scenario]:
        async with self.session_factory() as session:
            result = await session.execute(select(Scenario))
            return list(result.scalars().all())

    async def update_scenario(
        self,
        scenario_id: uuid.UUID,
        name: str | None = None,
        description: str | None = None,
        network_config: dict | None = None,
        plan_params: str | None = None,
        matsim_config: dict | None = None,
    ) -> Scenario | None:
        async with self.session_factory() as session:
            scenario = await session.get(Scenario, scenario_id)
            if not scenario:
                return None
            if name is not None:
                scenario.name = name
            if description is not None:
                scenario.description = description
            if network_config is not None:
                scenario.network_config = network_config
            if plan_params is not None:
                scenario.plan_params = plan_params
            if matsim_config is not None:
                scenario.matsim_config = matsim_config
            await session.commit()
            await session.refresh(scenario)
            return scenario

    async def delete_scenario(self, scenario_id: uuid.UUID) -> bool:
        async with self.session_factory() as session:
            scenario = await session.get(Scenario, scenario_id)
            if not scenario:
                return False
            await session.delete(scenario)
            await session.commit()
            return True
