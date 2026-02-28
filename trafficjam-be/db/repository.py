import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from db.models import Run, RunStatus


class RunRepository:
    def __init__(self, session_factory: async_sessionmaker):
        self.session_factory = session_factory

    async def get_run(self, run_id: uuid.UUID) -> Run | None:
        async with self.session_factory() as session:
            return await session.get(Run, run_id)

    async def get_run_by_scenario(self, scenario_id: str, run_id: uuid.UUID) -> Run | None:
        async with self.session_factory() as session:
            stmt = select(Run).where(Run.id == run_id, Run.scenario_id == scenario_id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def update_status(self, run_id: uuid.UUID, status: RunStatus) -> Run | None:
        async with self.session_factory() as session:
            run = await session.get(Run, run_id)
            if not run:
                return None
            run.status = status
            await session.commit()
            await session.refresh(run)
            return run

    async def create_run(self, scenario_id: str, run_id: uuid.UUID | None = None) -> Run:
        async with self.session_factory() as session:
            run = Run(id=run_id or uuid.uuid4(), scenario_id=scenario_id, status=RunStatus.PENDING)
            session.add(run)
            await session.commit()
            await session.refresh(run)
            return run
