from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from database import init_db, get_session
from db_models import Job, Event

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database on startup
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)
from io import StringIO

from fastapi import FastAPI

from models import PlanCreationRequest
from agents.plans import generate_plan_for_agent, MATSimXMLWriter
from agents.agent_creation import create_agents_from_network

app = FastAPI()

MAX_AGENTS = 1000


@app.get("/")
def root():
    return {"message": "Hello World! This is the main page."}


@app.get("/health")
def health():
    return {"status": "ok"}

# --- Persistence Endpoints ---

@app.post("/jobs", response_model=Job)
async def create_job(session: AsyncSession = Depends(get_session)):
    """Create a new job with PENDING status"""
    job = Job()
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job

@app.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: int, session: AsyncSession = Depends(get_session)):
    """Get job details by ID"""
    job = await session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/jobs/{job_id}/events", response_model=Event)
async def create_event(job_id: int, event_data: Event, session: AsyncSession = Depends(get_session)):
    """Create a new event for a specific job"""
    job = await session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # We create a new event instance to ensure we link it to the correct job_id
    event = Event(
        job_id=job_id,
        type=event_data.type,
        payload=event_data.payload
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event

@app.get("/jobs/{job_id}/events", response_model=List[Event])
async def get_job_events(job_id: int, session: AsyncSession = Depends(get_session)):
    """Get all events for a specific job"""
    # Check if job exists first
    job = await session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    statement = select(Event).where(Event.job_id == job_id)
    result = await session.exec(statement)
    return result.all()


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

    # TODO: make it write to postgre
    with open("output/test.xml", "w", encoding="utf-8") as f:
        f.write(xml_content)
    return


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
