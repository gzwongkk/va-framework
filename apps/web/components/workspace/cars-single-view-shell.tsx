'use client';

import {
  buildCarsQuery,
  CARS_DATASET_ID,
  CARS_ORIGIN_OPTIONS,
  DEFAULT_CARS_CONTROLS,
  findSelectedCar,
  normalizeCarsRows,
  summarizeCarsRows,
  toScatterPlotData,
} from '@/lib/analytics/cars-analytics';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import { useCoordinationStore } from '@/lib/coordination-store';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@va/ui';
import { ScatterPlot } from '@va/vis-core';
import { ChartNoAxesCombined, Cpu, Filter, SlidersHorizontal } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';

function formatCompactNumber(value: number) {
  return Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 1000 ? 0 : 1,
    notation: value >= 1000 ? 'compact' : 'standard',
  }).format(value);
}

function formatAverage(value: number, suffix: string) {
  if (!Number.isFinite(value) || value === 0) {
    return `0 ${suffix}`;
  }

  return `${value.toFixed(1)} ${suffix}`;
}

const TABLE_COLUMNS = [
  { key: 'name', label: 'Model' },
  { key: 'origin', label: 'Origin' },
  { key: 'horsepower', label: 'Horsepower' },
  { key: 'milesPerGallon', label: 'MPG' },
  { key: 'weightInLbs', label: 'Weight (lbs)' },
] as const;

