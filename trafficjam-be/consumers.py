import asyncio
import json
from collections.abc import AsyncGenerator

from nats.js import JetStreamContext
from nats.errors import TimeoutError as NatsTimeoutError
from starlette.requests import Request


class EventConsumer:
    def __init__(self, js: JetStreamContext, scenario_id: str, run_id: str):
        self.js = js
        self.scenario_id = scenario_id
        self.run_id = run_id

    def _subject(self, channel: str) -> str:
        return f"sim.{self.scenario_id}.{self.run_id}.{channel}"

    async def stream_events(
        self, request: Request, is_replay: bool = False
    ) -> AsyncGenerator[dict, None]:
        sub = await self.js.subscribe(self._subject("events"), ordered_consumer=True)

        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await sub.next_msg(timeout=5.0)
                    yield {"data": msg.data.decode(), "event": "simulation_event"}
                    await msg.ack()
                except NatsTimeoutError:
                    if is_replay:
                        break
                except asyncio.CancelledError:
                    break
        finally:
            await sub.unsubscribe()

    async def listen_status(self) -> any:
        sub = await self.js.subscribe(self._subject("status"), ordered_consumer=True)

        try:
            msg = await sub.next_msg(timeout=None)
            return json.loads(msg.data.decode())
        except (NatsTimeoutError, asyncio.CancelledError):
            return None
        finally:
            await sub.unsubscribe()

    async def listen_all_statuses(self) -> AsyncGenerator[tuple[str, str, any], None]:
        sub = await self.js.subscribe("sim.*.*.status", ordered_consumer=True)
        try:
            while True:
                try:
                    msg = await sub.next_msg(timeout=5.0)
                    subject_parts = msg.subject.split(".")
                    if len(subject_parts) >= 4:
                        scenario_id = subject_parts[1]
                        run_id = subject_parts[2]
                        data = json.loads(msg.data.decode())
                        yield scenario_id, run_id, data
                    await msg.ack()
                except NatsTimeoutError:
                    continue
                except asyncio.CancelledError:
                    break
        finally:
            await sub.unsubscribe()
