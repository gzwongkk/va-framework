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
import { CarsRecordsTable } from '@/components/workspace/cars-records-table';
import {
  formatCompactNumber,
  formatMetric,
  MetricReadout,
  RangeField,
  SectionHeader,
  StatusPill,
} from '@/components/workspace/cars-shell-primitives';
import { UiStudioDrawer } from '@/components/workspace/ui-studio-drawer';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import { resolveChartTheme, resolveUiStudioVars } from '@/lib/ui-studio';
import { useUiStudioStore } from '@/lib/ui-studio-store';
import { Badge, Button, Separator, ToggleGroup, ToggleGroupItem } from '@va/ui';
import { D3ScatterPlot } from '@va/vis-core';
import { ChartNoAxesCombined, Cpu, Database, Filter, Settings2, SlidersHorizontal } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

const VIEW_ID = 'single-view-plot';
const EXECUTION_MODES = ['local', 'remote'] as const;
const SHOW_UI_STUDIO = process.env.NODE_ENV !== 'production';
const ORIGIN_LEGEND = CARS_ORIGIN_OPTIONS.map((origin) => ({
  color: CARS_ORIGIN_PALETTE[origin],
  label: origin,
}));

export function CarsSingleViewShell() {
  const datasetCatalog = useDatasetCatalog();
  const uiPrefs = useUiStudioStore((state) => state.prefs);
  const uiCssVars = useMemo(() => resolveUiStudioVars(uiPrefs), [uiPrefs]);
  const chartTheme = useMemo(() => resolveChartTheme(uiPrefs), [uiPrefs]);
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
  const [isStudioOpen, setIsStudioOpen] = useState(false);

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
    <main
      className="min-h-screen xl:flex xl:items-center xl:justify-center xl:overflow-hidden"
      data-ui-button={uiPrefs.buttonPreset}
      data-ui-density={uiPrefs.densityPreset}
      data-ui-radius={uiPrefs.radiusPreset}
      data-ui-shell={uiPrefs.shellPreset}
      data-ui-theme={uiPrefs.themePreset}
      style={
        {
          ...uiCssVars,
          background: 'var(--ui-page-background)',
          color: 'var(--ui-text-primary)',
        } as CSSProperties
      }
    >
      <div className="mx-auto flex min-h-screen w-full items-center justify-center px-3 py-3 sm:px-4 lg:px-5 xl:min-h-0 xl:px-6 xl:py-5">
        <div className="ui-studio-shell grid min-h-[760px] w-full overflow-hidden border xl:h-[min(calc(100vh-2.5rem),var(--ui-shell-target-height))] xl:w-[min(calc(100vw-3rem),var(--ui-shell-target-width))] xl:grid-cols-[var(--ui-shell-left-rail)_minmax(0,1fr)_var(--ui-shell-right-rail)] xl:grid-rows-[auto_minmax(0,1fr)]">
          <header className="ui-studio-header col-span-full flex flex-wrap items-start justify-between gap-4 border-b">
            <div>
              <p className="ui-studio-label font-semibold uppercase tracking-[0.28em]">
                va-framework / single-view analytics
              </p>
              <h1 className="ui-studio-shell-title mt-2 font-[family-name:var(--font-display)] leading-none">
                Cars Analysis Console
              </h1>
              <p className="ui-studio-body mt-2 max-w-2xl">
                A one-page operator workspace for filtering, inspecting, and comparing the active cars result set.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <Badge>{CARS_DATASET_ID}</Badge>
              <Badge>{resolvedExecutionMode}</Badge>
              <Badge>
                {hasData ? `${summary.count} rows` : 'no rows'}
              </Badge>
              <StatusPill label={consoleStatus.label} tone={consoleStatus.tone} />
              {SHOW_UI_STUDIO ? (
                <Button
                  className="ui-studio-toggle gap-2 px-3"
                  data-active={false}
                  data-button-style={uiPrefs.buttonPreset}
                  onClick={() => setIsStudioOpen(true)}
                  type="button"
                  variant="outline"
                >
                  <Settings2 className="size-4" />
                  Devtools
                </Button>
              ) : null}
            </div>
          </header>

          <aside className="ui-studio-rail border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_1fr]">
              <div className="grid gap-4">
                <SectionHeader
                  detail="Tune the preview window and query thresholds without leaving the working surface."
                  icon={SlidersHorizontal}
                  title="Control rail"
                />
                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Average MPG" tone="accent" value={formatMetric(summary.averageMpg, 'mpg')} />
                  <MetricReadout label="Average horsepower" value={formatMetric(summary.averageHorsepower, 'hp')} />
                  <MetricReadout label="Dominant origin" value={summary.dominantOrigin} />
                </div>
              </div>

              <Separator className="ui-studio-divider" />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                      Execution mode
                    </p>
                    <Cpu className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ToggleGroup
                      className="grid w-full grid-cols-2 gap-2"
                      onValueChange={(value) => {
                        if (value === 'local' || value === 'remote') {
                          setPreferredExecutionMode(value);
                        }
                      }}
                      type="single"
                      value={preferredExecutionMode}
                    >
                      {EXECUTION_MODES.map((mode) => (
                        <ToggleGroupItem
                          key={mode}
                          className="w-full text-xs font-semibold uppercase tracking-[0.18em]"
                          data-button-style={uiPrefs.buttonPreset}
                          value={mode}
                        >
                          {mode}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                  <p className="ui-studio-body">{consoleStatus.detail}</p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                      Origin filter
                    </p>
                    <Filter className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="flex flex-wrap gap-2"
                    onValueChange={(value) => setOriginFilters(value)}
                    type="multiple"
                    value={originFilters}
                  >
                    {CARS_ORIGIN_OPTIONS.map((origin) => (
                      <ToggleGroupItem
                        key={origin}
                        className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={origin}
                      >
                        <span
                          className="mr-2 size-2 rounded-full"
                          style={{ backgroundColor: CARS_ORIGIN_PALETTE[origin] }}
                        />
                        {origin}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
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

          <section className="ui-studio-stage grid border-t xl:min-h-0 xl:border-t-0 xl:border-r xl:grid-rows-[minmax(0,1fr)_var(--ui-shell-table-height)]">
            <div className="ui-studio-stage-panel min-h-0">
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
                theme={chartTheme}
                title="Horsepower vs fuel efficiency"
                xLabel="Horsepower"
                yLabel="Miles per gallon"
              />
            </div>

            <div className="ui-studio-stage-table grid min-h-0 border-t">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Records</p>
                  <p className="ui-studio-body mt-2">
                    The table mirrors the current filters and keeps selection pinned to the focused record.
                  </p>
                </div>
                <div className="ui-studio-icon-chip rounded-xl border p-2.5 shadow-sm shadow-slate-950/5">
                  <ChartNoAxesCombined className="size-4" />
                </div>
              </div>

              <CarsRecordsTable onSelect={selectRecord} rows={rows} selectedId={selectedCar?.id} />
            </div>
          </section>

          <aside className="ui-studio-detail border-t xl:min-h-0 xl:border-t-0">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
              <SectionHeader
                detail="Inspect the focused record and read back the active query envelope without leaving the page."
                icon={Database}
                title="Detail rail"
              />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                {selectedCar ? (
                  <>
                    <div className="ui-studio-surface border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                        Focused record
                      </p>
                      <p className="mt-3 font-[family-name:var(--font-display)] text-[1.8rem] leading-tight text-[var(--ui-text-primary)]">
                        {selectedCar.name}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{selectedCar.origin}</Badge>
                        <Badge>{selectedCar.year}</Badge>
                        <Badge>{selectedCar.cylinders} cyl</Badge>
                      </div>
                    </div>

                    <div className="ui-studio-metric-stack grid">
                      <MetricReadout label="Horsepower" tone="accent" value={`${selectedCar.horsepower} hp`} />
                      <MetricReadout label="Fuel efficiency" value={`${selectedCar.milesPerGallon} mpg`} />
                      <MetricReadout label="Weight" value={`${formatCompactNumber(selectedCar.weightInLbs)} lbs`} />
                      <MetricReadout label="Average weight" value={formatMetric(summary.averageWeight, 'lbs')} />
                    </div>
                  </>
                ) : (
                  <div className="ui-studio-surface border border-dashed p-5 text-sm leading-6 text-[var(--ui-text-secondary)]">
                    Select a point in the chart or a row in the records table to inspect it here.
                  </div>
                )}

                <Separator className="ui-studio-divider" />

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                    Query envelope
                  </p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Dataset</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{CARS_DATASET_ID}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Runtime</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{resolvedExecutionMode}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Origins</span>
                      <span className="text-right font-medium text-[var(--ui-text-primary)]">{originSummary}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Horsepower floor</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{minHorsepower} hp</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Weight ceiling</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{formatCompactNumber(weightCeiling)} lbs</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Row limit</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{limit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
        {SHOW_UI_STUDIO ? (
          <UiStudioDrawer
            buttonPreset={uiPrefs.buttonPreset}
            onOpenChange={setIsStudioOpen}
            open={isStudioOpen}
          />
        ) : null}
      </div>
    </main>
  );
}
