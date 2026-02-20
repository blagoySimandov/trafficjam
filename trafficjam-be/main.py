import asyncio
import uuid
from contextlib import asynccontextmanager
from io import StringIO

import nats as nats_lib
from fastapi import FastAPI, Request, HTTPException
from sse_starlette import EventSourceResponse

from agents.models import PlanCreationRequest
from agents.plans import generate_plan_for_agent, MATSimXMLWriter
from agents.agent_creation import create_agents_from_network
from config import get_settings
from consumers import EventConsumer
from db import engine, async_session_factory, Base, RunRepository, RunStatus

MAX_AGENTS = 1000


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.state.nc = await nats_lib.connect(settings.nats_url)
    app.state.js = app.state.nc.jetstream()
    yield
    await app.state.nc.drain()
    await engine.dispose()


app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "Hello World! This is the main page."}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/plan_creation")
async def plan_creation(request: PlanCreationRequest):
    writer = MATSimXMLWriter()
    writer.create_plans_document()

    agents = create_agents_from_network(
        bounds=request.bounds,
        buildings=request.buildings,
        transport_routes=[],
        country_code=request.country_code,
    )

    if len(agents) > MAX_AGENTS:
        agents = agents[:MAX_AGENTS]

    for agent in agents:
        plan = generate_plan_for_agent(agent, request.buildings)
        if plan:
            writer.add_person_plan(agent.id, plan)

    stream = StringIO()
    writer.write_to_stream(stream)
    xml_content = stream.getvalue()

    with open("output/test.xml", "w", encoding="utf-8") as f:
        f.write(xml_content)
    return


@app.get("/scenarios/{scenario_id}/runs/{run_id}/events/stream")
async def stream_run_events(scenario_id: str, run_id: str, request: Request):
    try:
        parsed_id = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(400, "Invalid run ID")

    repo = RunRepository(async_session_factory)
    run = await repo.get_run_by_scenario(scenario_id, parsed_id)
    if not run:
        raise HTTPException(404, "Run not found")

    is_replay = run.status == RunStatus.COMPLETED
    consumer = EventConsumer(request.app.state.js, scenario_id, str(parsed_id))

    if not is_replay:
        asyncio.create_task(_update_status_on_complete(consumer, parsed_id))

    return EventSourceResponse(consumer.stream_events(request, is_replay))


async def _update_status_on_complete(consumer: EventConsumer, run_id: uuid.UUID):
    status = await consumer.listen_status()
    if status in ("completed", "failed"):
        repo = RunRepository(async_session_factory)
        new_status = RunStatus.COMPLETED if status == "completed" else RunStatus.FAILED
        await repo.update_status(run_id, new_status)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
