# Map Data Service

FastAPI service that provides map data for the Traffic Jam application from a Neon PostgreSQL database with PostGIS.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
.venv\Scripts\activate      # Windows

pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and set your Neon database URL:

```bash
cp .env.example .env
```

## Run

```bash
fastapi dev
```

The API will be available at `http://localhost:8000`.

## API Docs

| URL | Description |
|-----|-------------|
| `http://localhost:8000/docs` | Interactive Swagger UI — try endpoints directly in the browser |
| `http://localhost:8000/redoc` | ReDoc — clean reference documentation |
| `http://localhost:8000/openapi.json` | Raw OpenAPI schema |
