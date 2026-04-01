# va-framework v2

`main` now tracks the React-native rewrite of the visual analytics framework.
The stable Vue release is preserved on the `release/v1.0.0` branch.

## Current milestone

`v2.3.7` is the multivariate-network foundation patch.

The home route at `/` remains the graph workbench. This patch strengthens the multivariate network technique before the final technique-polish releases:

- field profiles for the active multivariate encodings in the detail rail
- clearer missing-value handling for color, size, and faceting instead of silently dropping nodes
- safer multivariate defaults so partial attribute coverage still renders analytical structure
- profile-aware groundwork for the next MVNV-inspired technique polish

The `v2.3` line now consists of:

- `v2.3.0`: graph-native query contracts, local graphology runtime, remote graph queries, and the first graph workspace
- `v2.3.1`: graph shell polish, full-graph default scope, visible route switching, and drawer cleanup
- `v2.3.2`: graph workbench foundation, URL-backed technique switching, and hierarchy dataset support
- `v2.3.3`: adjacency matrix brushing plus first integrated tree and multivariate technique renderers
- `v2.3.4`: matrix ordering and graph-analysis polish
- `v2.3.5`: tree data foundation, hierarchy pathing, and flare metadata checks
- `v2.3.6`: explicit and implicit tree-technique polish with selected-path highlighting
- `v2.3.7`: multivariate field profiles, missing-value handling, and encoding groundwork

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
- `v2.3.1`: graph shell polish
- `v2.3.2`: graph workbench foundation
- `v2.3.3`: adjacency matrix brush MVP
- `v2.3.4`: matrix ordering and graph-analysis polish
- `v2.3.5`: tree data foundation
- `v2.3.6`: tree techniques
- `v2.3.7`: multivariate network foundation
- `v2.3.7`: multivariate network foundation
- `v2.3.8`: multivariate network techniques
- `v2.3.9`: graph workbench hardening
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

- `/`: graph workbench
- `/cars`: cars single-view reference workflow

The graph workbench defaults to `miserables` + `force`, and also supports `flare` as the hierarchy dataset for the upcoming tree line.

## v2.3.2 endpoints

- `GET /api/health`
- `GET /api/datasets`
- `POST /api/query`
- `POST /api/jobs`
- `GET /api/jobs/{id}`
