'use client';

import {
  buildGraphQuery,
  DEFAULT_GRAPH_CONTROLS,
  findSelectedGraphNode,
  getGraphGroupColor,
  getGraphGroupOptions,
  getNodeNeighbors,
  getNodeSearchMatches,
  getTopGraphNodes,
  normalizeGraphResult,
  summarizeGraphResult,
  toForceGraphData,
  type GraphScopeMode,
} from '@/lib/analytics/graph-analytics';
import {
  formatMetric,
  MetricReadout,
  RangeField,
  SectionHeader,
  StatusPill,
} from '@/components/workspace/cars-shell-primitives';
import { GraphTechniquePlaceholder } from '@/components/workspace/graph-technique-placeholder';
import { UiStudioDrawer } from '@/components/workspace/ui-studio-drawer';
import { WorkspaceRouteNav } from '@/components/workspace/workspace-route-nav';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import {
  graphDatasetOptions,
  graphTechniqueOptions,
  isGraphWorkbenchDatasetId,
  isGraphTechnique,
  parseGraphDatasetParam,
  parseGraphTechniqueParam,
  type GraphTechnique,
} from '@/lib/graph-workbench';
import { useGraphWorkbenchStore } from '@/lib/graph-workbench-store';
import { resolveChartTheme, resolveUiStudioVars } from '@/lib/ui-studio';
import { useUiStudioStore } from '@/lib/ui-studio-store';
import {
  Badge,
  Button,
  Input,
  ScrollArea,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
} from '@va/ui';
import { D3ForceGraph } from '@va/vis-core';
import { Database, GitBranch, Network, Search, SlidersHorizontal, Workflow } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type CSSProperties, startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';

const VIEW_ID = 'graph-canvas';
const EXECUTION_MODES = ['local', 'remote'] as const;
const DEPTH_OPTIONS = ['1', '2'] as const;
const GRAPH_SCOPE_OPTIONS = ['full-graph', 'focused-neighborhood'] as const;
const ORDERING_OPTIONS = [
  { label: 'Original', value: 'original' },
  { label: 'Alpha', value: 'alphabetical' },
  { label: 'Degree', value: 'degree' },
  { label: 'Group', value: 'group' },
] as const;
const SHOW_UI_STUDIO = process.env.NODE_ENV !== 'production';

function formatWeight(value: number) {
  return `${value.toFixed(1)} weight`;
}

function getTechniqueNarrative(technique: GraphTechnique, datasetTitle: string) {
  switch (technique) {
    case 'matrix':
      return `The ${datasetTitle} workbench is scaffolded for adjacency matrix brushing and ordering in the next v2.3.x patches.`;
    case 'tree':
      return `The ${datasetTitle} workbench is scaffolded for explicit and implicit tree techniques in the next v2.3.x patches.`;
    case 'multivariate':
      return `The ${datasetTitle} workbench is scaffolded for multivariate network encodings in the next v2.3.x patches.`;
    default:
      return `Explore ${datasetTitle} in the graph workbench, then carry the same state into matrix, tree, and multivariate techniques as they land.`;
  }
}