export function CarsSingleViewShell() {
  const [isPending, startTransition] = useTransition();
  const datasetCatalog = useDatasetCatalog();
  const carsDataset = datasetCatalog.data?.find((dataset) => dataset.id === CARS_DATASET_ID);

  const activeDatasetId = useCoordinationStore((state) => state.activeDatasetId);
  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const selectedId = useCoordinationStore((state) => state.selections['single-view-plot']?.ids[0]);
  const setActiveDatasetId = useCoordinationStore((state) => state.setActiveDatasetId);
  const setFilters = useCoordinationStore((state) => state.setFilters);
  const setLastQuery = useCoordinationStore((state) => state.setLastQuery);
  const setPreferredExecutionMode = useCoordinationStore((state) => state.setPreferredExecutionMode);
  const setSelection = useCoordinationStore((state) => state.setSelection);

  const [originFilters, setOriginFilters] = useState<string[]>(DEFAULT_CARS_CONTROLS.originFilters);
  const [minHorsepower, setMinHorsepower] = useState(DEFAULT_CARS_CONTROLS.minHorsepower);
  const [weightCeiling, setWeightCeiling] = useState(DEFAULT_CARS_CONTROLS.weightCeiling);
  const [limit, setLimit] = useState(DEFAULT_CARS_CONTROLS.limit);

  const deferredOriginFilters = useDeferredValue(originFilters);
  const deferredMinHorsepower = useDeferredValue(minHorsepower);
  const deferredWeightCeiling = useDeferredValue(weightCeiling);
  const deferredLimit = useDeferredValue(limit);

  const query = useMemo(
    () =>
      buildCarsQuery({
        executionMode: preferredExecutionMode,
        limit: deferredLimit,
        minHorsepower: deferredMinHorsepower,
        originFilters: deferredOriginFilters,
        weightCeiling: deferredWeightCeiling,
      }),
    [
      deferredLimit,
      deferredMinHorsepower,
      deferredOriginFilters,
      deferredWeightCeiling,
      preferredExecutionMode,
    ],
  );

  const executionPlan = carsDataset ? planExecution(carsDataset, query) : undefined;
  const resolvedExecutionMode = executionPlan?.mode ?? preferredExecutionMode;
  const localQuery = resolvedExecutionMode === 'local' ? { ...query, executionMode: 'local' as const } : query;
  const remoteQuery = resolvedExecutionMode === 'remote' ? { ...query, executionMode: 'remote' as const } : query;

  const localPreview = useLocalPreviewQuery(
    carsDataset,
    localQuery,
    Boolean(carsDataset && resolvedExecutionMode === 'local'),
  );
  const remotePreview = useRemotePreviewQuery(remoteQuery, Boolean(carsDataset && resolvedExecutionMode === 'remote'));
  const activeResult = resolvedExecutionMode === 'local' ? localPreview.data : remotePreview.data;
  const rows = useMemo(() => normalizeCarsRows(activeResult), [activeResult]);
  const summary = useMemo(() => summarizeCarsRows(rows), [rows]);
  const selectedCar = findSelectedCar(rows, selectedId) ?? rows[0];
  const scatterData = useMemo(() => toScatterPlotData(rows, selectedId), [rows, selectedId]);

  useEffect(() => {
    if (carsDataset && activeDatasetId !== CARS_DATASET_ID) {
      setActiveDatasetId(CARS_DATASET_ID);
    }
  }, [activeDatasetId, carsDataset, setActiveDatasetId]);

  useEffect(() => {
    setFilters(query.filters);
    setLastQuery({
      ...query,
      executionMode: resolvedExecutionMode,
    });
  }, [query, resolvedExecutionMode, setFilters, setLastQuery]);

  const queryPending =
    minHorsepower !== deferredMinHorsepower ||
    weightCeiling !== deferredWeightCeiling ||
    limit !== deferredLimit ||
    originFilters !== deferredOriginFilters;

  const loading = datasetCatalog.isLoading || localPreview.isLoading || remotePreview.isLoading;
  const activeError = localPreview.error ?? remotePreview.error;

  return (
    <section className="grid gap-6">
      <Card className="border-white/10 bg-slate-950/60 text-white shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <CardHeader className="gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">v2.2.1 single-view analytics</Badge>
            <Badge variant="outline">Cars workflow</Badge>
            <Badge variant="outline">{resolvedExecutionMode} execution</Badge>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <CardTitle className="font-[family-name:var(--font-display)] text-4xl tracking-tight md:text-5xl">
                A focused analytic view now sits on top of the shared data substrate.
              </CardTitle>
              <CardDescription className="max-w-3xl text-base text-slate-300 md:text-lg">
                This milestone turns the v2.1 foundation into a real workflow: one chart, one control surface,
                one detail panel, and one supporting table. The same query contract can still resolve locally or
                through the FastAPI backend.
              </CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Rows</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{summary.count}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Average MPG</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                  {formatAverage(summary.averageMpg, 'mpg')}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Dominant Origin</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{summary.dominantOrigin}</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <SlidersHorizontal className="size-5" />
              </div>
              <div>
                <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Controls</CardTitle>
                <CardDescription>Bounded single-view controls that drive one query and one chart.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Execution mode</p>
              <div className="flex flex-wrap gap-2">
                {(['local', 'remote'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={preferredExecutionMode === mode ? 'default' : 'outline'}
                    onClick={() => startTransition(() => setPreferredExecutionMode(mode))}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-slate-600">{executionPlan?.reasons[0]}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Origin</p>
                <Filter className="size-4 text-slate-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                {CARS_ORIGIN_OPTIONS.map((origin) => {
                  const active = originFilters.includes(origin);
                  return (
                    <Button
                      key={origin}
                      variant={active ? 'default' : 'outline'}
                      onClick={() =>
                        startTransition(() =>
                          setOriginFilters((current) =>
                            current.includes(origin)
                              ? current.filter((value) => value !== origin)
                              : [...current, origin],
                          ),
                        )
                      }
                    >
                      {origin}
                    </Button>
                  );
                })}
              </div>
            </div>

            <label className="block space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Minimum horsepower</span>
                <span className="text-sm font-medium text-slate-900">{minHorsepower} hp</span>
              </div>
              <input
                className="w-full accent-cyan-600"
                max={180}
                min={40}
                onChange={(event) => startTransition(() => setMinHorsepower(Number(event.target.value)))}
                type="range"
                value={minHorsepower}
              />
            </label>

            <label className="block space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Weight ceiling</span>
                <span className="text-sm font-medium text-slate-900">{formatCompactNumber(weightCeiling)} lbs</span>
              </div>
              <input
                className="w-full accent-cyan-600"
                max={4500}
                min={1800}
                onChange={(event) => startTransition(() => setWeightCeiling(Number(event.target.value)))}
                step={100}
                type="range"
                value={weightCeiling}
              />
            </label>

            <label className="block space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Row limit</span>
                <span className="text-sm font-medium text-slate-900">{limit}</span>
              </div>
              <input
                className="w-full accent-cyan-600"
                max={12}
                min={4}
                onChange={(event) => startTransition(() => setLimit(Number(event.target.value)))}
                type="range"
                value={limit}
              />
            </label>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <ScatterPlot
            data={scatterData}
            emptyLabel={
              loading
                ? 'Refreshing the analytic view...'
                : activeError
                  ? activeError.message
                  : 'No rows match the current controls.'
            }
            title="Horsepower vs fuel efficiency"
            xLabel="Horsepower"
            yLabel="Miles per gallon"
            onSelect={(id) =>
              setSelection('single-view-plot', {
                entity: 'cars',
                ids: [id],
                sourceViewId: 'single-view-plot',
              })
            }
            selectedId={selectedCar?.id}
          />

          <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <ChartNoAxesCombined className="size-5" />
                </div>
                <div>
                  <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Supporting table</CardTitle>
                  <CardDescription>
                    The view remains single-focus, but the table stays synchronized with the active chart query.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="max-h-[360px] overflow-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        {TABLE_COLUMNS.map((column) => (
                          <th
                            key={column.key}
                            className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600"
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const active = row.id === selectedCar?.id;
                        return (
                          <tr
                            key={row.id}
                            className={active ? 'bg-cyan-50' : 'bg-white'}
                          >
                            {TABLE_COLUMNS.map((column) => (
                              <td
                                key={`${row.id}-${column.key}`}
                                className="border-b border-slate-100 px-3 py-2 text-slate-700"
                              >
                                <button
                                  className="w-full text-left"
                                  onClick={() =>
                                    setSelection('single-view-plot', {
                                      entity: 'cars',
                                      ids: [row.id],
                                      sourceViewId: 'single-view-plot',
                                    })
                                  }
                                  type="button"
                                >
                                  {String(row[column.key])}
                                </button>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Cpu className="size-5" />
                </div>
                <div>
                  <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Detail panel</CardTitle>
                  <CardDescription>The selected point becomes the active analytic focus.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCar ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected model</p>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-2xl text-slate-900">
                      {selectedCar.name}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedCar.origin} · {selectedCar.year}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Horsepower</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedCar.horsepower} hp</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Fuel efficiency</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedCar.milesPerGallon} mpg</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Weight</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatCompactNumber(selectedCar.weightInLbs)} lbs
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cylinders</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedCar.cylinders}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Select a point in the chart or a row in the table to inspect it here.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Analytic notes</CardTitle>
              <CardDescription>
                Single-view means the chart stays primary while the adjacent surfaces support interpretation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                Active mode: <span className="font-medium text-slate-900">{resolvedExecutionMode}</span>
              </p>
              <p>
                Average horsepower: <span className="font-medium text-slate-900">{formatAverage(summary.averageHorsepower, 'hp')}</span>
              </p>
              <p>
                Average weight: <span className="font-medium text-slate-900">{formatAverage(summary.averageWeight, 'lbs')}</span>
              </p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700">
                {JSON.stringify(
                  {
                    ...query,
                    executionMode: resolvedExecutionMode,
                  },
                  null,
                  2,
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {(queryPending || isPending) && !loading ? (
        <p className="text-sm text-slate-500">Applying control changes to the analytic view…</p>
      ) : null}
    </section>
  );
}
