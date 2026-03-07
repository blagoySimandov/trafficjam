# TrafficJam Architecture

TrafficJam is a full-stack web application designed for large-scale transportation modeling and simulation. It provides a visual interface for managing urban scenarios, configuring agent (person/vehicle) behaviour, and dispatching simulations to a Java-based MATSim engine.

## System Components

The project is split into four primary architectural components:

1. **Frontend (`trafficjam-fe`)**: A React/TypeScript Single Page Application (SPA).
2. **Backend (`trafficjam-be`)**: A Python/FastAPI backend server.
3. **Map Data Service (`map-data-service`)**: A Python utility service handling OpenStreetMap data.
4. **Message Broker (NATS)**: Handles asynchronous communication between the backends and the MATSim simulation engine.

*Note: The actual Java MATSim engine (`simengine`) runs as a separate worker service that listens to NATS queues, though its code lives outside this specific repository context.*

---

## 1. Frontend (`trafficjam-fe`)

The frontend is built with **React**, **TypeScript**, and **Vite**.

* **Mapping UI:** Utilises map visualisation libraries (e.g., Deck.gl / Mapbox / Leaflet interfaces) to render the `network.xml` graphs and animate `output_events.xml.gz` using WebGL.
* **State Management:** Extensively uses custom React Hooks (`src/hooks`) to manage complex, decoupled state (e.g., `use-scenario-manager`, `use-live-simulation`, `use-leg-histogram`).
* **Data API (`src/api/*/client.ts`)**: Pure TypeScript modules encapsulating all `fetch` requests and JSON parsing to the backend API.
* **OSM / XML Translation:** Handles the conversion and serialisation of OpenStreetMap configurations into MATSim-compatible XML configurations via `src/osm/matsim.ts`.

## 2. Backend API (`trafficjam-be`)

The backend is built with **Python 3**, **FastAPI**, and **SQLAlchemy** (async).

* **RESTful Core:** Exposes standard endpoints (e.g., `GET /scenarios`, `POST /scenarios/{id}/runs/start`) used by the React frontend.
* **Interactive Docs:** Because it uses FastAPI and Pydantic models (in `schemas/`), interactive Swagger documentation is auto-generated at `/docs`.
* **Agent Generation (`agents/`)**: Contains the "magic" business logic. When a user requests a simulation, this module generates a synthetic population of agents (the `plans.xml`). It handles complex logic such as assigning homes, workplaces, schools, estimating shopping probabilities, and defining age thresholds.
* **Streaming & Real-time:** Uses Server-Sent Events (SSE) via `sse_starlette` to stream real-time simulation events (`EventConsumer`) from NATS back to the React UI.

## 3. Data Tier & Message Broker

### PostgreSQL Database

Configured via Alembic (`alembic/versions`), the relational database stores:

* **Scenarios**: The static network configurations and user-defined plan parameters.
* **Runs (Simulations)**: Individual instances of a scenario being run, carrying statuses (`RUNNING`, `COMPLETED`, `FAILED`).

### NATS JetStream (The "Glue")

Due to the long-running (and heavy) nature of the MATSim Java engine, the system cannot respond synchronously to a "Run Simulation" API request. Instead, we use **NATS JetStream** for robust async event messaging:

1. **Job Dispatch:** `trafficjam-be` issues a job containing the `network.xml` and the dynamically generated `plans.xml`.
2. **Simulation Stream:** The external `simengine` executes the MATSim co-evolutionary algorithm and publishes status updates and binary event data back to a NATS stream (e.g., `SIMULATIONS.sim.{scenario_id}`).
3. **UI Consumption:** The `trafficjam-be` reads from this NATS stream and forwards the events via SSE to the frontend `TrafficJam` visualizer.
4. **Object Store:** Finished simulation artifacts (like SimWrapper `.csv` and `.yaml` config files) are saved to NATS JetStream's native Object Store, making them accessible to the frontend via the `/simwrapper/{filename}` API endpoint.

---

## Data Flow: Running a Simulation

1. **Initiation:** The User clicks "Start Run" on the UI.
2. **Agent Generation:** The React App POSTs the bounds to `trafficjam-be`. The Python backend parses the network and generates a massive XML file representing all simulated persons (`trafficjam-be/agents/plans/xml_writer.py`).
3. **Dispatch:** The backend proxies a request pushing this XML payload over to the `simengine` worker.
4. **Execution:** The Java MATSim loop starts (Execute -> Score -> Replan -> Repeat).
5. **Event Streaming:** As MATSim outputs discrete events (e.g., `Agent1 leaves link1 and enters link2`), they hit NATS. `trafficjam-be` consumes them, translates them into JSON Server-Sent Events, and pipes them immediately into the frontend WebGL view context, achieving a "live visualizer" effect.
