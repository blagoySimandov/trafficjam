# TrafficJam Backend

FastAPI service that orchestrates traffic simulation runs. Generates MATSim agent plans, submits them to the simulation engine, and streams events back to the frontend via SSE over NATS JetStream.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
```

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

## Run

```bash
uvicorn main:app --reload --port 8001
```

## API Docs

| URL | Description |
|-----|-------------|
| `http://localhost:8001/docs` | Swagger UI — interactive docs |
| `http://localhost:8001/redoc` | ReDoc — reference docs |
| `http://localhost:8001/openapi.json` | Raw OpenAPI schema |

## Further Reading

- [Simulation flow](docs/simulation-flow.md) — run lifecycle in detail