export function GraphSingleViewShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const datasetCatalog = useDatasetCatalog();
  const uiPrefs = useUiStudioStore((state) => state.prefs);
  const uiCssVars = useMemo(() => resolveUiStudioVars(uiPrefs), [uiPrefs]);
  const chartTheme = useMemo(() => resolveChartTheme(uiPrefs), [uiPrefs]);

  const workbenchTechnique = useGraphWorkbenchStore((state) => state.technique);
  const workbenchDataset = useGraphWorkbenchStore((state) => state.dataset);
  const ordering = useGraphWorkbenchStore((state) => state.ordering);
  const setWorkbenchTechnique = useGraphWorkbenchStore((state) => state.setTechnique);
  const setWorkbenchDataset = useGraphWorkbenchStore((state) => state.setDataset);
  const setOrdering = useGraphWorkbenchStore((state) => state.setOrdering);
  const setWorkbenchScopeMode = useGraphWorkbenchStore((state) => state.setScopeMode);
  const setWorkbenchSelectedNodeIds = useGraphWorkbenchStore((state) => state.setSelectedNodeIds);
  const setWorkbenchFocusNodeId = useGraphWorkbenchStore((state) => state.setFocusNodeId);

  const uiTechnique = parseGraphTechniqueParam(searchParams.get('technique'));
  const uiDataset = parseGraphDatasetParam(searchParams.get('dataset'));
  const uiDatasetParam = searchParams.get('dataset');
  const uiTechniqueParam = searchParams.get('technique');

  const activeTechnique = workbenchTechnique;
  const activeDatasetId = workbenchDataset;

  const graphDataset = useMemo(
    () => datasetCatalog.data?.find((dataset) => dataset.id === activeDatasetId),
    [activeDatasetId, datasetCatalog.data],
  );

  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const selectedNodeId = useCoordinationStore((state) => state.selections[VIEW_ID]?.ids[0]);
  const coordinationDatasetId = useCoordinationStore((state) => state.activeDatasetId);
  const setActiveDatasetId = useCoordinationStore((state) => state.setActiveDatasetId);
  const setActiveViewId = useCoordinationStore((state) => state.setActiveViewId);
  const setFilters = useCoordinationStore((state) => state.setFilters);
  const setLastQuery = useCoordinationStore((state) => state.setLastQuery);
  const setPreferredExecutionMode = useCoordinationStore((state) => state.setPreferredExecutionMode);
  const setSelection = useCoordinationStore((state) => state.setSelection);

  const [selectedGroups, setSelectedGroups] = useState<number[]>(DEFAULT_GRAPH_CONTROLS.selectedGroups);
  const [minEdgeWeight, setMinEdgeWeight] = useState(DEFAULT_GRAPH_CONTROLS.minEdgeWeight);
  const [neighborDepth, setNeighborDepth] = useState<1 | 2>(DEFAULT_GRAPH_CONTROLS.neighborDepth);
  const [scopeMode, setScopeMode] = useState<GraphScopeMode>(DEFAULT_GRAPH_CONTROLS.scopeMode);
  const [searchTerm, setSearchTerm] = useState<string>(DEFAULT_GRAPH_CONTROLS.searchTerm ?? '');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  function updateWorkbenchUrl(next: Partial<{ dataset: typeof activeDatasetId; technique: GraphTechnique }>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('dataset', next.dataset ?? activeDatasetId);
    params.set('technique', next.technique ?? activeTechnique);
    const nextQueryString = params.toString();
    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  useEffect(() => {
    if (workbenchTechnique !== uiTechnique) {
      setWorkbenchTechnique(uiTechnique);
    }
  }, [setWorkbenchTechnique, uiTechnique, workbenchTechnique]);

  useEffect(() => {
    if (workbenchDataset !== uiDataset) {
      setWorkbenchDataset(uiDataset);
    }
  }, [setWorkbenchDataset, uiDataset, workbenchDataset]);

  useEffect(() => {
    if (uiTechniqueParam && uiDatasetParam) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (!isGraphTechnique(uiTechniqueParam)) {
      params.set('technique', uiTechnique);
    }
    if (!isGraphWorkbenchDatasetId(uiDatasetParam)) {
      params.set('dataset', uiDataset);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams, uiDataset, uiDatasetParam, uiTechnique, uiTechniqueParam]);

  useEffect(() => {
    setWorkbenchScopeMode(scopeMode);
  }, [scopeMode, setWorkbenchScopeMode]);

  useEffect(() => {
    setWorkbenchSelectedNodeIds(selectedNodeId ? [selectedNodeId] : []);
    setWorkbenchFocusNodeId(selectedNodeId);
  }, [selectedNodeId, setWorkbenchFocusNodeId, setWorkbenchSelectedNodeIds]);

  const query = useMemo(
    () =>
      buildGraphQuery(activeDatasetId, {
        executionMode: preferredExecutionMode,
        minEdgeWeight,
        neighborDepth,
        scopeMode,
        selectedGroups,
        selectedNodeId,
      }),
    [
      activeDatasetId,
      minEdgeWeight,
      neighborDepth,
      preferredExecutionMode,
      scopeMode,
      selectedGroups,
      selectedNodeId,
    ],
  );

  const executionPlan = useMemo(
    () => (graphDataset ? planExecution(graphDataset, query) : undefined),
    [graphDataset, query],
  );
  const resolvedExecutionMode = executionPlan?.mode ?? preferredExecutionMode;
  const localQuery = resolvedExecutionMode === 'local' ? { ...query, executionMode: 'local' as const } : query;
  const remoteQuery = resolvedExecutionMode === 'remote' ? { ...query, executionMode: 'remote' as const } : query;
  const localPreview = useLocalPreviewQuery(
    graphDataset,
    localQuery,
    Boolean(graphDataset && resolvedExecutionMode === 'local'),
  );
  const remotePreview = useRemotePreviewQuery(remoteQuery, Boolean(graphDataset && resolvedExecutionMode === 'remote'));
  const activePreview = resolvedExecutionMode === 'local' ? localPreview : remotePreview;
  const graphResult = useMemo(() => normalizeGraphResult(activePreview.data), [activePreview.data]);
  const graphSummary = useMemo(() => summarizeGraphResult(graphResult), [graphResult]);
  const graphData = useMemo(() => toForceGraphData(graphResult, selectedNodeId), [graphResult, selectedNodeId]);
  const selectedNode = useMemo(() => findSelectedGraphNode(graphResult, selectedNodeId), [graphResult, selectedNodeId]);
  const neighbors = useMemo(() => getNodeNeighbors(graphResult, selectedNodeId), [graphResult, selectedNodeId]);
  const topNodes = useMemo(() => getTopGraphNodes(graphResult), [graphResult]);
  const searchMatches = useMemo(
    () => getNodeSearchMatches(graphResult, deferredSearchTerm),
    [deferredSearchTerm, graphResult],
  );
  const availableGroups = useMemo(() => getGraphGroupOptions(graphResult), [graphResult]);
  const graphLegend = useMemo(
    () =>
      availableGroups.map((groupId) => ({
        color: getGraphGroupColor(groupId),
        label: activeDatasetId === 'flare' ? `Depth ${groupId}` : `Group ${groupId}`,
      })),
    [activeDatasetId, availableGroups],
  );

  useEffect(() => {
    if (graphDataset && coordinationDatasetId !== activeDatasetId) {
      setActiveDatasetId(activeDatasetId);
    }
  }, [activeDatasetId, coordinationDatasetId, graphDataset, setActiveDatasetId]);

  useEffect(() => {
    setActiveViewId(VIEW_ID);
  }, [setActiveViewId]);

  useEffect(() => {
    setFilters(query.filters);
    setLastQuery({
      ...query,
      executionMode: resolvedExecutionMode,
    });
  }, [query, resolvedExecutionMode, setFilters, setLastQuery]);

  useEffect(() => {
    if (selectedNodeId && graphResult && !graphResult.nodes.some((node) => node.id === selectedNodeId)) {
      setSelection(VIEW_ID, {
        entity: 'nodes',
        ids: [],
        sourceViewId: VIEW_ID,
      });
    }
  }, [graphResult, selectedNodeId, setSelection]);

  const initialLoading = datasetCatalog.isLoading || (activePreview.isLoading && !activePreview.data);
  const isRefreshing = activePreview.isFetching && Boolean(activePreview.data);
  const activeError = activePreview.error;
  const datasetLabel = graphDataset?.title ?? 'Graph dataset';
  const techniqueNarrative = getTechniqueNarrative(activeTechnique, datasetLabel);
  const groupLabel = activeDatasetId === 'flare' ? 'Depth filter' : 'Community filter';
  const groupTagLabel = activeDatasetId === 'flare' ? 'Depth' : 'Group';
  const searchPlaceholder =
    activeDatasetId === 'flare' ? 'Search hierarchy nodes' : 'Search nodes by name';

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
        detail: 'Loading the graph registry, workbench state, and active dataset topology.',
        label: 'Loading graph workbench',
        tone: 'neutral' as const,
      };
    }

    if (isRefreshing) {
      return {
        detail: 'Controls update the graph quietly while the current technique state remains visible.',
        label: 'Refreshing graph state',
        tone: 'warning' as const,
      };
    }

    return {
      detail: executionPlan?.reasons[0] ?? techniqueNarrative,
      label: resolvedExecutionMode === 'local' ? 'Graphology runtime active' : 'API runtime active',
      tone: 'accent' as const,
    };
  }, [activeError, executionPlan, initialLoading, isRefreshing, resolvedExecutionMode, techniqueNarrative]);

  const scopeHelpText =
    scopeMode === 'full-graph'
      ? `Showing the full ${datasetLabel} topology. Selecting a node highlights it without filtering the current graph.`
      : selectedNode
        ? 'The canvas is scoped to the selected node and expanded by the active neighborhood depth.'
        : 'Neighborhood mode is enabled. Select a node in the graph or search results to narrow the visible graph.';

  const selectNode = (nodeId: string) =>
    setSelection(VIEW_ID, {
      entity: 'nodes',
      ids: [nodeId],
      sourceViewId: VIEW_ID,
    });

  const clearSelection = () =>
    setSelection(VIEW_ID, {
      entity: 'nodes',
      ids: [],
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
                va-framework / graph workbench
              </p>
              <h1 className="ui-studio-shell-title mt-2 font-[family-name:var(--font-display)] leading-none">
                {datasetLabel}
              </h1>
              <p className="ui-studio-body mt-2 max-w-3xl">{techniqueNarrative}</p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <WorkspaceRouteNav buttonPreset={uiPrefs.buttonPreset} />
              <Badge>{activeTechnique}</Badge>
              <Badge>{activeDatasetId}</Badge>
              <Badge>{resolvedExecutionMode}</Badge>
              <Badge>{`${graphSummary.nodeCount} nodes / ${graphSummary.edgeCount} edges`}</Badge>
              <StatusPill label={consoleStatus.label} tone={consoleStatus.tone} />
              {SHOW_UI_STUDIO ? <UiStudioDrawer buttonPreset={uiPrefs.buttonPreset} /> : null}
            </div>

            <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.22em]">Technique</p>
                  <Workflow className="size-4 text-[var(--ui-text-muted)]" />
                </div>
                <ToggleGroup
                  className="grid gap-2 md:grid-cols-4"
                  onValueChange={(value) => {
                    if (isGraphTechnique(value)) {
                      setWorkbenchTechnique(value);
                      updateWorkbenchUrl({ technique: value });
                    }
                  }}
                  type="single"
                  value={activeTechnique}
                >
                  {graphTechniqueOptions.map((option) => (
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

              <div className="grid min-w-[280px] gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.22em]">Dataset</p>
                  <Database className="size-4 text-[var(--ui-text-muted)]" />
                </div>
                <ToggleGroup
                  className="grid gap-2"
                  onValueChange={(value) => {
                    if (isGraphWorkbenchDatasetId(value)) {
                      setSelectedGroups([]);
                      setSearchTerm('');
                      clearSelection();
                      setWorkbenchDataset(value);
                      updateWorkbenchUrl({ dataset: value });
                    }
                  }}
                  type="single"
                  value={activeDatasetId}
                >
                  {graphDatasetOptions.map((option) => (
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
            </div>
          </header>

          <aside className="ui-studio-rail border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_1fr]">
              <div className="grid gap-4">
                <SectionHeader
                  detail="Tune execution mode, graph scope, ordering, and group filters for the active dataset."
                  icon={SlidersHorizontal}
                  title="Control rail"
                />
                <div className="ui-studio-metric-stack grid">
                  <MetricReadout label="Node count" tone="accent" value={`${graphSummary.nodeCount}`} />
                  <MetricReadout label="Edge count" value={`${graphSummary.edgeCount}`} />
                  <MetricReadout label="Average degree" value={formatMetric(graphSummary.averageDegree, 'deg')} />
                </div>
              </div>

              <Separator className="ui-studio-divider" />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Execution mode</p>
                    <Database className="size-4 text-[var(--ui-text-muted)]" />
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
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Graph ordering</p>
                    <Workflow className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="grid w-full grid-cols-2 gap-2"
                    onValueChange={(value) => {
                      if (value === 'original' || value === 'alphabetical' || value === 'degree' || value === 'group') {
                        setOrdering(value);
                      }
                    }}
                    type="single"
                    value={ordering}
                  >
                    {ORDERING_OPTIONS.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        className="w-full text-xs font-semibold uppercase tracking-[0.18em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={option.value}
                      >
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <p className="ui-studio-body">
                    Ordering is scaffolded now so adjacency matrix and later tree techniques can reuse the same workbench state.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">{groupLabel}</p>
                    <GitBranch className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="flex flex-wrap gap-2"
                    onValueChange={(value) => setSelectedGroups(value.map((groupId) => Number(groupId)))}
                    type="multiple"
                    value={selectedGroups.filter((group) => availableGroups.includes(group)).map(String)}
                  >
                    {availableGroups.map((groupId) => (
                      <ToggleGroupItem
                        key={groupId}
                        className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={`${groupId}`}
                      >
                        <span
                          className="mr-2 size-2 rounded-full"
                          style={{ backgroundColor: getGraphGroupColor(groupId) }}
                        />
                        {groupTagLabel} {groupId}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <RangeField
                  label="Minimum edge weight"
                  max={7}
                  min={0}
                  onChange={setMinEdgeWeight}
                  step={1}
                  value={minEdgeWeight}
                  valueLabel={`${minEdgeWeight}`}
                />

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Neighborhood depth</p>
                    <Network className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="grid w-full grid-cols-2 gap-2"
                    onValueChange={(value) => {
                      if (value === '1' || value === '2') {
                        setNeighborDepth(Number(value) as 1 | 2);
                      }
                    }}
                    type="single"
                    value={`${neighborDepth}`}
                  >
                    {DEPTH_OPTIONS.map((depth) => (
                      <ToggleGroupItem
                        key={depth}
                        className="w-full text-xs font-semibold uppercase tracking-[0.18em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={depth}
                      >
                        {depth} hop
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Graph scope</p>
                    <Network className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="grid w-full grid-cols-2 gap-2"
                    onValueChange={(value) => {
                      if (value === 'full-graph' || value === 'focused-neighborhood') {
                        setScopeMode(value);
                      }
                    }}
                    type="single"
                    value={scopeMode}
                  >
                    {GRAPH_SCOPE_OPTIONS.map((mode) => (
                      <ToggleGroupItem
                        key={mode}
                        className="w-full text-xs font-semibold uppercase tracking-[0.18em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={mode}
                      >
                        {mode === 'full-graph' ? 'Full graph' : 'Neighborhood'}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <p className="ui-studio-body">{scopeHelpText}</p>
                  {selectedNode ? (
                    <Button
                      className="ui-studio-toggle justify-center px-3"
                      data-active={false}
                      data-button-style={uiPrefs.buttonPreset}
                      onClick={clearSelection}
                      type="button"
                      variant="secondary"
                    >
                      Clear node selection
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Node search</p>
                    <Search className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <Input
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                  />
                  <ScrollArea className="max-h-44 rounded-[var(--ui-radius-panel)] border ui-studio-surface">
                    <div className="grid gap-2 p-3">
                      {searchMatches.length > 0 ? (
                        searchMatches.map((node) => (
                          <button
                            key={node.id}
                            className="ui-studio-record-row ui-studio-table-cell cursor-pointer rounded-[var(--ui-radius-control)] border text-left"
                            data-active={node.id === selectedNodeId}
                            onClick={() => selectNode(node.id)}
                            onMouseDown={(event) => event.preventDefault()}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-[var(--ui-text-primary)]">{node.label}</span>
                              <Badge variant="secondary">{groupTagLabel.charAt(0)}{node.group}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                              Degree {node.degree} · Weight {node.weightedDegree.toFixed(1)}
                            </p>
                          </button>
                        ))
                      ) : (
                        <p className="ui-studio-body">No nodes match the current search term.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </aside>

          <section className="ui-studio-stage grid border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="ui-studio-stage-panel min-h-0">
              {activeTechnique === 'force' ? (
                <D3ForceGraph
                  edges={graphData.edges}
                  emptyLabel={
                    activeError
                      ? activeError.message
                      : initialLoading
                        ? 'Loading graph dataset...'
                        : 'No nodes match the current graph controls.'
                  }
                  height={640}
                  legend={graphLegend}
                  nodes={graphData.nodes}
                  onSelect={selectNode}
                  selectedId={selectedNode?.id}
                  statusLabel={consoleStatus.label}
                  statusTone={consoleStatus.tone}
                  subtitle={
                    scopeMode === 'full-graph'
                      ? `The full ${datasetLabel} topology with shared workbench state and live node inspection.`
                      : 'A focused neighborhood view around the selected node with weighted links and live filtering.'
                  }
                  theme={chartTheme}
                  title={`${datasetLabel} network canvas`}
                />
              ) : (
                <GraphTechniquePlaceholder
                  dataset={graphDataset}
                  technique={activeTechnique}
                  theme={chartTheme}
                />
              )}
            </div>
          </section>

          <aside className="ui-studio-detail border-t xl:min-h-0 xl:border-t-0">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
              <SectionHeader
                detail="Inspect the active node, follow its strongest neighbors, and read back the live graph summary."
                icon={Database}
                title="Detail rail"
              />

              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                {selectedNode ? (
                  <>
                    <div className="ui-studio-surface border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Focused node</p>
                      <p className="mt-3 font-[family-name:var(--font-display)] text-[1.8rem] leading-tight text-[var(--ui-text-primary)]">
                        {selectedNode.label}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{groupTagLabel} {selectedNode.group}</Badge>
                        <Badge>{selectedNode.degree} degree</Badge>
                        <Badge>{selectedNode.weightedDegree.toFixed(1)} weighted</Badge>
                        {selectedNode.depth !== undefined ? <Badge>Depth {selectedNode.depth}</Badge> : null}
                        {selectedNode.parentId ? <Badge>Parent {selectedNode.parentId}</Badge> : null}
                      </div>
                    </div>

                    <div className="ui-studio-metric-stack grid">
                      <MetricReadout label="Degree" tone="accent" value={`${selectedNode.degree}`} />
                      <MetricReadout label="Weighted degree" value={selectedNode.weightedDegree.toFixed(1)} />
                      <MetricReadout label="Neighbors shown" value={`${neighbors.length}`} />
                    </div>
                  </>
                ) : (
                  <div className="ui-studio-surface border border-dashed p-5 text-sm leading-6 text-[var(--ui-text-secondary)]">
                    Select a node in the active technique or from the search list to inspect it here.
                  </div>
                )}

                <Separator className="ui-studio-divider" />

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Neighbor list</p>
                  <ScrollArea className="max-h-52">
                    <Table>
                      <TableHeader>
                        <TableRow className="ui-studio-record-head">
                          <TableHead className="ui-studio-table-cell">Node</TableHead>
                          <TableHead className="ui-studio-table-cell">Weight</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {neighbors.length > 0 ? (
                          neighbors.map((neighbor) => (
                            <TableRow
                              key={neighbor.id}
                              className="ui-studio-record-row cursor-pointer"
                              data-active={neighbor.id === selectedNodeId}
                              onClick={() => selectNode(neighbor.id)}
                              onMouseDown={(event) => event.preventDefault()}
                            >
                              <TableCell className="ui-studio-table-cell">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: getGraphGroupColor(neighbor.group) }}
                                  />
                                  {neighbor.label}
                                </div>
                              </TableCell>
                              <TableCell className="ui-studio-table-cell">{neighbor.connectionWeight}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className="ui-studio-record-row">
                            <TableCell className="ui-studio-table-cell" colSpan={2}>
                              No focused neighbors yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Top connected nodes</p>
                  <ScrollArea className="max-h-52">
                    <Table>
                      <TableHeader>
                        <TableRow className="ui-studio-record-head">
                          <TableHead className="ui-studio-table-cell">Node</TableHead>
                          <TableHead className="ui-studio-table-cell">Degree</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topNodes.map((node) => {
                          const matchingNode = graphResult?.nodes.find((graphNode) => graphNode.id === node.id);

                          return (
                            <TableRow
                              key={node.id}
                              className="ui-studio-record-row cursor-pointer"
                              data-active={node.id === selectedNodeId}
                              onClick={() => selectNode(node.id)}
                              onMouseDown={(event) => event.preventDefault()}
                            >
                              <TableCell className="ui-studio-table-cell">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: getGraphGroupColor(node.group) }}
                                  />
                                  {matchingNode?.label ?? node.id}
                                </div>
                              </TableCell>
                              <TableCell className="ui-studio-table-cell">{node.degree}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Graph summary</p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Technique</span>
                      <span className="text-right font-medium text-[var(--ui-text-primary)]">{activeTechnique}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Dataset</span>
                      <span className="text-right font-medium text-[var(--ui-text-primary)]">{datasetLabel}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Focused node</span>
                      <span className="text-right font-medium text-[var(--ui-text-primary)]">
                        {graphSummary.focusedNodeLabel}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Group count</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{graphSummary.groupCount}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Average degree</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">
                        {graphSummary.averageDegree.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Strongest link</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">
                        {formatWeight(graphSummary.strongestLinkWeight)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--ui-text-muted)]">Neighborhood depth</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{neighborDepth} hop</span>
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
