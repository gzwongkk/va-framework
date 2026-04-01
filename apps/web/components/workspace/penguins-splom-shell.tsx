'use client';

import { BrushableScatterplotMatrix } from '@va/vis-core';
import { Badge, ScrollArea, Separator, ToggleGroup, ToggleGroupItem } from '@va/ui';
import { Cpu, Database, Shapes, SlidersHorizontal } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

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
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import {
  buildPenguinsQuery,
  formatPenguinFieldLabel,
  getAvailablePenguinSpecies,
  getPenguinPreset,
  getSelectedPenguins,
  normalizePenguinRows,
  parsePenguinFieldPreset,
  PENGUINS_DATASET_ID,
  PENGUIN_FIELD_PRESETS,
  summarizePenguins,
  toPenguinLegend,
  type PenguinFieldPresetId,
} from '@/lib/analytics/penguins-analytics';
import { resolveChartTheme, resolveUiStudioVars } from '@/lib/ui-studio';
import { useUiStudioStore } from '@/lib/ui-studio-store';

const VIEW_ID = 'penguins-splom';
const EMPTY_SELECTION_IDS: string[] = [];
const EXECUTION_MODES = ['local', 'remote'] as const;
const SHOW_UI_STUDIO = process.env.NODE_ENV !== 'production';

type PenguinsSplomShellProps = {
  visualizationId?: string;
};

