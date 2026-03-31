'use client';

import {
  buildCarsQuery,
  CARS_DATASET_ID,
  CARS_ORIGIN_OPTIONS,
  CARS_ORIGIN_PALETTE,
  DEFAULT_CARS_CONTROLS,
  findSelectedCar,
  normalizeCarsRows,
  summarizeCarsRows,
  toScatterPlotData,
} from '@/lib/analytics/cars-analytics';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import { Badge, Button, Separator, cn } from '@va/ui';
import { D3ScatterPlot } from '@va/vis-core';
import { ChartNoAxesCombined, Cpu, Database, Filter, SlidersHorizontal } from 'lucide-react';
import { type KeyboardEvent, useEffect, useMemo, useState } from 'react';

const VIEW_ID = 'single-view-plot';
const EXECUTION_MODES = ['local', 'remote'] as const;
const ORIGIN_LEGEND = CARS_ORIGIN_OPTIONS.map((origin) => ({
  color: CARS_ORIGIN_PALETTE[origin],
  label: origin,
}));
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  notation: 'compact',
});

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

type ConsoleStatusTone = 'accent' | 'neutral' | 'warning' | 'error';

type SectionHeaderProps = {
  title: string;
  detail: string;
  icon: typeof Cpu;
};

type MetricReadoutProps = {
  label: string;
  value: string;
  tone?: 'accent' | 'neutral';
};

type RangeFieldProps = {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
  valueLabel: string;
};

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return '0';
  }

  if (Math.abs(value) >= 1_000) {
    return COMPACT_NUMBER_FORMATTER.format(value);
  }

  return value.toFixed(0);
}

function getStatusClasses(tone: ConsoleStatusTone) {
  switch (tone) {
    case 'accent':
      return 'border-cyan-200/80 bg-cyan-50 text-cyan-800';
    case 'warning':
      return 'border-amber-200/80 bg-amber-50 text-amber-800';
    case 'error':
      return 'border-rose-200/80 bg-rose-50 text-rose-800';
    default:
      return 'border-slate-300/80 bg-white/80 text-slate-700';
  }
}

function handleSelectableRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  onSelect: () => void,
) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onSelect();
  }
}

function SectionHeader({ detail, icon: Icon, title }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
          {title}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
      </div>
      <div className="rounded-xl border border-slate-300/80 bg-white/75 p-2.5 text-slate-600 shadow-sm shadow-slate-950/5">
        <Icon className="size-4" />
      </div>
    </div>
  );
}

function MetricReadout({ label, tone = 'neutral', value }: MetricReadoutProps) {
  return (
    <div
      className={cn(
        'grid gap-1 rounded-2xl border px-3 py-3',
        tone === 'accent'
          ? 'border-cyan-200/80 bg-cyan-50/70'
          : 'border-slate-300/75 bg-white/72',
      )}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-[1.45rem] leading-none text-slate-950">{value}</p>
    </div>
  );
}

