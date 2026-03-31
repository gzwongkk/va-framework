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
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@va/ui';
import { D3ScatterPlot } from '@va/vis-core';
import { ChartNoAxesCombined, Cpu, Filter, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function formatCompactNumber(value: number) {
  return Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 1000 ? 0 : 1,
    notation: value >= 1000 ? 'compact' : 'standard',
  }).format(value);
}

const VIEW_ID = 'single-view-plot';

function formatMetric(value: number, suffix: string) {
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
  const datasetCatalog = useDatasetCatalog();
  const carsDataset = useMemo(
    () => datasetCatalog.data?.find((dataset) => dataset.id === CARS_DATASET_ID),
    [datasetCatalog.data],
  );

  const activeDatasetId = useCoordinationStore((state) => state.activeDatasetId);
  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const selectedId = useCoordinationStore((state) => state.selections[VIEW_ID]?.ids[0]);
  const setActiveDatasetId = useCoordinationStore((state) => state.setActiveDatasetId);
  const setFilters = useCoordinationStore((state) => state.setFilters);
  const setLastQuery = useCoordinationStore((state) => state.setLastQuery);
  const setPreferredExecutionMode = useCoordinationStore((state) => state.setPreferredExecutionMode);
  const setSelection = useCoordinationStore((state) => state.setSelection);

  const [originFilters, setOriginFilters] = useState<string[]>(DEFAULT_CARS_CONTROLS.originFilters);
  const [minHorsepower, setMinHorsepower] = useState(DEFAULT_CARS_CONTROLS.minHorsepower);
  const [weightCeiling, setWeightCeiling] = useState(DEFAULT_CARS_CONTROLS.weightCeiling);
  const [limit, setLimit] = useState(DEFAULT_CARS_CONTROLS.limit);

  const query = useMemo(
    () =>
      buildCarsQuery({
        executionMode: preferredExecutionMode,
        limit,
        minHorsepower,
        originFilters,
        weightCeiling,
      }),
    [limit, minHorsepower, originFilters, preferredExecutionMode, weightCeiling],
  );

  const executionPlan = useMemo(
    () => (carsDataset ? planExecution(carsDataset, query) : undefined),
    [carsDataset, query],
  );
  const resolvedExecutionMode = executionPlan?.mode ?? preferredExecutionMode;
  const localQuery = resolvedExecutionMode === 'local' ? { ...query, executionMode: 'local' as const } : query;
  const remoteQuery = resolvedExecutionMode === 'remote' ? { ...query, executionMode: 'remote' as const } : query;

  const localPreview = useLocalPreviewQuery(
    carsDataset,
    localQuery,
    Boolean(carsDataset && resolvedExecutionMode === 'local'),
  );
  const remotePreview = useRemotePreviewQuery(remoteQuery, Boolean(carsDataset && resolvedExecutionMode === 'remote'));
  const activePreview = resolvedExecutionMode === 'local' ? localPreview : remotePreview;
  const rows = useMemo(() => normalizeCarsRows(activePreview.data), [activePreview.data]);
  const summary = useMemo(() => summarizeCarsRows(rows), [rows]);
  const selectedCar = useMemo(() => findSelectedCar(rows, selectedId) ?? rows[0], [rows, selectedId]);
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

  const hasData = rows.length > 0;
  const initialLoading = datasetCatalog.isLoading || (activePreview.isLoading && !activePreview.data);
  const activeError = activePreview.error;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(31,160,189,0.18),_transparent_35%),linear-gradient(180deg,_#07131c_0%,_#081927_55%,_#eef5f8_55%,_#eef5f8_100%)] text-slate-100 xl:flex xl:items-center xl:justify-center xl:overflow-hidden">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:px-6 xl:h-[calc(100vh-2rem)] xl:min-h-0 xl:w-full xl:max-w-[calc((100vh-2rem)*1.6)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Card className="border-white/10 bg-slate-950/70 text-white shadow-2xl shadow-cyan-950/20 backdrop-blur xl:h-full xl:min-h-0">
          <CardHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Cars analytics</Badge>
                <Badge variant="outline">{resolvedExecutionMode}</Badge>
                <Badge variant="outline">{hasData ? `${summary.count} rows` : 'no rows'}</Badge>
              </div>
              <div>
                <CardTitle className="font-[family-name:var(--font-display)] text-3xl text-white">
                  Single-view workspace
                </CardTitle>
                <CardDescription className="mt-2 text-slate-300">
                  One chart, one query, one coordinated detail surface.
                </CardDescription>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Average MPG</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                  {formatMetric(summary.averageMpg, 'mpg')}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Average horsepower</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                  {formatMetric(summary.averageHorsepower, 'hp')}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Dominant origin</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{summary.dominantOrigin}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 xl:overflow-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Execution mode</p>
                <Cpu className="size-4 text-slate-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                {(['local', 'remote'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={preferredExecutionMode === mode ? 'default' : 'outline'}
                    onClick={() => setPreferredExecutionMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <p className="text-sm leading-6 text-slate-300">{executionPlan?.reasons[0] ?? 'Preparing dataset runtime.'}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Origin</p>
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
                        setOriginFilters((current) =>
                          current.includes(origin)
                            ? current.filter((value) => value !== origin)
                            : [...current, origin],
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
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Minimum horsepower</span>
                <span className="text-sm font-medium text-white">{minHorsepower} hp</span>
              </div>
              <input
                className="w-full accent-cyan-500"
                max={180}
                min={40}
                onChange={(event) => setMinHorsepower(Number(event.target.value))}
                type="range"
                value={minHorsepower}
              />
            </label>

            <label className="block space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Weight ceiling</span>
                <span className="text-sm font-medium text-white">{formatCompactNumber(weightCeiling)} lbs</span>
              </div>
              <input
                className="w-full accent-cyan-500"
                max={3800}
                min={1800}
                onChange={(event) => setWeightCeiling(Number(event.target.value))}
                step={50}
                type="range"
                value={weightCeiling}
              />
            </label>

            <label className="block space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Row limit</span>
                <span className="text-sm font-medium text-white">{limit}</span>
              </div>
              <input
                className="w-full accent-cyan-500"
                max={12}
                min={4}
                onChange={(event) => setLimit(Number(event.target.value))}
                type="range"
                value={limit}
              />
            </label>
          </CardContent>
        </Card>

        <section className="grid gap-6 xl:h-full xl:min-h-0 xl:grid-rows-[minmax(0,1fr)_minmax(0,340px)]">
          <D3ScatterPlot
            data={scatterData}
            emptyLabel={
              activeError
                ? activeError.message
                : initialLoading
                  ? 'Loading cars dataset...'
                  : 'No rows match the current controls.'
            }
            onSelect={(id) =>
              setSelection(VIEW_ID, {
                entity: 'cars',
                ids: [id],
                sourceViewId: VIEW_ID,
              })
            }
            selectedId={selectedCar?.id}
            subtitle="Miles per gallon versus horsepower, drawn with D3 and kept warm during background refresh."
            title="Horsepower vs fuel efficiency"
            height={430}
            xLabel="Horsepower"
            yLabel="Miles per gallon"
          />

          <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5 xl:min-h-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <ChartNoAxesCombined className="size-5" />
                </div>
                <div>
                  <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Records</CardTitle>
                  <CardDescription>
                    The table stays synchronized with the active filters and point selection.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="xl:h-full xl:min-h-0">
              <div className="overflow-hidden rounded-2xl border border-slate-200 xl:h-full">
                <div className="max-h-[360px] overflow-auto select-none xl:h-full xl:max-h-none">
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
                        const isActive = row.id === selectedCar?.id;
                        return (
                          <tr
                            key={row.id}
                            className={isActive ? 'bg-cyan-50' : 'bg-white'}
                          >
                            {TABLE_COLUMNS.map((column) => (
                              <td
                                key={`${row.id}-${column.key}`}
                                className="border-b border-slate-100 px-3 py-2 text-slate-700"
                              >
                                <button
                                  className="w-full cursor-pointer select-none text-left"
                                  draggable={false}
                                  onClick={() =>
                                    setSelection(VIEW_ID, {
                                      entity: 'cars',
                                      ids: [row.id],
                                      sourceViewId: VIEW_ID,
                                    })
                                  }
                                  onMouseDown={(event) => event.preventDefault()}
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
        </section>

        <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5 xl:h-full xl:min-h-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <SlidersHorizontal className="size-5" />
              </div>
              <div>
                <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Selection</CardTitle>
                <CardDescription>
                  The detail surface stays pinned to the selected point.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 xl:overflow-auto">
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
                <div className="grid gap-3">
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
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Average weight</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatMetric(summary.averageWeight, 'lbs')}
                    </p>
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
      </div>
    </main>
  );
}
