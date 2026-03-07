# Local Development Guide

This guide explains how to get the TrafficJam stack running on your local machine for development.

## The Quick Way (Docker Compose)

The easiest way to run the entire TrafficJam stack (Frontend, Backend, Map Data Service, NATS, and the Java SimEngine) is using Docker Compose.

Make sure you have a `DATABASE_URL` environment variable exported, then run:

```bash
docker compose up -d
```

The application will be available at: `http://localhost:5173`

---

## Manual Setup (for active development)

If you are actively developing and need live-reloading, you can run the individual services manually.

### Prerequisites

* **Node.js** (v18+) and `npm`
* **Python 3.10+**
* **Docker** and **Docker Compose** (for running Postgres and NATS)
* *Note: Running the actual `simengine` manually requires a Java 17+ environment and Maven.*

---

## 1. Infrastructure Services (DB & Broker)

Both the Database (PostgreSQL) and the Message Broker (NATS JetStream) need to be running for the backend to function.

```bash
# If a docker-compose.yml exists at the root, start the services:
docker compose up -d
```

Ensure NATS is accessible (usually port `4222`) and PostgreSQL is accessible (usually port `5432`).

---

## 2. Backend (`trafficjam-be`)

The backend is a FastAPI application that handles database queries, NATS streaming, and agent plan generation.

### Setup Virtual Environment

Navigate to the backend directory and set up your Python environment:

```bash
cd trafficjam-be

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt 
# (Or use poetry/pipenv if applicable to your workflow)
```

### Database Migrations

Before running the server, ensure your local database schema is up-to-date.

```bash
alembic upgrade head
```

### Run the Server

Start the Uvicorn ASGI server with live-reloading enabled:

```bash
uvicorn main:app --reload --port 8001
```

Once running, you can view the auto-generated **interactive API documentation** at:
`http://localhost:8001/docs`

---

## 3. Frontend (`trafficjam-fe`)

The frontend is a Vite-powered React/TypeScript application.

### Setup and Run

Open a *new* terminal window:

```bash
cd trafficjam-fe

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The application will typically be available at: `http://localhost:5173`

*(Ensure your `.env.local` or `.env` file correctly points `VITE_TRAFFICJAM_BE_URL` to your local `8001` backend port).*
