import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from db.models import Run, RunStatus


class RunRepository:
    def __init__(self, session_factory: async_sessionmaker):
        self.session_factory = session_factory

    async def list_runs(self, scenario_id: uuid.UUID | None = None) -> list[Run]:
        async with self.session_factory() as session:
            stmt = select(Run).order_by(Run.created_at.desc())
            if scenario_id:
                stmt = stmt.where(Run.scenario_id == scenario_id)
            result = await session.execute(stmt)
            return list(result.scalars().all())

    async def get_run(self, run_id: uuid.UUID) -> Run | None:
        async with self.session_factory() as session:
            return await session.get(Run, run_id)

    async def get_run_by_scenario(self, scenario_id: uuid.UUID, run_id: uuid.UUID) -> Run | None:
        async with self.session_factory() as session:
            stmt = select(Run).where(Run.id == run_id, Run.scenario_id == scenario_id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def update_status(
        self,
        run_id: uuid.UUID,
        status: RunStatus,
        nats_subject: str | None = None,
        event_count: int | None = None,
        duration_seconds: float | None = None,
    ) -> Run | None:
        async with self.session_factory() as session:
            run = await session.get(Run, run_id)
            if not run:
                return None
            run.status = status
            if nats_subject is not None:
                run.nats_subject = nats_subject
            if event_count is not None:
                run.event_count = event_count
            if duration_seconds is not None:
                run.duration_seconds = duration_seconds
            await session.commit()
            await session.refresh(run)
            return run

    async def create_run(
        self,
        scenario_id: uuid.UUID,
        run_id: uuid.UUID | None = None,
        nats_subject: str | None = None,
        iterations: int = 1,
        random_seed: int | None = None,
        note: str | None = None,
    ) -> Run:
        async with self.session_factory() as session:
            run = Run(
                id=run_id or uuid.uuid4(),
                scenario_id=scenario_id,
                status=RunStatus.PENDING,
                nats_subject=nats_subject,
                iterations=iterations,
                random_seed=random_seed,
                note=note,
            )
            session.add(run)
            await session.commit()
            await session.refresh(run)
            return run
