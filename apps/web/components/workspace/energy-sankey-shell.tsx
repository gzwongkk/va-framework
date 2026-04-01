'use client';

import { SankeyFlowDiagram } from '@va/vis-core';
import { Badge, ScrollArea, Separator, ToggleGroup, ToggleGroupItem } from '@va/ui';
import { Cpu, Database, MoveRight, SlidersHorizontal, Waves } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

import {
  formatCompactNumber,
  formatMetric,
  MetricReadout,
  RangeField,
  SectionHeader,
  StatusPill,
} from '@/components/workspace/cars-shell-primitives';
import { UiStudioDrawer } from '@/components/workspace/ui-studio-drawer';
import { WorkspaceActionBar } from '@/components/workspace/workspace-action-bar';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import {
  buildEnergyQuery,
  ENERGY_DATASET_ID,
  filterEnergyGraph,
  getEnergyDatasetSummary,
  getEnergyLegend,
  getEnergyNodeConnections,
  getEnergyStageLabel,
  getEnergyStageOptions,
  getTopEnergyLinks,
  normalizeEnergyGraph,
  summarizeEnergyFlow,
} from '@/lib/analytics/energy-analytics';
import { resolveChartTheme, resolveUiStudioVars } from '@/lib/ui-studio';
import { useUiStudioStore } from '@/lib/ui-studio-store';

const VIEW_ID = 'energy-sankey';
const EMPTY_SELECTION_IDS: string[] = [];
const EXECUTION_MODES = ['local', 'remote'] as const;
const SHOW_UI_STUDIO = process.env.NODE_ENV !== 'production';

type EnergySankeyShellProps = {
  visualizationId?: string;
};

