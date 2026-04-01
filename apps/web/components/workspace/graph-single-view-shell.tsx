'use client';

import {
  buildGraphQuery,
  DEFAULT_GRAPH_CONTROLS,
  findSelectedGraphNode,
  getNodeNeighbors,
  getNodeSearchMatches,
  getTopGraphNodes,
  GRAPH_DATASET_ID,
  GRAPH_GROUP_OPTIONS,
  GRAPH_GROUP_PALETTE,
  type GraphScopeMode,
  normalizeGraphResult,
  summarizeGraphResult,
  toForceGraphData,
} from '@/lib/analytics/graph-analytics';
import {
  formatMetric,
  MetricReadout,
  RangeField,
  SectionHeader,
  StatusPill,
} from '@/components/workspace/cars-shell-primitives';
import { WorkspaceRouteNav } from '@/components/workspace/workspace-route-nav';
import { UiStudioDrawer } from '@/components/workspace/ui-studio-drawer';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
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
import { Database, GitBranch, Network, Search, SlidersHorizontal } from 'lucide-react';
import { type CSSProperties, useDeferredValue, useEffect, useMemo, useState } from 'react';

const VIEW_ID = 'graph-canvas';
const EXECUTION_MODES = ['local', 'remote'] as const;
const DEPTH_OPTIONS = ['1', '2'] as const;
const GRAPH_SCOPE_OPTIONS = ['full-graph', 'focused-neighborhood'] as const;
const SHOW_UI_STUDIO = process.env.NODE_ENV !== 'production';
const GRAPH_LEGEND = GRAPH_GROUP_OPTIONS.map((groupId) => ({
  color: GRAPH_GROUP_PALETTE[groupId],
  label: `Group ${groupId}`,
}));

function formatWeight(value: number) {
  return `${value.toFixed(1)} weight`;
}

