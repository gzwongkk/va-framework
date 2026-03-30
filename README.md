# va-framework v2

`main` now tracks the React-native rewrite of the visual analytics framework.
The stable Vue release is preserved on the `release/v1.0.0` branch.

## Current milestone

`v2.1.0` is the current release candidate. It establishes the data foundation for the React rewrite:

- shared dataset, query, and job contracts in `packages/contracts`
- a coordination model in `packages/view-system`
- FastAPI dataset registry, query execution, and background job endpoints
- TanStack Query for incoming async data and job polling
- Zustand for persisted coordination state
- DuckDB-Wasm + Comlink for local preview execution in the browser worker

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

The frontend runs at <http://localhost:3000>.
The backend health endpoint is available at <http://127.0.0.1:8000/api/health>.

## v2.1.0 endpoints

- `GET /api/health`
- `GET /api/datasets`
- `POST /api/query`
- `POST /api/jobs`
- `GET /api/jobs/{id}`
