# Gallery Contributor Guide

This guide explains how to extend the `v2.3.x` analytics gallery line without bypassing the shared framework.

## 1. Add a dataset

1. Vendor the source snapshot into both:
   - `apps/web/public/datasets`
   - `apps/api/data`
2. Normalize the snapshot to JSON for the current gallery line.
3. Register the dataset in:
   - `apps/web/lib/data/starter-datasets.ts`
   - `apps/api/app/registry.py`
4. Fill in:
   - `category`
   - `featuredExampleIds`
   - `previewSummary`
   - `provenance`
   - `schema`
   - `execution`
5. Add or extend API tests in `apps/api/tests/test_data_foundation.py` so the new dataset is visible through `/api/datasets` and queryable through `/api/query`.

## 2. Add a visualization adapter

1. Define the example in `apps/web/lib/visualization-catalog.ts`.
2. Choose a stable `exampleId`, `routePath`, dataset ids, provenance label, and provenance URL.
3. Keep low-level rendering primitives in `packages/vis-core`.
4. Keep workbench composition in `apps/web/components/workspace`.
5. Register the shell in `apps/web/components/workspace/visualization-example-router.tsx`.
6. Make the example shell render inside the shared three-zone workbench:
   - control rail
   - main canvas
   - detail rail
7. Use `VisualizationProvenancePanel` so the example and dataset attribution stay consistent with the rest of the gallery.

## 3. Wire controls into the shared shell

1. Store the current example id with `setActiveVisualizationId`.
2. Keep example control values in `visualizationControlValues` through `setVisualizationControlValues`.
3. Keep query state in the existing data path:
   - `build...Query(...)`
   - `planExecution(...)`
   - `useLocalPreviewQuery(...)`
   - `useRemotePreviewQuery(...)`
4. Keep interaction state in the coordination store:
   - `setSelection(...)`
   - `setViewport(...)`
   - `setFilters(...)`
   - `setLastQuery(...)`
5. Prefer visible shadcn/Radix controls over hidden or keyboard-only switching.

## 4. Route integration

The gallery line currently uses:

- `/` for the graph home
- `/gallery` for browsing examples and datasets
- `/examples/[exampleId]` for registry-backed workbench routes
- `/cars` for the reference single-view route

New example adapters should register under `/examples/[exampleId]` first. Promote them to a top-level route only when the milestone requires it.

## 5. Provenance requirements

Every dataset descriptor must include provenance metadata.

Every example definition must include:

- `provenanceLabel`
- `provenanceUrl`

Every example shell should render `VisualizationProvenancePanel`.

## 6. Quality gate

Before tagging a gallery release, run:

```bash
pnpm typecheck
pnpm lint
pnpm --filter @va/web test
pnpm --filter @va/web build
python -m pytest apps/api/tests
```

Add or update:

- analytics helper tests in `apps/web/lib/analytics`
- route or registry smoke tests for new example routes
- API dataset/query coverage for new registry entries