export function GraphSingleViewShell() {
  const datasetCatalog = useDatasetCatalog();
  const uiPrefs = useUiStudioStore((state) => state.prefs);
  const uiCssVars = useMemo(() => resolveUiStudioVars(uiPrefs), [uiPrefs]);
  const chartTheme = useMemo(() => resolveChartTheme(uiPrefs), [uiPrefs]);
  const graphDataset = useMemo(
    () => datasetCatalog.data?.find((dataset) => dataset.id === GRAPH_DATASET_ID),
    [datasetCatalog.data],
  );

  const activeDatasetId = useCoordinationStore((state) => state.activeDatasetId);
  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const selectedNodeId = useCoordinationStore((state) => state.selections[VIEW_ID]?.ids[0]);
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

  const query = useMemo(
    () =>
      buildGraphQuery({
        executionMode: preferredExecutionMode,
        minEdgeWeight,
        neighborDepth,
        scopeMode,
        selectedGroups,
        selectedNodeId,
      }),
    [minEdgeWeight, neighborDepth, preferredExecutionMode, scopeMode, selectedGroups, selectedNodeId],
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

  useEffect(() => {
    if (graphDataset && activeDatasetId !== GRAPH_DATASET_ID) {
      setActiveDatasetId(GRAPH_DATASET_ID);
    }
  }, [activeDatasetId, graphDataset, setActiveDatasetId]);

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

  const consoleStatus = useMemo(() => {
    if (activeError) {
      return {
        detail: activeError.message,
        label: 'Graph unavailable',
        tone: 'error' as const,
      };
    }

    if (initialLoading) {
      return {
        detail: 'Loading the dataset registry and initial graph topology.',
        label: 'Loading graph workspace',
        tone: 'neutral' as const,
      };
    }

    if (isRefreshing) {
      return {
        detail: 'Controls update the subgraph quietly while the current layout stays visible.',
        label: 'Refreshing subgraph',
        tone: 'warning' as const,
      };
    }

    return {
      detail: executionPlan?.reasons[0] ?? 'Graph canvas ready for exploration.',
      label: resolvedExecutionMode === 'local' ? 'Graphology runtime active' : 'API runtime active',
      tone: 'accent' as const,
    };
  }, [activeError, executionPlan, initialLoading, isRefreshing, resolvedExecutionMode]);

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

  const scopeHelpText =
    scopeMode === 'full-graph'
      ? 'Showing the full Les Miserables graph. Selecting a node highlights it without filtering the network.'
      : selectedNode
        ? 'The canvas is scoped to the selected node and expanded by the active neighborhood depth.'
        : 'Neighborhood mode is enabled. Select a node in the graph or search results to narrow the view.';

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
                va-framework / graph data
              </p>
              <h1 className="ui-studio-shell-title mt-2 font-[family-name:var(--font-display)] leading-none">
                Les Miserables Graph Console
              </h1>
              <p className="ui-studio-body mt-2 max-w-2xl">
                Explore neighborhoods, filter communities, and inspect weighted relationships in the v2.3.0 graph workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <WorkspaceRouteNav buttonPreset={uiPrefs.buttonPreset} />
              <Badge>{GRAPH_DATASET_ID}</Badge>
              <Badge>{resolvedExecutionMode}</Badge>
              <Badge>{`${graphSummary.nodeCount} nodes / ${graphSummary.edgeCount} edges`}</Badge>
              <StatusPill label={consoleStatus.label} tone={consoleStatus.tone} />
              {SHOW_UI_STUDIO ? <UiStudioDrawer buttonPreset={uiPrefs.buttonPreset} /> : null}
            </div>
          </header>

          <aside className="ui-studio-rail border-t xl:min-h-0 xl:border-t-0 xl:border-r">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_1fr]">
              <div className="grid gap-4">
                <SectionHeader
                  detail="Filter the active graph, tune the neighborhood radius, and search for a focus node."
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
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                      Execution mode
                    </p>
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
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                      Community filter
                    </p>
                    <GitBranch className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <ToggleGroup
                    className="flex flex-wrap gap-2"
                    onValueChange={(value) => setSelectedGroups(value.map((groupId) => Number(groupId)))}
                    type="multiple"
                    value={selectedGroups.map(String)}
                  >
                    {GRAPH_GROUP_OPTIONS.map((groupId) => (
                      <ToggleGroupItem
                        key={groupId}
                        className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                        data-button-style={uiPrefs.buttonPreset}
                        value={`${groupId}`}
                      >
                        <span
                          className="mr-2 size-2 rounded-full"
                          style={{ backgroundColor: GRAPH_GROUP_PALETTE[groupId] }}
                        />
                        Group {groupId}
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
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                      Neighborhood depth
                    </p>
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
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                      Graph scope
                    </p>
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
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                      Node search
                    </p>
                    <Search className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <Input
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search nodes by name"
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
                              <Badge variant="secondary">G{node.group}</Badge>
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
                legend={GRAPH_LEGEND}
                nodes={graphData.nodes}
                onSelect={selectNode}
                selectedId={selectedNode?.id}
                statusLabel={consoleStatus.label}
                statusTone={consoleStatus.tone}
                subtitle={
                  scopeMode === 'full-graph'
                    ? 'The full Les Miserables network with community colors, weighted links, and live node inspection.'
                    : 'A focused neighborhood view around the selected node with weighted links and live filtering.'
                }
                theme={chartTheme}
                title="Character relationship network"
              />
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
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                        Focused node
                      </p>
                      <p className="mt-3 font-[family-name:var(--font-display)] text-[1.8rem] leading-tight text-[var(--ui-text-primary)]">
                        {selectedNode.label}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">Group {selectedNode.group}</Badge>
                        <Badge>{selectedNode.degree} degree</Badge>
                        <Badge>{selectedNode.weightedDegree.toFixed(1)} weighted</Badge>
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
                    Select a node in the graph or from the search list to inspect it here.
                  </div>
                )}

                <Separator className="ui-studio-divider" />

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                    Neighbor list
                  </p>
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
                                    style={{ backgroundColor: GRAPH_GROUP_PALETTE[neighbor.group] }}
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
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                    Top connected nodes
                  </p>
                  <ScrollArea className="max-h-52">
                    <Table>
                      <TableHeader>
                        <TableRow className="ui-studio-record-head">
                          <TableHead className="ui-studio-table-cell">Node</TableHead>
                          <TableHead className="ui-studio-table-cell">Degree</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topNodes.map((node) => (
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
                                  style={{ backgroundColor: GRAPH_GROUP_PALETTE[node.group] }}
                                />
                                {node.id}
                              </div>
                            </TableCell>
                            <TableCell className="ui-studio-table-cell">{node.degree}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">
                    Graph summary
                  </p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
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
