# va-framework v2

`main` now tracks the React-native rewrite of the visual analytics framework.
The stable Vue release is preserved on the `release/v1.0.0` branch.

## Current milestone

`v2.2.9` is the final `v2.2` update. It keeps the cars workflow intact and sets the UI layer on a real `shadcn/ui + Radix` foundation:

- a responsive `1600×1000` desktop target, with additional `1440×900` and workstation shell presets
- a `shadcn/ui`-style shared source package in `packages/ui`, backed by Radix primitives instead of custom overlay/toggle implementations
- a Radix `Sheet`-based right drawer for the development-only `Devtools` panel
- Radix `ToggleGroup` controls for execution mode, origin filters, and UI studio presets
- Radix `ScrollArea` and `Separator` primitives in the shared UI layer, plus a shadcn-style `Table` baseline for records
- a root `tsconfig.json` so the shadcn CLI can recognize the monorepo instead of failing at the repo root
- a bundled local Roboto variable font so the UI no longer depends on a remote font source
- a lighter React dev path by splitting the large shell into smaller modules and optimizing `d3` / `lucide-react` imports in Next
- a more iOS-like default corner language, with softer shell, panel, and control radii across the workspace
- a webpack-based default `pnpm dev:web` path for slow or NAS-backed filesystems, with `pnpm dev:web:turbo` kept as an opt-in fast path
- a dedicated persisted UI preference store separate from the data coordination model
- tokenized shell, control, button, badge, and chart styling driven by CSS custom properties
- a reworked D3 scatterplot surface that now inherits theme presets alongside the surrounding shell
- persisted local UI preferences so the active studio preset survives a refresh
- shared dataset, query, and job contracts in `packages/contracts`
- a coordination model in `packages/view-system`
- FastAPI dataset registry, query execution, and background job endpoints
- TanStack Query for incoming async data and job polling
- Zustand for persisted coordination state
- a browser-runtime local query fallback for small datasets, with DuckDB-Wasm still available for heavier local work

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

## v2.2.9 endpoints

- `GET /api/health`
- `GET /api/datasets`
- `POST /api/query`
- `POST /api/jobs`
- `GET /api/jobs/{id}`