function RangeField({
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}: RangeFieldProps) {
  return (
    <label className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </span>
        <span className="text-sm font-medium text-slate-800">{valueLabel}</span>
      </div>
      <input
        className="w-full"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

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
  const isRefreshing = activePreview.isFetching && Boolean(activePreview.data);
  const activeError = activePreview.error;
  const originSummary = originFilters.length > 0 ? originFilters.join(' / ') : 'All origins';

  const consoleStatus = useMemo(() => {
    if (activeError) {
      return {
        detail: activeError.message,
        label: 'Query unavailable',
        tone: 'error' as const,
      };
    }

    if (initialLoading) {
      return {
        detail: 'Priming the dataset registry and preview cache.',
        label: 'Loading workspace',
        tone: 'neutral' as const,
      };
    }

    if (isRefreshing) {
      return {
        detail: 'Controls update in the background while the current result stays visible.',
        label: 'Refreshing preview',
        tone: 'warning' as const,
      };
    }

    return {
      detail: executionPlan?.reasons[0] ?? 'Preview ready for interaction.',
      label: resolvedExecutionMode === 'local' ? 'Browser runtime active' : 'API runtime active',
      tone: 'accent' as const,
    };
  }, [activeError, executionPlan, initialLoading, isRefreshing, resolvedExecutionMode]);

  const selectRecord = (id: string) =>
    setSelection(VIEW_ID, {
      entity: 'cars',
      ids: [id],
      sourceViewId: VIEW_ID,
    });

  return (
    <main className="min-h-screen text-slate-900 xl:flex xl:items-center xl:justify-center xl:overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-[1700px] px-4 py-4 lg:px-6 xl:items-center xl:justify-center xl:px-6 xl:py-5">
        <div className="grid min-h-[760px] w-full overflow-hidden rounded-[30px] border border-slate-300/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92)_0%,_rgba(246,250,252,0.98)_100%)] shadow-[0_28px_90px_-48px_rgba(15,23,42,0.46)] xl:h-[min(100vh-2.5rem,900px)] xl:max-w-[calc(min(100vh-2.5rem,900px)*1.6)] xl:grid-cols-[270px_minmax(0,1fr)_310px] xl:grid-rows-[auto_minmax(0,1fr)]">
          <header className="col-span-full flex flex-wrap items-start justify-between gap-4 border-b border-slate-300/80 bg-[linear-gradient(180deg,_rgba(247,250,252,0.96)_0%,_rgba(241,246,248,0.92)_100%)] px-5 py-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
                va-framework / single-view analytics
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-[1.7rem] leading-none text-slate-950">
                Cars Analysis Console
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                A one-page operator workspace for filtering, inspecting, and comparing the active cars result set.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <Badge className="border-slate-300/80 bg-white/80 text-slate-700">{CARS_DATASET_ID}</Badge>
              <Badge className="border-slate-300/80 bg-white/80 text-slate-700">{resolvedExecutionMode}</Badge>
              <Badge className="border-slate-300/80 bg-white/80 text-slate-700">
                {hasData ? `${summary.count} rows` : 'no rows'}
              </Badge>
              <div
                aria-live="polite"
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
                  getStatusClasses(consoleStatus.tone),
                )}
              >
                <span
                  className={cn(
                    'size-2 rounded-full',
                    consoleStatus.tone === 'warning'
                      ? 'animate-pulse bg-amber-500'
                      : consoleStatus.tone === 'error'
                        ? 'bg-rose-500'
                        : consoleStatus.tone === 'accent'
                          ? 'bg-cyan-600'
                          : 'bg-slate-400',
                  )}
                />
                {consoleStatus.label}
              </div>
            </div>
          </header>

          <aside className="border-t border-slate-300/80 bg-[linear-gradient(180deg,_rgba(241,246,248,0.96)_0%,_rgba(236,242,245,0.92)_100%)] px-4 py-4 xl:min-h-0 xl:border-t-0 xl:border-r xl:px-5 xl:py-5">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_1fr]">
              <div className="grid gap-4">
                <SectionHeader
                  detail="Tune the preview window and query thresholds without leaving the working surface."
                  icon={SlidersHorizontal}
                  title="Control rail"
                />
                <div className="grid gap-2">
                  <MetricReadout label="Average MPG" tone="accent" value={formatMetric(summary.averageMpg, 'mpg')} />
                  <MetricReadout label="Average horsepower" value={formatMetric(summary.averageHorsepower, 'hp')} />
                  <MetricReadout label="Dominant origin" value={summary.dominantOrigin} />
                </div>
              </div>

              <Separator className="bg-slate-300/70" />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Execution mode
                    </p>
                    <Cpu className="size-4 text-slate-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {EXECUTION_MODES.map((mode) => {
                      const active = preferredExecutionMode === mode;
                      return (
                        <Button
                          key={mode}
                          className={cn(
                            'h-10 rounded-xl border text-xs font-semibold uppercase tracking-[0.18em]',
                            active
                              ? 'border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                              : 'border-slate-300/80 bg-white/80 text-slate-700 hover:bg-slate-50',
                          )}
                          onClick={() => setPreferredExecutionMode(mode)}
                          type="button"
                          variant="outline"
                        >
                          {mode}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{consoleStatus.detail}</p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Origin filter
                    </p>
                    <Filter className="size-4 text-slate-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CARS_ORIGIN_OPTIONS.map((origin) => {
                      const active = originFilters.includes(origin);
                      return (
                        <Button
                          key={origin}
                          className={cn(
                            'h-10 rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.16em]',
                            active
                              ? 'border-slate-950 bg-slate-950 text-white hover:bg-slate-900'
                              : 'border-slate-300/80 bg-white/80 text-slate-700 hover:bg-slate-50',
                          )}
                          onClick={() =>
                            setOriginFilters((current) =>
                              current.includes(origin)
                                ? current.filter((value) => value !== origin)
                                : [...current, origin],
                            )
                          }
                          type="button"
                          variant="outline"
                        >
                          <span
                            className="mr-2 size-2 rounded-full"
                            style={{ backgroundColor: CARS_ORIGIN_PALETTE[origin] }}
                          />
                          {origin}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <RangeField
                  label="Minimum horsepower"
                  max={180}
                  min={40}
                  onChange={setMinHorsepower}
                  value={minHorsepower}
                  valueLabel={`${minHorsepower} hp`}
                />

                <RangeField
                  label="Weight ceiling"
                  max={3800}
                  min={1800}
                  onChange={setWeightCeiling}
                  step={50}
                  value={weightCeiling}
                  valueLabel={`${formatCompactNumber(weightCeiling)} lbs`}
                />

                <RangeField
                  label="Row limit"
                  max={12}
                  min={4}
                  onChange={setLimit}
                  value={limit}
                  valueLabel={`${limit}`}
                />
              </div>
            </div>
          </aside>

          <section className="grid border-t border-slate-300/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(248,251,253,0.96)_100%)] xl:min-h-0 xl:border-t-0 xl:border-r xl:grid-rows-[minmax(0,1fr)_280px]">
            <div className="min-h-0 px-4 py-4 xl:px-5 xl:py-5">
              <D3ScatterPlot
                data={scatterData}
                emptyLabel={
                  activeError
                    ? activeError.message
                    : initialLoading
                      ? 'Loading cars dataset...'
                      : 'No rows match the current controls.'
                }
                height={480}
                legend={ORIGIN_LEGEND}
                onSelect={selectRecord}
                selectedId={selectedCar?.id}
                statusLabel={consoleStatus.label}
                statusTone={consoleStatus.tone}
                subtitle="Horsepower versus fuel efficiency for the active result set."
                title="Horsepower vs fuel efficiency"
                xLabel="Horsepower"
                yLabel="Miles per gallon"
              />
            </div>

            <div className="grid min-h-0 border-t border-slate-300/80 bg-[linear-gradient(180deg,_rgba(248,251,253,0.96)_0%,_rgba(243,247,250,0.98)_100%)] px-4 py-4 xl:px-5 xl:py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Records</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The table mirrors the current filters and keeps selection pinned to the focused record.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-300/80 bg-white/75 p-2.5 text-slate-600 shadow-sm shadow-slate-950/5">
                  <ChartNoAxesCombined className="size-4" />
                </div>
              </div>

              <div className="mt-4 min-h-0 overflow-hidden rounded-[24px] border border-slate-300/80 bg-white/86">
                <div className="h-full overflow-auto select-none">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
                      <tr>
                        {TABLE_COLUMNS.map((column) => (
                          <th
                            key={column.key}
                            className="border-b border-slate-300/80 px-3 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500"
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
                            aria-pressed={isActive}
                            className={cn(
                              'cursor-pointer select-none border-b border-slate-200/80 text-slate-700 outline-none transition-colors',
                              isActive
                                ? 'bg-cyan-50/90 text-slate-950'
                                : 'bg-white/95 hover:bg-slate-50/90 focus-visible:bg-slate-50',
                            )}
                            draggable={false}
                            onClick={() => selectRecord(row.id)}
                            onKeyDown={(event) => handleSelectableRowKeyDown(event, () => selectRecord(row.id))}
                            onMouseDown={(event) => event.preventDefault()}
                            role="button"
                            tabIndex={0}
                          >
                            {TABLE_COLUMNS.map((column, columnIndex) => (
                              <td
                                key={`${row.id}-${column.key}`}
                                className={cn(
                                  'px-3 py-2.5',
                                  columnIndex === 0 && isActive && 'shadow-[inset_3px_0_0_0_#2f607d] font-medium',
                                )}
                              >
                                {String(row[column.key])}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <aside className="border-t border-slate-300/80 bg-[linear-gradient(180deg,_rgba(243,247,249,0.96)_0%,_rgba(237,243,246,0.94)_100%)] px-4 py-4 xl:min-h-0 xl:border-t-0 xl:px-5 xl:py-5">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
              <SectionHeader
                detail="Inspect the focused record and read back the active query envelope without leaving the page."
                icon={Database}
                title="Detail rail"
              />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                {selectedCar ? (
                  <>
                    <div className="rounded-[24px] border border-slate-300/80 bg-white/82 p-4 shadow-sm shadow-slate-950/5">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Focused record
                      </p>
                      <p className="mt-3 font-[family-name:var(--font-display)] text-[1.8rem] leading-tight text-slate-950">
                        {selectedCar.name}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className="border-slate-300/80 bg-slate-100 text-slate-700">{selectedCar.origin}</Badge>
                        <Badge className="border-slate-300/80 bg-slate-100 text-slate-700">{selectedCar.year}</Badge>
                        <Badge className="border-slate-300/80 bg-slate-100 text-slate-700">{selectedCar.cylinders} cyl</Badge>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <MetricReadout label="Horsepower" tone="accent" value={`${selectedCar.horsepower} hp`} />
                      <MetricReadout label="Fuel efficiency" value={`${selectedCar.milesPerGallon} mpg`} />
                      <MetricReadout label="Weight" value={`${formatCompactNumber(selectedCar.weightInLbs)} lbs`} />
                      <MetricReadout label="Average weight" value={formatMetric(summary.averageWeight, 'lbs')} />
                    </div>
                  </>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300/90 bg-white/72 p-5 text-sm leading-6 text-slate-600">
                    Select a point in the chart or a row in the records table to inspect it here.
                  </div>
                )}

                <Separator className="bg-slate-300/70" />

                <div className="grid gap-3 rounded-[24px] border border-slate-300/80 bg-white/76 p-4 shadow-sm shadow-slate-950/5">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Query envelope
                  </p>
                  <div className="grid gap-3 text-sm text-slate-700">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500">Dataset</span>
                      <span className="font-medium text-slate-900">{CARS_DATASET_ID}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500">Runtime</span>
                      <span className="font-medium text-slate-900">{resolvedExecutionMode}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500">Origins</span>
                      <span className="text-right font-medium text-slate-900">{originSummary}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500">Horsepower floor</span>
                      <span className="font-medium text-slate-900">{minHorsepower} hp</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500">Weight ceiling</span>
                      <span className="font-medium text-slate-900">{formatCompactNumber(weightCeiling)} lbs</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500">Row limit</span>
                      <span className="font-medium text-slate-900">{limit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
