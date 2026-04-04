'use client';

import { FocusContextTimeSeries } from '@va/vis-core';
import { Badge, Button, ScrollArea, Separator, ToggleGroup, ToggleGroupItem } from '@va/ui';
import { CalendarRange, Cpu, Database, LineChart, RefreshCcw, TrendingUp } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo } from 'react';

import {
  formatCompactNumber,
  formatMetric,
  MetricReadout,
  SectionHeader,
  StatusPill,
} from '@/components/workspace/cars-shell-primitives';
import { UiStudioDrawer } from '@/components/workspace/ui-studio-drawer';
import { VisualizationProvenancePanel } from '@/components/workspace/visualization-provenance-panel';
import { WorkspaceActionBar } from '@/components/workspace/workspace-action-bar';
import {
  buildStocksQuery,
  filterStocksByDomain,
  getAvailableStockSymbols,
  getStocksFullDomain,
  normalizeStocksRows,
  STOCKS_DATASET_ID,
  summarizeStocks,
  toStocksLegend,
} from '@/lib/analytics/stocks-analytics';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import { resolveChartTheme, resolveUiStudioVars } from '@/lib/ui-studio';
import { useUiStudioStore } from '@/lib/ui-studio-store';

const VIEW_ID = 'stocks-focus-context';
const EXECUTION_MODES = ['local', 'remote'] as const;
const SHOW_UI_STUDIO = process.env.NODE_ENV !== 'production';
const DATE_RANGE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

type StocksFocusContextShellProps = {
  visualizationId?: string;
};

function formatDomainLabel(domain?: [number, number]) {
  if (!domain) {
    return 'Full history';
  }

  return `${DATE_RANGE_FORMATTER.format(new Date(domain[0]))} to ${DATE_RANGE_FORMATTER.format(new Date(domain[1]))}`;
}

