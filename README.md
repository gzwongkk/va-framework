# va-framework v2

`main` now tracks the React-native rewrite of the visual analytics framework.
The stable Vue release is preserved on the `release/v1.0.0` branch.

## Current milestone

`v2.3.10` is the current graph-workbench patch.

The home route at `/` remains the graph workbench. This patch tightens the canonical Les Miserables path:

- the local and remote graph runtimes now use the canonical Vega `miserables.json` dataset at 77 nodes and 254 links
- the graph normalization layer accepts the raw Vega node/link format instead of relying on the earlier tiny local sample
- the multivariate color-field toggle no longer emits duplicate React keys
- remote execution now resolves its API base from the active host and the dev API listens on `0.0.0.0` for LAN-safe local development

The `v2.3` line now consists of:

- `v2.3.0`: graph-native query contracts, local graphology runtime, remote graph queries, and the first graph workspace
- `v2.3.1`: graph shell polish, full-graph default scope, visible route switching, and drawer cleanup
- `v2.3.2`: graph workbench foundation, URL-backed technique switching, and hierarchy dataset support
- `v2.3.3`: adjacency matrix brushing plus first integrated tree and multivariate technique renderers
- `v2.3.4`: matrix ordering and graph-analysis polish
- `v2.3.5`: tree data foundation, hierarchy pathing, and flare metadata checks
- `v2.3.6`: explicit and implicit tree-technique polish with selected-path highlighting
- `v2.3.7`: multivariate field profiles, missing-value handling, and encoding groundwork
- `v2.3.8`: multivariate layout polish, legends, and facet-aware analytical summaries
- `v2.3.9`: graph workbench hardening, guidance, accessibility labels, and regression coverage
- `v2.3.10`: canonical Les Miserables dataset import, duplicate-key fix, and remote runtime cleanup

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
- `v2.3.8`: multivariate network techniques
- `v2.3.9`: graph workbench hardening
- `v2.3.10`: canonical Les Miserables dataset and remote runtime fixes
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

The graph workbench defaults to `miserables` + `force`, and also supports `flare` as the hierarchy dataset for the tree line.
The canonical Les Miserables dataset used here is the Vega sample graph with 77 nodes and 254 links.

## Graph workbench endpoints

- `GET /api/health`
- `GET /api/datasets`
- `POST /api/query`
- `POST /api/jobs`
- `GET /api/jobs/{id}`
