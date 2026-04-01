'use client';

import { GraphTreeTechniques } from '@va/vis-core';
import { Badge, ScrollArea, Separator, ToggleGroup, ToggleGroupItem } from '@va/ui';
import { Cpu, Database, GitBranch, Trees, Workflow } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

import {
  formatCompactNumber,
  MetricReadout,
  SectionHeader,
  StatusPill,
} from '@/components/workspace/cars-shell-primitives';
import { UiStudioDrawer } from '@/components/workspace/ui-studio-drawer';
import { WorkspaceActionBar } from '@/components/workspace/workspace-action-bar';
import {
  buildHierarchyTree,
  getHierarchyLeafPreview,
  getHierarchyPath,
  summarizeHierarchyTree,
} from '@/lib/analytics/graph-workbench-analytics';
import {
  buildHierarchyQuery,
  HIERARCHY_DATASET_ID,
  hierarchyVariantOptions,
  limitHierarchyDepth,
  resolveHierarchyVariant,
  type HierarchyVariant,
} from '@/lib/analytics/hierarchy-analytics';
import { normalizeGraphResult } from '@/lib/analytics/graph-analytics';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import { resolveChartTheme, resolveUiStudioVars } from '@/lib/ui-studio';
import { useUiStudioStore } from '@/lib/ui-studio-store';

const VIEW_ID = 'hierarchy-suite';
const EXECUTION_MODES = ['local', 'remote'] as const;
const SHOW_UI_STUDIO = process.env.NODE_ENV !== 'production';

type HierarchySuiteShellProps = {
  visualizationId?: string;
};

