# trafficjam-fe Patterns

## Stack

- React 19 + TypeScript (strict) + Vite (rolldown-vite)
- Package manager: bun
- Testing: vitest
- State: @tanstack/react-query (useQuery) for server state, useState for local
- Map: react-map-gl + mapbox-gl + deck.gl
- Geo: @turf/\*
- Icons: lucide-react
- Hooks: @uidotdev/usehooks, react-hotkeys-hook
- Styling: plain CSS, cn() utility for conditional classes
- No global state library — prop drilling + composition

## React Rules

- NEVER use useEffect. Always prefer useQuery, useMemo, useCallback, or hooks from @uidotdev/usehooks and react-hotkeys-hook
- Use useQuery from @tanstack/react-query for data fetching and async operations

## File Organization (Colocation)

- Components, hooks, types, and constants belong as close as possible to where they are used
- Only put things in a global/shared location if they are used across many parts of the app
- Same rule applies to types.ts, constants.ts, hooks, utils — colocate first, promote to shared only when needed

## Naming Conventions

- Files: kebab-case
- Components: PascalCase named exports (no default exports)
- Hooks: `use-` prefix files, `use` prefix functions
- Types: barrel exported via index.ts files
- Functional components only

## API Client Pattern

Each API client is a folder under `src/api/` with:

- `index.ts` — barrel exports
- `types.ts` — request/response interfaces
- `decoder.ts` — response transformation (snake_case → camelCase, stream parsing, etc.)
- `client.ts` — fetch functions, exported as a single object (e.g. `export const simulationApi = { start, stop }`)

Native fetch only (no axios). `import.meta.env.VITE_*` for service URLs.

## Collections

Network entities stored as `Map<string, T>` (not arrays)
