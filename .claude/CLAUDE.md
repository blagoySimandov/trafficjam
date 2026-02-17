# Code Style
- No comments in code unless specifically asked
- Functions must be 5-20 lines. Split larger ones
- Prefer adding a dependency over writing boilerplate
- When writing React, avoid useEffect. Prefer useQuery, useMemo, useCallback, or hooks from @uidotdev/usehooks and react-hotkeys-hook

# Project Overview
Traffic simulator with three services, each a top-level folder:

1. **map-data-service** — Python FastAPI service serving OSM network data (nodes, links, buildings, transport routes) to the frontend. Use `/map-data-service` skill for patterns
2. **trafficjam-be/java** — Java Spring Boot service wrapping MatSim simulation engine. Outputs events XML. Use `/trafficjam-be` skill for patterns
3. **trafficjam-fe** — React frontend with two modes: map editor and simulation visualizer. Use `/trafficjam-fe` skill for patterns

# Running Services
- **Frontend**: `cd trafficjam-fe && bun dev` (Vite on :5173)
- **Map service**: `cd map-data-service && uvicorn main:app --reload` (FastAPI on :8000)
- **Java backend**: `cd trafficjam-be/java && mvn spring-boot:run` (Spring Boot on :8080)
- **Database**: `make run` (PostgreSQL + PostGIS via Docker)
