import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from main import app, lifespan

# NOTE: These tests require a running PostgreSQL instance accessible via DATABASE_URL
# Run 'docker-compose up -d' before running these tests.

@pytest_asyncio.fixture(loop_scope="session")
async def test_app():
    # Context manager to handle startup/shutdown
    async with lifespan(app):
        yield app

@pytest.mark.asyncio(loop_scope="session")
async def test_health(test_app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio(loop_scope="session")
async def test_create_job(test_app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/jobs")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PENDING"
    assert "id" in data
    return data["id"]

@pytest.mark.asyncio(loop_scope="session")
async def test_create_event(test_app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First create a job
        response = await client.post("/jobs")
        assert response.status_code == 200
        job_id = response.json()["id"]
        
        event_data = {
            "type": "simulation_step",
            "payload": '{"step": 1, "vehicles": 10}'
        }
        
        response = await client.post(f"/jobs/{job_id}/events", json=event_data)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "simulation_step"
    assert data["job_id"] == job_id

@pytest.mark.asyncio(loop_scope="session")
async def test_get_job_events(test_app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create a job
        response = await client.post("/jobs")
        job_id = response.json()["id"]
        
        # Create two events
        await client.post(f"/jobs/{job_id}/events", json={"type": "e1", "payload": "p1"})
        await client.post(f"/jobs/{job_id}/events", json={"type": "e2", "payload": "p2"})
        
        response = await client.get(f"/jobs/{job_id}/events")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["type"] == "e1"
    assert data[1]["type"] == "e2"
