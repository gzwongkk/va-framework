# va-framework v2

`main` tracks the React-native rewrite of the visual analytics framework.
The stable Vue release remains on the `release/v1.0.0` branch.

## Current milestone

`v2.3.22` completes the starter integration revision.

The framework is now starter-first instead of gallery-first:

- `/` is the unified starter workbench
- users can switch between the two first-class data kinds currently supported:
  - `tabular`
  - `graph`
- the shell keeps one shared product shape while the active dataset, starter variant, and runtime change
- the gallery and example routes stay available as reference material and presets on top of the same framework contracts

This revision also prepares the repo for later expansion without forcing the UX there too early:

- dataset descriptors now carry starter metadata
- the frontend has pluggable kind-adapter contracts
- the view system now includes multi-view-ready layout, dataset-binding, and coordination-channel contracts
- the shipped UX still stays one-main-canvas-at-a-time for the `v2.3` line

## v2.3.19 to v2.3.22

- `v2.3.19`: starter metadata, adapter contracts, and multi-view-ready state foundations
- `v2.3.20`: unified starter shell and generic tabular starter path
- `v2.3.21`: generic graph starter path
- `v2.3.22`: preset refactor, starter-first routing, and hardening

## Current product shape

Starter home:

- `tabular / cars / scatter` is the default first load
- `penguins` extends the tabular starter with `splom`
- `stocks` extends the tabular starter with `time-series`
- `miserables` is the primary graph starter with `force` and `matrix`
- `flare` exposes the `hierarchy` starter
- `energy` exposes the `flow` starter
- `earthquakes` stays seed-only until the `v2.4.0` spatio-temporal line

Reference routes:

- `/`: unified starter workbench
- `/cars`: backwards-compatible alias for `tabular / cars / scatter`
- `/gallery`: curated reference gallery
- `/examples/[exampleId]`: example-specific route layer

## Workspace layout

- `apps/web`: Next.js App Router frontend
- `apps/api`: FastAPI backend
- `packages/ui`: shadcn/Radix-based component layer
- `packages/contracts`: shared TypeScript contracts and schemas
- `packages/view-system`: starter, layout, and coordination contracts
- `packages/vis-core`: native D3-based visualization primitives

## Core stack

- `TanStack Query` for async server-state work
- `Zustand` for persisted coordination state
- `DuckDB-Wasm + Apache Arrow` for local tabular analytics
- `graphology` for local graph modeling and metrics
- native D3 visualization primitives in `packages/vis-core`

## Development

This repo uses `pnpm` workspaces for the JavaScript side and Python 3.11+ for the API.

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

Or run both together:

```bash
pnpm dev
```

If the repo lives on a NAS or another slow filesystem, prefer the default webpack-based `pnpm dev:web`.
If you move the repo to a local SSD, you can try:

```bash
pnpm dev:web:turbo
```

The frontend runs at <http://localhost:3000>.
The backend health endpoint is <http://127.0.0.1:8000/api/health>.

## API endpoints

- `GET /api/health`
- `GET /api/datasets`
- `POST /api/query`
- `POST /api/jobs`
- `GET /api/jobs/{id}`

## Notes

- The canonical Les Miserables dataset in this repo is the Vega sample graph with `77` nodes and `254` links.
- The current framework is designed to accept more data kinds later through adapters instead of hardcoding only tabular and graph paths.
- The current framework is also ready for later multi-view work through shared layout and coordination contracts, even though the shipped `v2.3` UX still centers on one active canvas.
