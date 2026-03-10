# TrafficJam

Agent-based traffic simulator built on [MATSim](https://www.matsim.org/). Draw a road network on a map, configure agent behaviour, and watch the simulation play back in real time.

## Services

| Service            | Description                                              | README                               |
| ------------------ | -------------------------------------------------------- | ------------------------------------ |
| `map-data-service` | FastAPI — serves OSM network data from PostGIS           | [README](map-data-service/README.md) |
| `trafficjam-be`    | FastAPI — orchestrates simulation runs via NATS + MATSim | [README](trafficjam-be/README.md)    |
| `simengine`        | Spring Boot — wraps MATSim, publishes events to NATS     | [README](simengine/README.md)        |
| `trafficjam-fe`    | React — map editor and simulation visualiser             | `trafficjam-fe/`                     |

## Running the stack

Infrastructure (PostgreSQL + PostGIS, NATS JetStream) is managed via `make`. Run `make help` for all available targets.

Start the application services individually:

```bash
cd map-data-service && uvicorn main:app --reload          # :8000
cd trafficjam-be  && uvicorn main:app --reload --port 8001 # :8001
cd simengine      && mvn spring-boot:run                   # :8080
cd trafficjam-fe  && bun dev                               # :5173
```

Or rebuild and start everything at once with Docker Compose:

```bash
make rebuild
```

Each service needs its own `.env` — see the service README for required variables.

## Docs

- [Architecture](docs/architecture.md) — how services connect, data stores, key flows
- [Simulation flow](trafficjam-be/docs/simulation-flow.md) — run life cycle in detail
- [Investigations](investigations/investigations.md) — research and decision records
- Some notable investigations to take into account:
  - How are agent plans created? [investigation](investigations/agent-plans/AGENT-PLANS.md)
  - How does MatSim scoring work? [investigation](investigations/MatSim-Scoring/investigation.md)
