# Testing Guide for PR Reviewers

## Prerequisites

- Docker Desktop installed and running
- Java 17 or higher
- Maven 3.6+
- Python 3.10+ with pip
- A network.xml file for testing (or use the sample from the repo)

## Setup (from a fresh clone)

### 1. Configure environment variables

Database credentials are stored in a `.env` file (not committed to git). From the **project root**:

```bash
cp .env.example .env
```

Then set the following variables in `.env`:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=trafficjam
```

### 2. Start the database

```bash
docker-compose up -d
```

Verify it's running and healthy:
```bash
docker-compose ps
```

Expected: `trafficjam-db-1` with status `Up (healthy)`

### 3. Install Python test dependencies

```bash
cd trafficjam-be
pip install pytest pytest-asyncio asyncpg sqlmodel httpx
```

---

## Running Tests

### Java Build & Unit Tests

```bash
cd trafficjam-be/java
mvn clean test
```

Expected: `BUILD SUCCESS`

### Persistence Tests (Python)

These tests verify that the application can read and write to the PostgreSQL database.

From the `trafficjam-be` directory:

```bash
PYTHONPATH=. DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/trafficjam" pytest test/test_persistence.py -v
```

Expected: All tests pass.

---

## API & SSE Tests

### 1. Start the Spring Boot server

**Open a terminal and leave it running:**

```bash
cd trafficjam-be
./run-server.sh
```

Expected output:
```
Started Application in ~2 seconds
Tomcat started on port 8080 (http)
```

### 2. Run API tests

**In a NEW terminal:**

```bash
cd trafficjam-be/test
./test-api.sh
```

This will test: starting a simulation, checking status, error handling, CORS headers, and stopping a simulation.

Expected: All tests pass with `[OK]` messages in green.

### 3. Run SSE Streaming test

```bash
./test-sse-full.sh
```

This starts a 100-iteration simulation and verifies real-time event streaming via Server-Sent Events.

Expected: Events stream in real-time, ending with `COMPLETED` status.

---

## File Verification

After a simulation completes, verify output files are created:

```bash
ls -la trafficjam-be/java/output/{simulationId}
```

**Expected files:**
- `output_events.xml.gz`
- `output_plans.xml.gz`
- `output_network.xml.gz`
- `scorestats.txt`
- `stopwatch.txt`

---

## Common Issues

| Issue | Cause | Fix |
|---|---|---|
| "Simulation not found" error | Simulation ID doesn't exist or was cleaned up | Use a valid ID from a recent POST request |
| SSE stream closes immediately | Simulation already completed or invalid ID | Start a new simulation and connect quickly |
| "Population is empty" error | default-plans.xml not found | Verify `src/main/resources/default-plans.xml` exists |
| Database connection refused | Docker container not running | Run `docker-compose up -d` and check with `docker-compose ps` |
