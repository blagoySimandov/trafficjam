import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from consumers import EventConsumer


@pytest.fixture
def consumer():
    js = AsyncMock()
    return EventConsumer(js, "scenario-1", "run-1")


def test_subject(consumer):
    assert consumer._subject("events") == "sim.scenario-1.run-1.events"
    assert consumer._subject("status") == "sim.scenario-1.run-1.status"


@pytest.mark.asyncio
async def test_stream_events_replay(consumer):
    msg = MagicMock()
    msg.data = b'{"type": "vehicle_entered"}'
    msg.ack = AsyncMock()

    sub = AsyncMock()
    sub.next_msg = AsyncMock(side_effect=[msg, Exception("timeout")])
    sub.__class__.__name__ = "Subscription"
    consumer.js.subscribe = AsyncMock(return_value=sub)

    request = AsyncMock()
    request.is_disconnected = AsyncMock(return_value=False)

    from nats.errors import TimeoutError as NatsTimeoutError
    sub.next_msg = AsyncMock(side_effect=[msg, NatsTimeoutError()])

    events = []
    async for event in consumer.stream_events(request, is_replay=True):
        events.append(event)

    assert len(events) == 1
    assert events[0]["data"] == '{"type": "vehicle_entered"}'
    assert events[0]["event"] == "simulation_event"
    msg.ack.assert_awaited_once()
    sub.unsubscribe.assert_awaited_once()


@pytest.mark.asyncio
async def test_stream_events_client_disconnect(consumer):
    sub = AsyncMock()
    consumer.js.subscribe = AsyncMock(return_value=sub)

    request = AsyncMock()
    request.is_disconnected = AsyncMock(return_value=True)

    events = []
    async for event in consumer.stream_events(request):
        events.append(event)

    assert events == []
    sub.unsubscribe.assert_awaited_once()


@pytest.mark.asyncio
async def test_listen_status_completed(consumer):
    msg = MagicMock()
    msg.data = json.dumps({"status": "completed"}).encode()

    sub = AsyncMock()
    sub.next_msg = AsyncMock(return_value=msg)
    consumer.js.subscribe = AsyncMock(return_value=sub)

    result = await consumer.listen_status()

    assert result == {"status": "completed"}
    sub.unsubscribe.assert_awaited_once()
