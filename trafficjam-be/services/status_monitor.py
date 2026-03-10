import asyncio
import logging
import uuid

from pydantic import BaseModel

from consumers import EventConsumer
from db import RunRepository, RunStatus, async_session_factory

logger = logging.getLogger(__name__)


class StatusMessage(BaseModel):
    status: str


def map_status(status: str) -> RunStatus | None:
    return {
        "running": RunStatus.RUNNING,
        "completed": RunStatus.COMPLETED,
        "failed": RunStatus.FAILED,
        "stopped": RunStatus.FAILED,
    }.get(status.lower())


async def monitor_all_statuses(js) -> None:
    consumer = EventConsumer(js, "*", "*")
    repo = RunRepository(async_session_factory)
    while True:
        try:
            async for _, run_id, status_raw in consumer.listen_all_statuses():
                try:
                    status_msg = StatusMessage.model_validate(status_raw)
                    new_status = map_status(status_msg.status)
                    if new_status:
                        await repo.update_status(uuid.UUID(run_id), new_status)
                except Exception as e:
                    logger.error(f"Status update failed for {run_id}: {e}")
        except Exception:
            await asyncio.sleep(5)
