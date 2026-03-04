import json
import uuid
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker
from db.models import Scenario

class ScenarioRepository:
    def __init__(self, session_factory: async_sessionmaker):
        self.session_factory = session_factory

    async def create_scenario(
        self,
        name: str,
        plan_params: dict,
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
            scenario = await session.get(Scenario, scenario_id)
            if scenario:
                if isinstance(scenario.network_config, str):
                    scenario.network_config = json.loads(scenario.network_config)
                if isinstance(scenario.matsim_config, str):
                    scenario.matsim_config = json.loads(scenario.matsim_config)
                if isinstance(scenario.plan_params, str):
                    scenario.plan_params = json.loads(scenario.plan_params)
            return scenario

    async def list_scenarios(self) -> list[Scenario]:
        summary_columns = [
            Scenario.id,
            Scenario.name,
            Scenario.description,
            Scenario.plan_params,
            Scenario.created_at,
            Scenario.updated_at,
        ]
        async with self.session_factory() as session:
            result = await session.execute(select(*summary_columns))
            rows = []
            for row in result.all():
                d = dict(row._mapping)
                if isinstance(d.get("plan_params"), str):
                    d["plan_params"] = json.loads(d["plan_params"])
                rows.append(d)
            return rows

    async def update_scenario(
        self,
        scenario_id: uuid.UUID,
        name: str | None = None,
        description: str | None = None,
        network_config: dict | None = None,
        plan_params: dict | None = None,
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

    async def update_network_config(self, scenario_id: uuid.UUID, network_config: dict) -> bool:
        async with self.session_factory() as session:
            result = await session.execute(
                update(Scenario)
                .where(Scenario.id == scenario_id)
                .values(network_config=network_config)
            )
            await session.commit()
            return result.rowcount > 0

    async def delete_scenario(self, scenario_id: uuid.UUID) -> bool:
        async with self.session_factory() as session:
            scenario = await session.get(Scenario, scenario_id)
            if not scenario:
                return False
            await session.delete(scenario)
            await session.commit()
            return True
