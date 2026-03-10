# Map Data Service

FastAPI service that serves [OpenStreetMap](https://www.openstreetmap.org/) network data (nodes, links, buildings, transport routes) stored in a PostGIS-enabled PostgreSQL database.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set your database URL:

```bash
cp .env.example .env
```

## Run

```bash
fastapi dev
```

## API Docs

| URL | Description |
|-----|-------------|
| `http://localhost:8000/docs` | Swagger UI — interactive docs |
| `http://localhost:8000/redoc` | ReDoc — reference docs |
| `http://localhost:8000/openapi.json` | Raw OpenAPI schema |