export function StocksFocusContextShell({
  visualizationId = 'stocks-focus-context',
}: StocksFocusContextShellProps) {
  const datasetCatalog = useDatasetCatalog();
  const uiPrefs = useUiStudioStore((state) => state.prefs);
  const uiCssVars = useMemo(() => resolveUiStudioVars(uiPrefs), [uiPrefs]);
  const chartTheme = useMemo(() => resolveChartTheme(uiPrefs), [uiPrefs]);

  const stocksDataset = useMemo(
    () => datasetCatalog.data?.find((dataset) => dataset.id === STOCKS_DATASET_ID),
    [datasetCatalog.data],
  );

  const coordinationDatasetId = useCoordinationStore((state) => state.activeDatasetId);
  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const focusViewport = useCoordinationStore((state) => state.viewports[VIEW_ID]);
  const activeDomain = focusViewport?.xDomain;
  const controlValues = useCoordinationStore(
    (state) => state.visualizationControlValues[visualizationId],
  );
  const selectedSymbols = Array.isArray(controlValues?.symbols)
    ? controlValues.symbols.map(String)
    : [];
  const setActiveDatasetId = useCoordinationStore((state) => state.setActiveDatasetId);
  const setActiveViewId = useCoordinationStore((state) => state.setActiveViewId);
  const setActiveVisualizationId = useCoordinationStore((state) => state.setActiveVisualizationId);
  const setFilters = useCoordinationStore((state) => state.setFilters);
  const setLastQuery = useCoordinationStore((state) => state.setLastQuery);
  const setPreferredExecutionMode = useCoordinationStore((state) => state.setPreferredExecutionMode);
  const setVisualizationControlValues = useCoordinationStore(
    (state) => state.setVisualizationControlValues,
  );
  const setViewport = useCoordinationStore((state) => state.setViewport);

  const query = useMemo(
    () =>
      buildStocksQuery({
        executionMode: preferredExecutionMode,
        selectedSymbols,
      }),
    [preferredExecutionMode, selectedSymbols],
  );

  const executionPlan = useMemo(
    () => (stocksDataset ? planExecution(stocksDataset, query) : undefined),
    [stocksDataset, query],
  );
  const resolvedExecutionMode = executionPlan?.mode ?? preferredExecutionMode;
  const localQuery =
    resolvedExecutionMode === 'local' ? { ...query, executionMode: 'local' as const } : query;
  const remoteQuery =
    resolvedExecutionMode === 'remote' ? { ...query, executionMode: 'remote' as const } : query;
  const localPreview = useLocalPreviewQuery(
    stocksDataset,
    localQuery,
    Boolean(stocksDataset && resolvedExecutionMode === 'local'),
  );
  const remotePreview = useRemotePreviewQuery(
    remoteQuery,
    Boolean(stocksDataset && resolvedExecutionMode === 'remote'),
  );
  const activePreview = resolvedExecutionMode === 'local' ? localPreview : remotePreview;
  const rows = useMemo(() => normalizeStocksRows(activePreview.data), [activePreview.data]);
  const availableSymbols = useMemo(() => getAvailableStockSymbols(rows), [rows]);
  const legend = useMemo(() => toStocksLegend(rows), [rows]);
  const fullDomain = useMemo(() => getStocksFullDomain(rows), [rows]);
  const visibleRows = useMemo(() => filterStocksByDomain(rows, activeDomain), [activeDomain, rows]);
  const visibleSummary = useMemo(() => summarizeStocks(visibleRows), [visibleRows]);
  const fullSummary = useMemo(() => summarizeStocks(rows), [rows]);
  const timelineData = useMemo(
    () =>
      rows.map((row) => ({
        color: legend.find((entry) => entry.label === row.symbol)?.color ?? '#64748b',
        date: row.date,
        id: row.id,
        symbol: row.symbol,
        value: row.price,
      })),
    [legend, rows],
  );
  const visibleRowsPreview = useMemo(
    () => [...(visibleRows.length > 0 ? visibleRows : rows)].sort((left, right) => right.date.getTime() - left.date.getTime()).slice(0, 12),
    [rows, visibleRows],
  );

  useEffect(() => {
    if (stocksDataset && coordinationDatasetId !== STOCKS_DATASET_ID) {
      setActiveDatasetId(STOCKS_DATASET_ID);
    }
  }, [coordinationDatasetId, setActiveDatasetId, stocksDataset]);

  useEffect(() => {
    setActiveViewId(VIEW_ID);
  }, [setActiveViewId]);

  useEffect(() => {
    setActiveVisualizationId(visualizationId);
  }, [setActiveVisualizationId, visualizationId]);

  useEffect(() => {
    setFilters(query.filters);
    setLastQuery({
      ...query,
      executionMode: resolvedExecutionMode,
    });
  }, [query, resolvedExecutionMode, setFilters, setLastQuery]);

  useEffect(() => {
    setVisualizationControlValues(visualizationId, {
      domainEnd: activeDomain?.[1] ?? null,
      domainStart: activeDomain?.[0] ?? null,
      execution: preferredExecutionMode,
      symbols: selectedSymbols,
    });
  }, [
    activeDomain,
    preferredExecutionMode,
    selectedSymbols,
    setVisualizationControlValues,
    visualizationId,
  ]);

  const initialLoading = datasetCatalog.isLoading || (activePreview.isLoading && !activePreview.data);
  const isRefreshing = activePreview.isFetching && Boolean(activePreview.data);
  const activeError = activePreview.error;

  const consoleStatus = useMemo(() => {
    if (activeError) {
      return {
        detail: activeError.message,
        label: 'Time-series workbench unavailable',
        tone: 'error' as const,
      };
    }

    if (initialLoading) {
      return {
        detail: 'Loading the stocks dataset and preparing the focus-context timeline.',
        label: 'Loading workbench',
        tone: 'neutral' as const,
      };
    }

    if (isRefreshing) {
      return {
        detail: 'Symbol and runtime changes refresh quietly while the active focus window stays visible.',
        label: 'Refreshing series',
        tone: 'warning' as const,
      };
    }

    return {
      detail:
        executionPlan?.reasons[0] ??
        'Brush the context band to tighten the time window, then compare per-symbol movement in the detail rail.',
      label: resolvedExecutionMode === 'local' ? 'Browser runtime active' : 'API runtime active',
      tone: 'accent' as const,
    };
  }, [activeError, executionPlan, initialLoading, isRefreshing, resolvedExecutionMode]);

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
                va-framework / time-series analytics
              </p>
              <h1 className="ui-studio-shell-title mt-2 font-[family-name:var(--font-display)] leading-none">
                Stocks focus + context
              </h1>
              <p className="ui-studio-body mt-2 max-w-3xl">
                Brush the context band to define a time window, then compare per-symbol movement
                and price range within a single native workbench surface.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <WorkspaceActionBar buttonPreset={uiPrefs.buttonPreset} />
              <Badge>{STOCKS_DATASET_ID}</Badge>
              <Badge>{resolvedExecutionMode}</Badge>
              <Badge>{`${rows.length} points`}</Badge>
              <StatusPill label={consoleStatus.label} tone={consoleStatus.tone} />
              {SHOW_UI_STUDIO ? <UiStudioDrawer buttonPreset={uiPrefs.buttonPreset} /> : null}
            </div>
          </header>

          <aside className="ui-studio-rail border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_1fr]">
              <div className="grid gap-4">
                <SectionHeader
                  detail="Switch runtime, focus on specific symbols, and reset the brushed domain without leaving the current example."
                  icon={LineChart}
                  title="Control rail"
                />
                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Visible points" tone="accent" value={`${visibleSummary.pointCount}`} />
                  <MetricReadout label="Symbols" value={`${visibleSummary.symbolSummaries.length}`} />
                  <MetricReadout label="Price range" value={`${formatMetric(visibleSummary.minPrice, '$')} to ${formatMetric(visibleSummary.maxPrice, '$')}`} />
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
                  <p className="ui-studio-body">{consoleStatus.detail}</p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                      Symbols
                    </p>
                    <TrendingUp className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="flex flex-wrap gap-2"
                    onValueChange={(value) =>
                      setVisualizationControlValues(visualizationId, {
                        ...(controlValues ?? {}),
                        symbols: value,
                      })
                    }
                    type="multiple"
                    value={selectedSymbols}
                  >
                    {availableSymbols.map((symbol) => (
                      <ToggleGroupItem
                        key={symbol}
                        className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={symbol}
                      >
                        {symbol}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <p className="ui-studio-body">
                    Leave the selection empty to show the full stock pack.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                      Focus window
                    </p>
                    <CalendarRange className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{formatDomainLabel(activeDomain)}</Badge>
                    {fullDomain ? (
                      <Badge variant="outline">{formatDomainLabel(fullDomain)}</Badge>
                    ) : null}
                  </div>
                  <Button
                    className="gap-2"
                    data-button-style={uiPrefs.buttonPreset}
                    onClick={() =>
                      setViewport(VIEW_ID, {
                        center: undefined,
                        coordinateSpace: 'screen-2d',
                        xDomain: undefined,
                        yDomain: undefined,
                        zoom: undefined,
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    <RefreshCcw className="size-4" />
                    Reset focus window
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <section className="ui-studio-stage grid border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="ui-studio-stage-panel min-h-0">
              <FocusContextTimeSeries
                data={timelineData}
                domain={activeDomain}
                legend={legend}
                onDomainChange={(domain) => {
                  const nextVisibleRows = filterStocksByDomain(rows, domain);
                  const nextSummary = summarizeStocks(nextVisibleRows);

                  setViewport(VIEW_ID, {
                    center: undefined,
                    coordinateSpace: 'screen-2d',
                    xDomain: domain,
                    yDomain:
                      nextVisibleRows.length > 0
                        ? [nextSummary.minPrice, nextSummary.maxPrice]
                        : undefined,
                    zoom: undefined,
                  });
                }}
                statusLabel={consoleStatus.label}
                statusTone={consoleStatus.tone}
                subtitle={`${formatCompactNumber(rows.length)} monthly points across ${legend.length} tracked symbols.`}
                theme={chartTheme}
                title="Stocks focus and context"
              />
            </div>
          </section>

          <aside className="ui-studio-detail border-t xl:min-h-0 xl:border-t-0">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
              <SectionHeader
                detail="Read back the active time window, compare symbol deltas, and inspect the visible price rows."
                icon={Database}
                title="Detail rail"
              />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                <div className="ui-studio-surface border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                    Focus state
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-[1.7rem] leading-tight text-[var(--ui-text-primary)]">
                    {formatDomainLabel(activeDomain)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {selectedSymbols.length > 0 ? selectedSymbols.join(', ') : 'All symbols'}
                    </Badge>
                    <Badge>{`${visibleSummary.pointCount} visible points`}</Badge>
                  </div>
                </div>

                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Visible points" tone="accent" value={`${visibleSummary.pointCount}`} />
                  <MetricReadout label="Max price" value={formatMetric(visibleSummary.maxPrice, '$')} />
                  <MetricReadout label="Min price" value={formatMetric(visibleSummary.minPrice, '$')} />
                </div>

                <Separator className="ui-studio-divider" />

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                    Symbol movement
                  </p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                    {visibleSummary.symbolSummaries.map((summary) => (
                      <div className="flex items-start justify-between gap-4" key={summary.symbol}>
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor:
                                legend.find((entry) => entry.label === summary.symbol)?.color ?? '#64748b',
                            }}
                          />
                          <span className="text-[var(--ui-text-muted)]">{summary.symbol}</span>
                        </div>
                        <div className="text-right font-medium text-[var(--ui-text-primary)]">
                          <div>{formatMetric(summary.latest, '$')}</div>
                          <div className="text-xs font-normal text-[var(--ui-text-muted)]">
                            Δ {formatMetric(summary.change, '$')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                    Window summary
                  </p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Visible symbols</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">
                        {visibleSummary.symbolSummaries.length}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Full-history points</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">
                        {fullSummary.pointCount}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Visible domain</span>
                      <span className="text-right font-medium text-[var(--ui-text-primary)]">
                        {formatDomainLabel(activeDomain)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Full domain</span>
                      <span className="text-right font-medium text-[var(--ui-text-primary)]">
                        {formatDomainLabel(fullDomain)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                    Visible rows
                  </p>
                  <ScrollArea className="max-h-60">
                    <div className="grid gap-2">
                      {visibleRowsPreview.map((row) => (
                        <div
                          className="ui-studio-record-row rounded-[var(--ui-radius-control)] border p-3"
                          key={row.id}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-[var(--ui-text-primary)]">
                              {row.symbol}
                            </span>
                            <Badge variant="secondary">
                              {DATE_RANGE_FORMATTER.format(row.date)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                            Price {formatMetric(row.price, '$')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <VisualizationProvenancePanel activeDatasetId={STOCKS_DATASET_ID} exampleId={visualizationId} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
