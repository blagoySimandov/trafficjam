# Simulation Flow

## Overview

A simulation run goes through five stages: **plan generation → engine submission → event streaming → status resolution → output retrieval**.

```
Client
  │
  ├─ POST /scenarios/{id}/runs/start
  │       │
  │       ├─ 1. Generate MATSim plans XML
  │       │       (buildings + bounds → agent home/work assignments)
  │       │
  │       └─ 2. POST to SimEngine (multipart: network + plans XML)
  │                       │
  │                       └─ SimEngine runs MATSim
  │                               │
  │                               ├─ Publishes events  → NATS: sim.<scenario>.<run>.events
  │                               ├─ Publishes status  → NATS: sim.<scenario>.<run>.status
  │                               └─ Stores output files in NATS Object Store: sim-outputs-<run_id>
  │
  ├─ GET /scenarios/{id}/runs/{run_id}/events/stream   (SSE)
  │       └─ Replays past events from JetStream, then streams live
  │
  └─ GET /scenarios/{id}/runs/{run_id}/simwrapper/{filename}
          └─ Fetches output file from NATS Object Store
```

## Stages in Detail

### 1. Plan Generation

`POST /scenarios/{id}/runs/start` accepts a network file, `buildings` (JSON array), and `bounds` (JSON bounding box).

The backend calls `generate_plans_xml()` which assigns each synthetic agent a home and workplace drawn from the provided buildings, producing a MATSim-compatible `plans.xml`.

Agent behaviour (mode split, number of agents, etc.) is controlled by `plan_params` stored on the scenario.

### 2. Engine Submission

The network file and generated plans XML are POSTed to the **SimEngine** (Java/MATSim, default `:8080`) via `HttpSimEngineAdapter`. The engine returns a `simulation_id` and begins running asynchronously.

### 3. Event Streaming

MATSim publishes simulation events to NATS JetStream on the subject:

```
sim.<scenario_id>.<run_id>.events
```

The frontend subscribes via `GET .../events/stream`, which returns a **Server-Sent Events** response. The `EventConsumer` replays all buffered events from JetStream before switching to live delivery, so late-joining clients get the full event history.

### 4. Status Resolution

A background task (`monitor_all_statuses`) subscribes to:

```
sim.*.*.status
```

When the SimEngine publishes a terminal status (`completed`, `failed`, `stopped`), the task updates the run's status in the database. The SSE stream closes automatically once `COMPLETED` is detected.

### 5. Output Retrieval

After the run completes, SimEngine stores output files (CSV, YAML, JSON) in a NATS **Object Store** bucket named `sim-outputs-<run_id>`. The frontend fetches these via:

```
GET /scenarios/{id}/runs/{run_id}/simwrapper/{filename}
```

Files are served with `Cache-Control: public, max-age=3600`.

## Run Statuses

| Status      | Meaning                                      |
|-------------|----------------------------------------------|
| `pending`   | Run created, not yet submitted to SimEngine  |
| `running`   | SimEngine accepted the run                   |
| `completed` | MATSim finished successfully                 |
| `failed`    | SimEngine or plan generation error           |