export function PenguinsSplomShell({
  visualizationId = 'penguins-splom',
}: PenguinsSplomShellProps) {
  const datasetCatalog = useDatasetCatalog();
  const uiPrefs = useUiStudioStore((state) => state.prefs);
  const uiCssVars = useMemo(() => resolveUiStudioVars(uiPrefs), [uiPrefs]);
  const chartTheme = useMemo(() => resolveChartTheme(uiPrefs), [uiPrefs]);

  const penguinsDataset = useMemo(
    () => datasetCatalog.data?.find((dataset) => dataset.id === PENGUINS_DATASET_ID),
    [datasetCatalog.data],
  );

  const activeDatasetId = useCoordinationStore((state) => state.activeDatasetId);
  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const splomSelection = useCoordinationStore((state) => state.selections[VIEW_ID]);
  const selectedIds = splomSelection?.ids ?? EMPTY_SELECTION_IDS;
  const setActiveDatasetId = useCoordinationStore((state) => state.setActiveDatasetId);
  const setActiveViewId = useCoordinationStore((state) => state.setActiveViewId);
  const setActiveVisualizationId = useCoordinationStore((state) => state.setActiveVisualizationId);
  const setFilters = useCoordinationStore((state) => state.setFilters);
  const setLastQuery = useCoordinationStore((state) => state.setLastQuery);
  const setPreferredExecutionMode = useCoordinationStore((state) => state.setPreferredExecutionMode);
  const setSelection = useCoordinationStore((state) => state.setSelection);
  const setVisualizationControlValues = useCoordinationStore((state) => state.setVisualizationControlValues);

  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [fieldPreset, setFieldPreset] = useState<PenguinFieldPresetId>('full-morphology');

  const query = useMemo(
    () =>
      buildPenguinsQuery({
        executionMode: preferredExecutionMode,
        selectedSpecies,
      }),
    [preferredExecutionMode, selectedSpecies],
  );

  const executionPlan = useMemo(
    () => (penguinsDataset ? planExecution(penguinsDataset, query) : undefined),
    [penguinsDataset, query],
  );
  const resolvedExecutionMode = executionPlan?.mode ?? preferredExecutionMode;
  const localQuery = resolvedExecutionMode === 'local' ? { ...query, executionMode: 'local' as const } : query;
  const remoteQuery = resolvedExecutionMode === 'remote' ? { ...query, executionMode: 'remote' as const } : query;
  const localPreview = useLocalPreviewQuery(
    penguinsDataset,
    localQuery,
    Boolean(penguinsDataset && resolvedExecutionMode === 'local'),
  );
  const remotePreview = useRemotePreviewQuery(remoteQuery, Boolean(penguinsDataset && resolvedExecutionMode === 'remote'));
  const activePreview = resolvedExecutionMode === 'local' ? localPreview : remotePreview;
  const rows = useMemo(() => normalizePenguinRows(activePreview.data), [activePreview.data]);
  const legend = useMemo(() => toPenguinLegend(rows), [rows]);
  const availableSpecies = useMemo(() => getAvailablePenguinSpecies(rows), [rows]);
  const selectedRows = useMemo(() => getSelectedPenguins(rows, selectedIds), [rows, selectedIds]);
  const activeSummary = useMemo(() => summarizePenguins(rows), [rows]);
  const selectedSummary = useMemo(
    () => summarizePenguins(selectedRows.length > 0 ? selectedRows : rows),
    [rows, selectedRows],
  );
  const activePreset = getPenguinPreset(fieldPreset);
  const splomData = useMemo(
    () =>
      rows.map((row) => ({
        category: row.species,
        color: legend.find((entry) => entry.label === row.species)?.color ?? '#7b6bb7',
        id: row.id,
        label: `${row.species} · ${row.island} · ${row.sex ?? 'Unknown'}`,
        values: activePreset.fields.reduce<Record<string, number>>((accumulator, field) => {
          accumulator[field] = row[field];
          return accumulator;
        }, {}),
      })),
    [activePreset.fields, legend, rows],
  );

  useEffect(() => {
    if (penguinsDataset && activeDatasetId !== PENGUINS_DATASET_ID) {
      setActiveDatasetId(PENGUINS_DATASET_ID);
    }
  }, [activeDatasetId, penguinsDataset, setActiveDatasetId]);

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
      execution: preferredExecutionMode,
      fieldPreset,
      species: selectedSpecies,
    });
  }, [fieldPreset, preferredExecutionMode, selectedSpecies, setVisualizationControlValues, visualizationId]);

  const initialLoading = datasetCatalog.isLoading || (activePreview.isLoading && !activePreview.data);
  const isRefreshing = activePreview.isFetching && Boolean(activePreview.data);
  const activeError = activePreview.error;

  const consoleStatus = useMemo(() => {
    if (activeError) {
      return {
        detail: activeError.message,
        label: 'Workbench unavailable',
        tone: 'error' as const,
      };
    }

    if (initialLoading) {
      return {
        detail: 'Loading the penguins registry entry and local snapshot.',
        label: 'Loading workspace',
        tone: 'neutral' as const,
      };
    }

    if (isRefreshing) {
      return {
        detail: 'SPLOM controls update in the background while the active cohort stays visible.',
        label: 'Refreshing preview',
        tone: 'warning' as const,
      };
    }

    return {
      detail: executionPlan?.reasons[0] ?? 'Brush across any scatter cell to define a cohort.',
      label: resolvedExecutionMode === 'local' ? 'Browser runtime active' : 'API runtime active',
      tone: 'accent' as const,
    };
  }, [activeError, executionPlan, initialLoading, isRefreshing, resolvedExecutionMode]);

  const brushedSummaryLabel =
    selectedRows.length > 0 ? `${selectedRows.length} brushed rows` : 'No active brush selection';

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
              <p className="ui-studio-label font-semibold uppercase tracking-[0.28em]">va-framework / tabular multivariate</p>
              <h1 className="ui-studio-shell-title mt-2 font-[family-name:var(--font-display)] leading-none">Penguins SPLOM</h1>
              <p className="ui-studio-body mt-2 max-w-3xl">
                Brush across any scatter cell to define cohorts, compare morphology fields, and read selection-aware summaries without leaving the single-canvas workbench.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <WorkspaceActionBar buttonPreset={uiPrefs.buttonPreset} />
              <Badge>{PENGUINS_DATASET_ID}</Badge>
              <Badge>{resolvedExecutionMode}</Badge>
              <Badge>{`${rows.length} rows`}</Badge>
              <StatusPill label={consoleStatus.label} tone={consoleStatus.tone} />
              {SHOW_UI_STUDIO ? <UiStudioDrawer buttonPreset={uiPrefs.buttonPreset} /> : null}
            </div>
          </header>

          <aside className="ui-studio-rail border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_1fr]">
              <div className="grid gap-4">
                <SectionHeader
                  detail="Tune the morphology preset, runtime, and species filter before brushing a cohort."
                  icon={SlidersHorizontal}
                  title="Control rail"
                />
                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Rows" tone="accent" value={`${activeSummary.count}`} />
                  <MetricReadout label="Brushed cohort" value={`${selectedRows.length}`} />
                  <MetricReadout label="Avg body mass" value={formatMetric(activeSummary.averageBodyMass, 'g')} />
                </div>
              </div>

              <Separator className="ui-studio-divider" />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Execution mode</p>
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
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Field preset</p>
                    <Shapes className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="grid gap-2"
                    onValueChange={(value) => {
                      if (value) {
                        setFieldPreset(parsePenguinFieldPreset(value));
                      }
                    }}
                    type="single"
                    value={fieldPreset}
                  >
                    {PENGUIN_FIELD_PRESETS.map((preset) => (
                      <ToggleGroupItem
                        key={preset.id}
                        className="grid h-auto w-full justify-start gap-1 px-3 py-3 text-left normal-case tracking-normal"
                        data-button-style={uiPrefs.buttonPreset}
                        value={preset.id}
                      >
                        <span className="text-sm font-semibold">{preset.label}</span>
                        <span className="text-xs font-normal opacity-80">{preset.description}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Species filter</p>
                    <Database className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="flex flex-wrap gap-2"
                    onValueChange={(value) => setSelectedSpecies(value)}
                    type="multiple"
                    value={selectedSpecies}
                  >
                    {availableSpecies.map((species) => (
                      <ToggleGroupItem
                        key={species}
                        className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={species}
                      >
                        {species}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </aside>

          <section className="ui-studio-stage grid border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="ui-studio-stage-panel min-h-0">
              <BrushableScatterplotMatrix
                data={splomData}
                fields={activePreset.fields}
                legend={legend}
                onSelectIds={(ids) =>
                  setSelection(VIEW_ID, {
                    entity: 'penguins',
                    ids,
                    sourceViewId: VIEW_ID,
                  })
                }
                selectedIds={selectedIds}
                statusLabel={consoleStatus.label}
                statusTone={consoleStatus.tone}
                subtitle={`${formatCompactNumber(rows.length)} penguins across ${activePreset.label.toLowerCase()} fields.`}
                theme={chartTheme}
                title="Brushable morphology matrix"
              />
            </div>
          </section>

          <aside className="ui-studio-detail border-t xl:min-h-0 xl:border-t-0">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
              <SectionHeader
                detail="Read back the brushed cohort, compare active averages, and inspect the first selected records."
                icon={Database}
                title="Detail rail"
              />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                <div className="ui-studio-surface border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Selection state</p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-[1.8rem] leading-tight text-[var(--ui-text-primary)]">
                    {brushedSummaryLabel}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{activePreset.label}</Badge>
                    <Badge>{selectedSpecies.length > 0 ? selectedSpecies.join(', ') : 'All species'}</Badge>
                  </div>
                </div>

                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Avg beak length" tone="accent" value={formatMetric(selectedSummary.averageBeakLength, 'mm')} />
                  <MetricReadout label="Avg beak depth" value={formatMetric(selectedSummary.averageBeakDepth, 'mm')} />
                  <MetricReadout label="Avg flipper length" value={formatMetric(selectedSummary.averageFlipperLength, 'mm')} />
                  <MetricReadout label="Avg body mass" value={formatMetric(selectedSummary.averageBodyMass, 'g')} />
                </div>

                <Separator className="ui-studio-divider" />

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Active fields</p>
                  <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                    {activePreset.fields.map((field) => (
                      <div className="flex items-start justify-between gap-4" key={field}>
                        <span className="text-[var(--ui-text-muted)]">{formatPenguinFieldLabel(field)}</span>
                        <span className="font-medium text-[var(--ui-text-primary)]">Visible</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Species breakdown</p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                    {selectedSummary.speciesBreakdown.map((entry) => (
                      <div className="flex items-start justify-between gap-4" key={entry.species}>
                        <span className="text-[var(--ui-text-muted)]">{entry.species}</span>
                        <span className="font-medium text-[var(--ui-text-primary)]">{entry.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Island breakdown</p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                    {selectedSummary.islandBreakdown.map((entry) => (
                      <div className="flex items-start justify-between gap-4" key={entry.island}>
                        <span className="text-[var(--ui-text-muted)]">{entry.island}</span>
                        <span className="font-medium text-[var(--ui-text-primary)]">{entry.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Selected records</p>
                  <ScrollArea className="max-h-56">
                    <div className="grid gap-2">
                      {(selectedRows.length > 0 ? selectedRows : rows.slice(0, 8)).map((row) => (
                        <div className="ui-studio-record-row rounded-[var(--ui-radius-control)] border p-3" key={row.id}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-[var(--ui-text-primary)]">{row.species}</span>
                            <Badge variant="outline">{row.island}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                            {row.sex ?? 'Unknown sex'} · {row.body_mass_g} g · {row.flipper_length_mm} mm flipper
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <VisualizationProvenancePanel activeDatasetId={PENGUINS_DATASET_ID} exampleId={visualizationId} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