export function HierarchySuiteShell({
  visualizationId = 'hierarchy-suite',
}: HierarchySuiteShellProps) {
  const datasetCatalog = useDatasetCatalog();
  const uiPrefs = useUiStudioStore((state) => state.prefs);
  const uiCssVars = useMemo(() => resolveUiStudioVars(uiPrefs), [uiPrefs]);
  const chartTheme = useMemo(() => resolveChartTheme(uiPrefs), [uiPrefs]);

  const flareDataset = useMemo(
    () => datasetCatalog.data?.find((dataset) => dataset.id === HIERARCHY_DATASET_ID),
    [datasetCatalog.data],
  );

  const coordinationDatasetId = useCoordinationStore((state) => state.activeDatasetId);
  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const hierarchySelection = useCoordinationStore((state) => state.selections[VIEW_ID]);
  const selectedNodeId = hierarchySelection?.ids[0];
  const setActiveDatasetId = useCoordinationStore((state) => state.setActiveDatasetId);
  const setActiveViewId = useCoordinationStore((state) => state.setActiveViewId);
  const setActiveVisualizationId = useCoordinationStore((state) => state.setActiveVisualizationId);
  const setFilters = useCoordinationStore((state) => state.setFilters);
  const setLastQuery = useCoordinationStore((state) => state.setLastQuery);
  const setPreferredExecutionMode = useCoordinationStore((state) => state.setPreferredExecutionMode);
  const setSelection = useCoordinationStore((state) => state.setSelection);
  const setVisualizationControlValues = useCoordinationStore((state) => state.setVisualizationControlValues);

  const [variant, setVariant] = useState<HierarchyVariant>('tidy-tree');
  const [maxDepth, setMaxDepth] = useState(4);

  const query = useMemo(
    () => buildHierarchyQuery(preferredExecutionMode),
    [preferredExecutionMode],
  );
  const executionPlan = useMemo(
    () => (flareDataset ? planExecution(flareDataset, query) : undefined),
    [flareDataset, query],
  );
  const resolvedExecutionMode = executionPlan?.mode ?? preferredExecutionMode;
  const localQuery = resolvedExecutionMode === 'local' ? { ...query, executionMode: 'local' as const } : query;
  const remoteQuery = resolvedExecutionMode === 'remote' ? { ...query, executionMode: 'remote' as const } : query;
  const localPreview = useLocalPreviewQuery(
    flareDataset,
    localQuery,
    Boolean(flareDataset && resolvedExecutionMode === 'local'),
  );
  const remotePreview = useRemotePreviewQuery(
    remoteQuery,
    Boolean(flareDataset && resolvedExecutionMode === 'remote'),
  );
  const activePreview = resolvedExecutionMode === 'local' ? localPreview : remotePreview;
  const graphResult = useMemo(() => normalizeGraphResult(activePreview.data), [activePreview.data]);
  const hierarchyRoot = useMemo(() => buildHierarchyTree(graphResult), [graphResult]);
  const trimmedRoot = useMemo(() => limitHierarchyDepth(hierarchyRoot, maxDepth), [hierarchyRoot, maxDepth]);
  const hierarchySummary = useMemo(() => summarizeHierarchyTree(trimmedRoot), [trimmedRoot]);
  const hierarchyPath = useMemo(() => getHierarchyPath(trimmedRoot, selectedNodeId), [trimmedRoot, selectedNodeId]);
  const hierarchyLeaves = useMemo(() => getHierarchyLeafPreview(trimmedRoot), [trimmedRoot]);
  const activeNode = hierarchyPath[hierarchyPath.length - 1] ?? trimmedRoot;
  const resolvedVariant = useMemo(() => resolveHierarchyVariant(variant), [variant]);

  useEffect(() => {
    if (flareDataset && coordinationDatasetId !== HIERARCHY_DATASET_ID) {
      setActiveDatasetId(HIERARCHY_DATASET_ID);
    }
  }, [coordinationDatasetId, flareDataset, setActiveDatasetId]);

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
      maxDepth,
      variant,
    });
  }, [maxDepth, preferredExecutionMode, setVisualizationControlValues, variant, visualizationId]);

  const initialLoading = datasetCatalog.isLoading || (activePreview.isLoading && !activePreview.data);
  const isRefreshing = activePreview.isFetching && Boolean(activePreview.data);
  const activeError = activePreview.error;

  const consoleStatus = useMemo(() => {
    if (activeError) {
      return {
        detail: activeError.message,
        label: 'Hierarchy unavailable',
        tone: 'error' as const,
      };
    }

    if (initialLoading) {
      return {
        detail: 'Loading the flare hierarchy and preparing the shared graph contract.',
        label: 'Loading hierarchy',
        tone: 'neutral' as const,
      };
    }

    if (isRefreshing) {
      return {
        detail: 'Hierarchy layout options update quietly while the visible structure stays in place.',
        label: 'Refreshing hierarchy',
        tone: 'warning' as const,
      };
    }

    return {
      detail: executionPlan?.reasons[0] ?? 'Switch between explicit and implicit hierarchy techniques on the same flare dataset.',
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
              <p className="ui-studio-label font-semibold uppercase tracking-[0.28em]">va-framework / hierarchy analytics</p>
              <h1 className="ui-studio-shell-title mt-2 font-[family-name:var(--font-display)] leading-none">Flare hierarchy suite</h1>
              <p className="ui-studio-body mt-2 max-w-3xl">
                Compare explicit and implicit hierarchy techniques on the same flare dataset, from tidy trees and radial clusters to sunburst, icicle, and treemap views.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <WorkspaceActionBar buttonPreset={uiPrefs.buttonPreset} />
              <Badge>{HIERARCHY_DATASET_ID}</Badge>
              <Badge>{resolvedExecutionMode}</Badge>
              <Badge>{resolvedVariant.mode}</Badge>
              <StatusPill label={consoleStatus.label} tone={consoleStatus.tone} />
              {SHOW_UI_STUDIO ? <UiStudioDrawer buttonPreset={uiPrefs.buttonPreset} /> : null}
            </div>
          </header>

          <aside className="ui-studio-rail border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_1fr]">
              <div className="grid gap-4">
                <SectionHeader
                  detail="Switch hierarchy technique families, cap visible depth, and keep the same selected path across explicit and implicit layouts."
                  icon={Workflow}
                  title="Control rail"
                />
                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Visible nodes" tone="accent" value={`${hierarchySummary.nodeCount}`} />
                  <MetricReadout label="Leaves" value={`${hierarchySummary.leafCount}`} />
                  <MetricReadout label="Depth cap" value={`${maxDepth}`} />
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
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Technique family</p>
                    <Trees className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="grid gap-2"
                    onValueChange={(value) => {
                      if (value) {
                        setVariant(value as HierarchyVariant);
                      }
                    }}
                    type="single"
                    value={variant}
                  >
                    {hierarchyVariantOptions.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        className="grid h-auto w-full justify-start gap-1 px-3 py-3 text-left normal-case tracking-normal"
                        data-button-style={uiPrefs.buttonPreset}
                        value={option.value}
                      >
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span className="text-xs font-normal opacity-80">{option.description}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <label className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="ui-studio-label font-semibold uppercase tracking-[0.2em]">Visible depth</span>
                    <span className="text-sm font-medium text-[var(--ui-text-primary)]">{maxDepth}</span>
                  </div>
                  <input
                    className="w-full"
                    max={6}
                    min={1}
                    onChange={(event) => setMaxDepth(Number(event.target.value))}
                    step={1}
                    type="range"
                    value={maxDepth}
                  />
                </label>
              </div>
            </div>
          </aside>

          <section className="ui-studio-stage grid border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="ui-studio-stage-panel min-h-0">
              <GraphTreeTechniques
                alignment={resolvedVariant.alignment}
                mode={resolvedVariant.mode}
                onSelect={(id) =>
                  setSelection(VIEW_ID, {
                    entity: 'nodes',
                    ids: [id],
                    sourceViewId: VIEW_ID,
                  })
                }
                root={trimmedRoot}
                selectedId={selectedNodeId}
                selectedPathIds={hierarchyPath.map((node) => node.id)}
                statusLabel={consoleStatus.label}
                statusTone={consoleStatus.tone}
                subtitle={`${formatCompactNumber(hierarchySummary.nodeCount)} visible nodes across the ${variant.replace('-', ' ')} technique.`}
                theme={chartTheme}
                title="Hierarchy technique stage"
              />
            </div>
          </section>

          <aside className="ui-studio-detail border-t xl:min-h-0 xl:border-t-0">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
              <SectionHeader
                detail="Inspect the selected hierarchy path, read the current technique framing, and jump into the largest visible leaves."
                icon={Database}
                title="Detail rail"
              />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                <div className="ui-studio-surface border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Hierarchy focus</p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-[1.7rem] leading-tight text-[var(--ui-text-primary)]">
                    {activeNode?.label ?? 'No selected node'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeNode ? (
                      <>
                        <Badge variant="secondary">{`Depth ${activeNode.depth}`}</Badge>
                        <Badge>{variant}</Badge>
                      </>
                    ) : (
                      <Badge variant="outline">Select a node to inspect its path</Badge>
                    )}
                  </div>
                </div>

                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Nodes" tone="accent" value={`${hierarchySummary.nodeCount}`} />
                  <MetricReadout label="Leaves" value={`${hierarchySummary.leafCount}`} />
                  <MetricReadout label="Max depth" value={`${hierarchySummary.maxDepth}`} />
                </div>

                <Separator className="ui-studio-divider" />

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Technique summary</p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Variant</span><span className="font-medium text-[var(--ui-text-primary)]">{variant}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Mode</span><span className="font-medium text-[var(--ui-text-primary)]">{resolvedVariant.mode}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Alignment</span><span className="font-medium text-[var(--ui-text-primary)]">{resolvedVariant.alignment}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Root</span><span className="font-medium text-[var(--ui-text-primary)]">{hierarchySummary.rootLabel}</span></div>
                  </div>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Selected path</p>
                  {hierarchyPath.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {hierarchyPath.map((node) => (
                        <Badge key={node.id} variant={node.id === selectedNodeId ? 'secondary' : 'outline'}>
                          {node.label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="ui-studio-body">Select a visible hierarchy node to inspect its ancestry path.</p>
                  )}
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Largest visible leaves</p>
                  <ScrollArea className="max-h-60">
                    <div className="grid gap-2">
                      {hierarchyLeaves.map((leaf) => (
                        <button
                          className="ui-studio-record-row rounded-[var(--ui-radius-control)] border p-3 text-left"
                          key={leaf.id}
                          onClick={() =>
                            setSelection(VIEW_ID, {
                              entity: 'nodes',
                              ids: [leaf.id],
                              sourceViewId: VIEW_ID,
                            })
                          }
                          onMouseDown={(event) => event.preventDefault()}
                          type="button"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-[var(--ui-text-primary)]">{leaf.label}</span>
                            <Badge variant="secondary">{leaf.value.toFixed(0)}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-[var(--ui-text-muted)]">{`Depth ${leaf.depth}`}</p>
                        </button>
                      ))}
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
