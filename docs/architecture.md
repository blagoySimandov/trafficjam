# Architecture

## Services

```
┌─────────────────┐     OSM network data      ┌──────────────────────┐
│  trafficjam-fe  │ ◄────────────────────────  │   map-data-service   │
│   (React :5173) │                            │   (FastAPI :8000)    │
│                 │  scenario/run management   │   PostGIS + OSM      │
│                 │ ──────────────────────────► │                      │
│                 │                            │   trafficjam-be      │
│                 │ ◄── SSE events ────────────  │   (FastAPI :8001)   │
└─────────────────┘                            └──────────┬───────────┘
                                                          │
                                               HTTP multipart (network + plans)
                                                          │
                                               ┌──────────▼───────────┐
                                               │     simengine        │
                                               │  (Spring Boot :8080) │
                                               │  MATSim simulation   │
                                               └──────────┬───────────┘
                                                          │
                                               ┌──────────▼───────────┐
                                               │    NATS JetStream    │
                                               │  events + status     │
                                               │  Object Store output │
                                               └──────────────────────┘
```

## Responsibilities

| Service | Role |
|---------|------|
| **map-data-service** | Serves OpenStreetMap nodes, links, buildings, and transport routes from a PostGIS database for a given bounding box |
| **trafficjam-be** | Orchestrates simulation runs: generates MATSim plans XML, submits to simengine, streams events back to the frontend via SSE |
| **simengine** | Wraps MATSim; accepts a network file + plans XML, runs the simulation, publishes events and output files to NATS |
| **trafficjam-fe** | Map editor (draw network) and simulation visualiser (replay events) |

## Data Stores

**PostgreSQL + PostGIS** — used by `map-data-service` to store pre-processed OSM data (nodes, links, buildings, transport routes) with spatial indexes for bounding-box queries.

**NATS JetStream** — used by `trafficjam-be` and `simengine` for:
- `sim.<scenario_id>.<run_id>.events` — simulation event stream
- `sim.<scenario_id>.<run_id>.status` — run status updates
- Object Store `sim-outputs-<run_id>` — post-simulation output files (CSV, YAML, JSON)

## Key Flows

**Loading map data** — The frontend requests `GET /network?min_lat=...` from `map-data-service`, which runs a PostGIS `ST_Intersects` query and returns nodes, links, buildings, and transport routes for the visible area.

**Running a simulation** — See [`trafficjam-be/docs/simulation-flow.md`](../trafficjam-be/docs/simulation-flow.md).