export function EnergySankeyShell({
  visualizationId = 'energy-sankey',
}: EnergySankeyShellProps) {
  const datasetCatalog = useDatasetCatalog();
  const uiPrefs = useUiStudioStore((state) => state.prefs);
  const uiCssVars = useMemo(() => resolveUiStudioVars(uiPrefs), [uiPrefs]);
  const chartTheme = useMemo(() => resolveChartTheme(uiPrefs), [uiPrefs]);

  const energyDataset = useMemo(
    () => datasetCatalog.data?.find((dataset) => dataset.id === ENERGY_DATASET_ID),
    [datasetCatalog.data],
  );

  const coordinationDatasetId = useCoordinationStore((state) => state.activeDatasetId);
  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const energySelection = useCoordinationStore((state) => state.selections[VIEW_ID]);
  const selectedNodeId = energySelection?.ids[0];
  const setActiveDatasetId = useCoordinationStore((state) => state.setActiveDatasetId);
  const setActiveViewId = useCoordinationStore((state) => state.setActiveViewId);
  const setActiveVisualizationId = useCoordinationStore((state) => state.setActiveVisualizationId);
  const setFilters = useCoordinationStore((state) => state.setFilters);
  const setLastQuery = useCoordinationStore((state) => state.setLastQuery);
  const setPreferredExecutionMode = useCoordinationStore((state) => state.setPreferredExecutionMode);
  const setSelection = useCoordinationStore((state) => state.setSelection);
  const setVisualizationControlValues = useCoordinationStore((state) => state.setVisualizationControlValues);

  const [minFlowValue, setMinFlowValue] = useState(0);
  const [selectedSourceStages, setSelectedSourceStages] = useState<number[]>([]);
  const [selectedTargetStages, setSelectedTargetStages] = useState<number[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string>();
  const [selectedLinkId, setSelectedLinkId] = useState<string>();
  const [hoveredLinkId, setHoveredLinkId] = useState<string>();

  const query = useMemo(
    () =>
      buildEnergyQuery({
        executionMode: preferredExecutionMode,
        minFlowValue,
      }),
    [minFlowValue, preferredExecutionMode],
  );

  const executionPlan = useMemo(
    () => (energyDataset ? planExecution(energyDataset, query) : undefined),
    [energyDataset, query],
  );
  const resolvedExecutionMode = executionPlan?.mode ?? preferredExecutionMode;
  const localQuery = resolvedExecutionMode === 'local' ? { ...query, executionMode: 'local' as const } : query;
  const remoteQuery = resolvedExecutionMode === 'remote' ? { ...query, executionMode: 'remote' as const } : query;
  const localPreview = useLocalPreviewQuery(
    energyDataset,
    localQuery,
    Boolean(energyDataset && resolvedExecutionMode === 'local'),
  );
  const remotePreview = useRemotePreviewQuery(
    remoteQuery,
    Boolean(energyDataset && resolvedExecutionMode === 'remote'),
  );
  const activePreview = resolvedExecutionMode === 'local' ? localPreview : remotePreview;
  const energyGraph = useMemo(() => normalizeEnergyGraph(activePreview.data), [activePreview.data]);
  const availableStages = useMemo(() => getEnergyStageOptions(energyGraph), [energyGraph]);
  const legend = useMemo(() => getEnergyLegend(energyGraph), [energyGraph]);
  const filteredGraph = useMemo(
    () =>
      filterEnergyGraph(energyGraph, {
        sourceStages: selectedSourceStages,
        targetStages: selectedTargetStages,
      }),
    [energyGraph, selectedSourceStages, selectedTargetStages],
  );
  const flowSummary = useMemo(
    () => summarizeEnergyFlow(filteredGraph, selectedNodeId),
    [filteredGraph, selectedNodeId],
  );
  const rawSummary = useMemo(
    () => getEnergyDatasetSummary(activePreview.data),
    [activePreview.data],
  );
  const topLinks = useMemo(() => getTopEnergyLinks(filteredGraph), [filteredGraph]);
  const nodeConnections = useMemo(
    () => getEnergyNodeConnections(filteredGraph, selectedNodeId ?? hoveredNodeId),
    [filteredGraph, hoveredNodeId, selectedNodeId],
  );
  const selectedIdSet = useMemo(
    () => new Set(energySelection?.ids ?? EMPTY_SELECTION_IDS),
    [energySelection?.ids],
  );
  const activeNode =
    filteredGraph?.nodes.find((node) => node.id === selectedNodeId) ??
    filteredGraph?.nodes.find((node) => node.id === hoveredNodeId);
  const activeLink =
    filteredGraph?.links.find((link) => link.id === selectedLinkId) ??
    filteredGraph?.links.find((link) => link.id === hoveredLinkId);

  useEffect(() => {
    if (energyDataset && coordinationDatasetId !== ENERGY_DATASET_ID) {
      setActiveDatasetId(ENERGY_DATASET_ID);
    }
  }, [coordinationDatasetId, energyDataset, setActiveDatasetId]);

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
      minFlowValue,
      sourceStages: selectedSourceStages.map(String),
      targetStages: selectedTargetStages.map(String),
    });
  }, [
    minFlowValue,
    preferredExecutionMode,
    selectedSourceStages,
    selectedTargetStages,
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
        label: 'Flow workbench unavailable',
        tone: 'error' as const,
      };
    }

    if (initialLoading) {
      return {
        detail: 'Loading the energy dataset and building the flow registry entry.',
        label: 'Loading workbench',
        tone: 'neutral' as const,
      };
    }

    if (isRefreshing) {
      return {
        detail: 'Flow filters are being applied in the background while the active stage remains visible.',
        label: 'Refreshing flow',
        tone: 'warning' as const,
      };
    }

    return {
      detail: executionPlan?.reasons[0] ?? 'Trace source-to-target flow with stage filters and node selection.',
      label: resolvedExecutionMode === 'local' ? 'Browser runtime active' : 'API runtime active',
      tone: 'accent' as const,
    };
  }, [activeError, executionPlan, initialLoading, isRefreshing, resolvedExecutionMode]);

  const flowSubtitle = `${formatCompactNumber(flowSummary.visibleNodeCount)} visible nodes · ${formatCompactNumber(flowSummary.linkCount)} flow links · ${formatMetric(flowSummary.totalFlow, 'TWh')}`;

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
              <p className="ui-studio-label font-semibold uppercase tracking-[0.28em]">va-framework / flow analytics</p>
              <h1 className="ui-studio-shell-title mt-2 font-[family-name:var(--font-display)] leading-none">Energy Sankey</h1>
              <p className="ui-studio-body mt-2 max-w-3xl">
                Trace how energy moves from sources through infrastructure and demand stages using a single native Sankey workbench with shared registry state.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <WorkspaceActionBar buttonPreset={uiPrefs.buttonPreset} />
              <Badge>{ENERGY_DATASET_ID}</Badge>
              <Badge>{resolvedExecutionMode}</Badge>
              <Badge>{`${flowSummary.linkCount} links`}</Badge>
              <StatusPill label={consoleStatus.label} tone={consoleStatus.tone} />
              {SHOW_UI_STUDIO ? <UiStudioDrawer buttonPreset={uiPrefs.buttonPreset} /> : null}
            </div>
          </header>

          <aside className="ui-studio-rail border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_1fr]">
              <div className="grid gap-4">
                <SectionHeader
                  detail="Tune runtime, minimum link weight, and source-target stage filters before inspecting specific routes."
                  icon={SlidersHorizontal}
                  title="Control rail"
                />
                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Visible nodes" tone="accent" value={`${flowSummary.visibleNodeCount}`} />
                  <MetricReadout label="Visible links" value={`${flowSummary.linkCount}`} />
                  <MetricReadout label="Total flow" value={formatMetric(flowSummary.totalFlow, 'TWh')} />
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

                <RangeField
                  label="Minimum flow"
                  max={40}
                  min={0}
                  onChange={setMinFlowValue}
                  step={1}
                  value={minFlowValue}
                  valueLabel={`${minFlowValue}`}
                />

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Source stages</p>
                    <Waves className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="flex flex-wrap gap-2"
                    onValueChange={(values) => setSelectedSourceStages(values.map(Number))}
                    type="multiple"
                    value={selectedSourceStages.map(String)}
                  >
                    {availableStages.map((stage) => (
                      <ToggleGroupItem
                        key={`source-${stage}`}
                        className="px-3 text-xs font-semibold uppercase tracking-[0.14em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={String(stage)}
                      >
                        {getEnergyStageLabel(stage)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Target stages</p>
                    <MoveRight className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="flex flex-wrap gap-2"
                    onValueChange={(values) => setSelectedTargetStages(values.map(Number))}
                    type="multiple"
                    value={selectedTargetStages.map(String)}
                  >
                    {availableStages.map((stage) => (
                      <ToggleGroupItem
                        key={`target-${stage}`}
                        className="px-3 text-xs font-semibold uppercase tracking-[0.14em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={String(stage)}
                      >
                        {getEnergyStageLabel(stage)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </aside>

          <section className="ui-studio-stage grid border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="ui-studio-stage-panel min-h-0">
              <SankeyFlowDiagram
                legend={legend}
                links={(filteredGraph?.links ?? []).map((link) => ({
                  color: legend.find((entry) => entry.label === getEnergyStageLabel(link.sourceStage))?.color ?? '#315f7d',
                  id: link.id,
                  source: link.source,
                  sourceStage: link.sourceStage,
                  target: link.target,
                  targetStage: link.targetStage,
                  value: link.value,
                }))}
                nodes={(filteredGraph?.nodes ?? []).map((node) => ({
                  color: legend.find((entry) => entry.label === getEnergyStageLabel(node.stage))?.color ?? '#315f7d',
                  id: node.id,
                  label: node.label,
                  stage: node.stage,
                }))}
                onHoverLink={setHoveredLinkId}
                onHoverNode={setHoveredNodeId}
                onSelectLink={(linkId) => setSelectedLinkId(linkId)}
                onSelectNode={(nodeId) =>
                  setSelection(VIEW_ID, {
                    entity: 'nodes',
                    ids: [nodeId],
                    sourceViewId: VIEW_ID,
                  })
                }
                selectedLinkId={selectedLinkId}
                selectedNodeId={selectedNodeId}
                statusLabel={consoleStatus.label}
                statusTone={consoleStatus.tone}
                subtitle={flowSubtitle}
                theme={chartTheme}
                title="Energy flow Sankey"
              />
            </div>
          </section>

          <aside className="ui-studio-detail border-t xl:min-h-0 xl:border-t-0">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
              <SectionHeader
                detail="Read back the active node or link, compare stage throughput, and inspect the strongest routes in the filtered flow."
                icon={Database}
                title="Detail rail"
              />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                <div className="ui-studio-surface border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Flow focus</p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-[1.7rem] leading-tight text-[var(--ui-text-primary)]">
                    {activeNode?.label ?? (activeLink ? `${activeLink.sourceLabel} → ${activeLink.targetLabel}` : 'No selected route')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeNode ? (
                      <>
                        <Badge variant="secondary">{getEnergyStageLabel(activeNode.stage)}</Badge>
                        <Badge>{`${activeNode.inDegree} in / ${activeNode.outDegree} out`}</Badge>
                      </>
                    ) : null}
                    {activeLink ? (
                      <>
                        <Badge variant="secondary">{`${getEnergyStageLabel(activeLink.sourceStage)} → ${getEnergyStageLabel(activeLink.targetStage)}`}</Badge>
                        <Badge>{formatMetric(activeLink.value, 'TWh')}</Badge>
                      </>
                    ) : null}
                    {!activeNode && !activeLink ? (
                      <Badge variant="outline">Hover or select a node or route</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Registry nodes" tone="accent" value={`${rawSummary.visibleNodeCount}`} />
                  <MetricReadout label="Registry links" value={`${rawSummary.linkCount}`} />
                  <MetricReadout label="Focused throughput" value={formatMetric(flowSummary.activeNode?.throughput ?? 0, 'TWh')} />
                </div>

                <Separator className="ui-studio-divider" />

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Stage throughput</p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                    {flowSummary.stageSummaries.map((stage) => (
                      <div className="flex items-start justify-between gap-4" key={stage.stage}>
                        <span className="text-[var(--ui-text-muted)]">{getEnergyStageLabel(stage.stage)}</span>
                        <div className="text-right font-medium text-[var(--ui-text-primary)]">
                          <div>{`${formatMetric(stage.outflow, 'out')} / ${formatMetric(stage.inflow, 'in')}`}</div>
                          <div className="text-xs font-normal text-[var(--ui-text-muted)]">{stage.nodeCount} nodes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Strongest routes</p>
                  <ScrollArea className="max-h-56">
                    <div className="grid gap-2">
                      {topLinks.map((link) => (
                        <button
                          className="ui-studio-record-row rounded-[var(--ui-radius-control)] border p-3 text-left"
                          key={link.id}
                          onClick={() => setSelectedLinkId(link.id)}
                          onMouseDown={(event) => event.preventDefault()}
                          type="button"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-[var(--ui-text-primary)]">{link.sourceLabel} → {link.targetLabel}</span>
                            <Badge variant="secondary">{formatMetric(link.value, 'TWh')}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                            {getEnergyStageLabel(link.sourceStage)} to {getEnergyStageLabel(link.targetStage)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Node connections</p>
                  <ScrollArea className="max-h-56">
                    <div className="grid gap-2">
                      {nodeConnections.length > 0 ? (
                        nodeConnections.map((connection) => (
                          <div className="ui-studio-record-row rounded-[var(--ui-radius-control)] border p-3" key={connection.id}>
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-[var(--ui-text-primary)]">{connection.sourceLabel} → {connection.targetLabel}</span>
                              <Badge variant="outline">{formatMetric(connection.value, 'TWh')}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                              {getEnergyStageLabel(connection.sourceStage)} to {getEnergyStageLabel(connection.targetStage)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="ui-studio-body">Select a node to inspect its incoming and outgoing routes.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
