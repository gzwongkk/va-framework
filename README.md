# va-framework v2

`main` now tracks the React-native rewrite of the visual analytics framework.
The stable Vue release is preserved on the `release/v1.0.0` branch.

## Current milestone

`v2.3.0` is the graph-data release. The default home route is now a graph-first single-view analytics workspace built around the Les Miserables network, while the cars workflow remains available at `/cars` as the tabular reference path.

This release adds:

- graph-native query contracts in `packages/contracts`, including discriminated `table` and `graph` result types
- dataset entity metadata so graph datasets can describe `nodes` and `links` alongside tabular schemas
- a graph-aware execution planner with `miserables` defaulting to local execution and remote parity still available
- a cached local `graphology` runtime for graph exploration in the browser
- remote graph query execution in FastAPI without introducing graph-specific endpoints
- a custom D3 force-directed graph primitive in `packages/vis-core`
- a new graph workspace at `/` with node search, community filters, weight-threshold filtering, and one-hop / two-hop neighborhood expansion
- a preserved cars single-view workflow at `/cars`
- continued use of the `shadcn/ui + Radix` shell, UI studio drawer, and desktop-targeted light-console workspace
- quiet background refresh for graph control changes, without blanking the current view

The core stack now includes:

- `TanStack Query` for async server-state work
- `Zustand` for persisted coordination state
- `DuckDB-Wasm + Apache Arrow` for tabular local analytics
- `graphology` for local graph data modeling and metrics
- custom D3 visualization primitives in `packages/vis-core`

The release ladder remains:

- `v2.0.0`: React shell and monorepo baseline
- `v2.1.0`: data foundation with shared contracts, coordinated state, and local/remote execution
- `v2.2.0`: single-view analytics
- `v2.3.0`: graph data
- `v2.4.0`: spatio-temporal data
- `v2.5.0`: multi-view coordination
- `v2.6.0`: spatial-ready foundations

## Workspace layout

- `apps/web`: Next.js App Router frontend
- `apps/api`: FastAPI backend
- `packages/ui`: shadcn-style component baseline
- `packages/contracts`: shared TypeScript contracts and schemas
- `packages/view-system`: workspace and view contracts
- `packages/vis-core`: visualization primitives

## Development

This repo now uses `pnpm` workspaces for the JavaScript side and Python 3.11+ for the API.

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

Or run both app processes together:

```bash
pnpm dev
```

If the repo stays on a NAS or another slow filesystem, prefer the default webpack-based `pnpm dev:web`.
If you move the repo to a local SSD and want the faster compiler path, use:

```bash
pnpm dev:web:turbo
```

The frontend runs at <http://localhost:3000>.
The backend health endpoint is available at <http://127.0.0.1:8000/api/health>.

Routes:

- `/`: Les Miserables graph workspace
- `/cars`: cars single-view reference workflow

## v2.3.0 endpoints

- `GET /api/health`
- `GET /api/datasets`
- `POST /api/query`
- `POST /api/jobs`
- `GET /api/jobs/{id}`
