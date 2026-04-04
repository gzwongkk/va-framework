'use client';

import type { DatasetDescriptor, QuerySpec } from '@va/contracts';
import type { StarterVariantDefinition } from '@va/view-system';
import {
  AdjacencyMatrixBrush,
  D3ForceGraph,
  GraphTreeTechniques,
  SankeyFlowDiagram,
  type D3ScatterPlotTheme,
} from '@va/vis-core';
import { Badge, Input, Separator, ToggleGroup, ToggleGroupItem } from '@va/ui';
import { Database, Filter, Network } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  buildAdjacencyMatrixModel,
  buildHierarchyTree,
  getHierarchyLeafPreview,
  getHierarchyPath,
  summarizeHierarchyTree,
} from '@/lib/analytics/graph-workbench-analytics';
import {
  DEFAULT_GRAPH_CONTROLS,
  buildGraphQuery,
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
  buildEnergyQuery,
  getEnergyLegend,
  getTopEnergyLinks,
  normalizeEnergyGraph,
  summarizeEnergyFlow,
} from '@/lib/analytics/energy-analytics';
import {
  buildHierarchyQuery,
  hierarchyVariantOptions,
  limitHierarchyDepth,
  resolveHierarchyVariant,
  type HierarchyVariant,
} from '@/lib/analytics/hierarchy-analytics';
import {
  MetricReadout,
  RangeField,
  SectionHeader,
  StatusPill,
} from '@/components/workspace/cars-shell-primitives';
import { StarterWorkbenchControls } from '@/components/workspace/starter-workbench-controls';
import { VisualizationProvenancePanel } from '@/components/workspace/visualization-provenance-panel';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import {
  getStarterHelpText,
  getStarterSchemaGuidance,
  getStarterVariantLabel,
  type SupportedStarterKind,
} from '@/lib/starter-workbench';

const VIEW_ID = 'starter-graph';
const ORDERING_OPTIONS = [
  { label: 'Original', value: 'original' },
  { label: 'Alpha', value: 'alphabetical' },
  { label: 'Degree', value: 'degree' },
  { label: 'Group', value: 'group' },
] as const;

type GraphVariantId = 'force' | 'matrix' | 'hierarchy' | 'flow';

type Props = {
  availableDatasets: DatasetDescriptor[];
  availableVariants: StarterVariantDefinition[];
  buttonPreset: string;
  chartTheme: D3ScatterPlotTheme;
  dataset: DatasetDescriptor;
  onDatasetChange: (datasetId: string) => void;
  onKindChange: (kind: SupportedStarterKind) => void;
  onVariantChange: (variantId: string) => void;
  variantId: GraphVariantId;
  visualizationId: string;
};

export function StarterGraphPanels({
  availableDatasets,
  availableVariants,
  buttonPreset,
  chartTheme,
  dataset,
  onDatasetChange,
  onKindChange,
  onVariantChange,
  variantId,
  visualizationId,
}: Props) {
  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const selectedIds = useCoordinationStore((state) => state.selections[VIEW_ID]?.ids ?? []);
  const selectedId = selectedIds[0];
  const setActiveDatasetId = useCoordinationStore((state) => state.setActiveDatasetId);
  const setActiveViewId = useCoordinationStore((state) => state.setActiveViewId);
  const setFilters = useCoordinationStore((state) => state.setFilters);
  const setLastQuery = useCoordinationStore((state) => state.setLastQuery);
  const setPreferredExecutionMode = useCoordinationStore((state) => state.setPreferredExecutionMode);
  const setSelection = useCoordinationStore((state) => state.setSelection);
  const setVisualizationControlValues = useCoordinationStore((state) => state.setVisualizationControlValues);

  const [selectedGroups, setSelectedGroups] = useState<number[]>(DEFAULT_GRAPH_CONTROLS.selectedGroups);
  const [minEdgeWeight, setMinEdgeWeight] = useState(0);
  const [neighborDepth, setNeighborDepth] = useState<1 | 2>(1);
  const [scopeMode, setScopeMode] = useState<GraphScopeMode>('full-graph');
  const [ordering, setOrdering] = useState<'original' | 'alphabetical' | 'degree' | 'group'>('original');
  const [searchTerm, setSearchTerm] = useState('');
  const [hierarchyVariant, setHierarchyVariant] = useState<HierarchyVariant>('tidy-tree');
  const [hierarchyDepth, setHierarchyDepth] = useState(4);

  useEffect(() => {
    setActiveDatasetId(dataset.id);
    setActiveViewId(VIEW_ID);
    setVisualizationControlValues(visualizationId, {
      dataset: dataset.id,
      execution: preferredExecutionMode,
      kind: 'graph',
      variant: variantId,
    });
  }, [
    dataset.id,
    preferredExecutionMode,
    setActiveDatasetId,
    setActiveViewId,
    setVisualizationControlValues,
    variantId,
    visualizationId,
  ]);

  useEffect(() => {
    setSelection(VIEW_ID, { entity: 'nodes', ids: [], sourceViewId: VIEW_ID });
  }, [dataset.id, setSelection]);

  const query = useMemo<QuerySpec>(() => {
    if (dataset.id === 'energy') {
      return buildEnergyQuery({ executionMode: preferredExecutionMode, minFlowValue: minEdgeWeight });
    }
    if (dataset.id === 'flare') {
      return buildHierarchyQuery(preferredExecutionMode);
    }
    return buildGraphQuery(dataset.id, {
      executionMode: preferredExecutionMode,
      minEdgeWeight,
      neighborDepth,
      scopeMode,
      searchTerm,
      selectedGroups,
      selectedNodeId: selectedId,
    });
  }, [
    dataset.id,
    minEdgeWeight,
    neighborDepth,
    preferredExecutionMode,
    scopeMode,
    searchTerm,
    selectedGroups,
    selectedId,
  ]);

  const executionPlan = useMemo(() => planExecution(dataset, query), [dataset, query]);
  const resolvedExecutionMode = executionPlan.mode;
  const localQuery = resolvedExecutionMode === 'local' ? { ...query, executionMode: 'local' as const } : query;
  const remoteQuery = resolvedExecutionMode === 'remote' ? { ...query, executionMode: 'remote' as const } : query;
  const localPreview = useLocalPreviewQuery(dataset, localQuery, resolvedExecutionMode === 'local');
  const remotePreview = useRemotePreviewQuery(remoteQuery, resolvedExecutionMode === 'remote');
  const activePreview = resolvedExecutionMode === 'local' ? localPreview : remotePreview;

  useEffect(() => {
    setFilters(query.filters);
    setLastQuery({ ...query, executionMode: resolvedExecutionMode });
  }, [query, resolvedExecutionMode, setFilters, setLastQuery]);

  const graphResult = useMemo(() => normalizeGraphResult(activePreview.data), [activePreview.data]);
  const graphSummary = useMemo(() => summarizeGraphResult(graphResult), [graphResult]);
  const graphData = useMemo(() => toForceGraphData(graphResult, selectedId), [graphResult, selectedId]);
  const selectedNode = useMemo(() => findSelectedGraphNode(graphResult, selectedId), [graphResult, selectedId]);
  const neighbors = useMemo(() => getNodeNeighbors(graphResult, selectedId), [graphResult, selectedId]);
  const topNodes = useMemo(() => getTopGraphNodes(graphResult), [graphResult]);
  const searchMatches = useMemo(() => getNodeSearchMatches(graphResult, searchTerm), [graphResult, searchTerm]);
  const groupOptions = useMemo(() => getGraphGroupOptions(graphResult), [graphResult]);
  const matrixModel = useMemo(() => buildAdjacencyMatrixModel(graphResult, ordering), [graphResult, ordering]);
  const hierarchyRoot = useMemo(() => buildHierarchyTree(graphResult), [graphResult]);
  const limitedHierarchyRoot = useMemo(() => limitHierarchyDepth(hierarchyRoot, hierarchyDepth), [hierarchyDepth, hierarchyRoot]);
  const hierarchySummary = useMemo(() => summarizeHierarchyTree(limitedHierarchyRoot), [limitedHierarchyRoot]);
  const hierarchyPath = useMemo(() => getHierarchyPath(limitedHierarchyRoot, selectedId), [limitedHierarchyRoot, selectedId]);
  const hierarchyLeaves = useMemo(() => getHierarchyLeafPreview(limitedHierarchyRoot), [limitedHierarchyRoot]);
  const energyGraph = useMemo(() => normalizeEnergyGraph(activePreview.data), [activePreview.data]);
  const energySummary = useMemo(() => summarizeEnergyFlow(energyGraph, selectedId), [energyGraph, selectedId]);
  const topEnergyLinks = useMemo(() => getTopEnergyLinks(energyGraph), [energyGraph]);
  const statusTone = activePreview.error ? 'error' : activePreview.isFetching && activePreview.data ? 'warning' : 'accent';
  const statusLabel = activePreview.error
    ? 'Query unavailable'
    : activePreview.isFetching && activePreview.data
      ? 'Refreshing preview'
      : resolvedExecutionMode === 'local'
        ? 'Browser runtime active'
        : 'API runtime active';
  const metricReadouts = dataset.id === 'energy'
    ? [
        { label: 'Visible nodes', value: `${energySummary.visibleNodeCount}` },
        { label: 'Links', value: `${energySummary.linkCount}` },
        { label: 'Total flow', value: `${energySummary.totalFlow.toFixed(1)}` },
      ]
    : dataset.id === 'flare'
      ? [
          { label: 'Nodes', value: `${hierarchySummary.nodeCount}` },
          { label: 'Leaves', value: `${hierarchySummary.leafCount}` },
          { label: 'Max depth', value: `${hierarchySummary.maxDepth}` },
        ]
      : [
          { label: 'Nodes', value: `${graphSummary.nodeCount}` },
          { label: 'Edges', value: `${graphSummary.edgeCount}` },
          { label: 'Average degree', value: `${graphSummary.averageDegree.toFixed(2)}` },
        ];

  const stage = variantId === 'matrix' ? (
    <AdjacencyMatrixBrush
      cells={matrixModel.cells}
      nodes={matrixModel.nodes.map((node) => ({ degree: node.degree, group: node.group, id: node.id, label: node.label }))}
      onSelectIds={(ids) => setSelection(VIEW_ID, { entity: 'nodes', ids, sourceViewId: VIEW_ID })}
      selectedIds={selectedIds}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle="Switch datasets or ordering while keeping the same starter shell and detail model."
      theme={chartTheme}
      title={`${dataset.title} / ${getStarterVariantLabel(variantId)}`}
      truncated={matrixModel.truncated}
    />
  ) : variantId === 'hierarchy' ? (
    <GraphTreeTechniques
      alignment={resolveHierarchyVariant(hierarchyVariant).alignment}
      mode={resolveHierarchyVariant(hierarchyVariant).mode}
      onSelect={(id) => setSelection(VIEW_ID, { entity: 'nodes', ids: [id], sourceViewId: VIEW_ID })}
      root={limitedHierarchyRoot}
      selectedId={selectedId}
      selectedPathIds={hierarchyPath.map((node) => node.id)}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle="Explicit and implicit tree techniques are exposed through one hierarchy starter."
      theme={chartTheme}
      title={`${dataset.title} / ${getStarterVariantLabel(variantId)}`}
    />
  ) : variantId === 'flow' ? (
    <SankeyFlowDiagram
      legend={getEnergyLegend(energyGraph)}
      links={(energyGraph?.links ?? []).map((link) => ({
        color: getGraphGroupColor(link.sourceStage),
        id: link.id,
        source: link.source,
        sourceStage: link.sourceStage,
        target: link.target,
        targetStage: link.targetStage,
        value: link.value,
      }))}
      nodes={(energyGraph?.nodes ?? []).map((node) => ({
        color: getGraphGroupColor(node.stage),
        id: node.id,
        label: node.label,
        stage: node.stage,
      }))}
      onSelectNode={(id) => setSelection(VIEW_ID, { entity: 'nodes', ids: [id], sourceViewId: VIEW_ID })}
      selectedNodeId={selectedId}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle="The flow starter keeps the same shell while swapping in a staged network technique."
      theme={chartTheme}
      title={`${dataset.title} / ${getStarterVariantLabel(variantId)}`}
    />
  ) : (
    <D3ForceGraph
      edges={graphData.edges}
      legend={groupOptions.map((group) => ({ color: getGraphGroupColor(group), label: `Group ${group}` }))}
      nodes={graphData.nodes}
      onSelect={(id) => setSelection(VIEW_ID, { entity: 'nodes', ids: [id], sourceViewId: VIEW_ID })}
      selectedId={selectedId}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle="The graph starter keeps force and matrix exploration inside the same workbench contract."
      summaryItems={[
        { label: 'Nodes', value: `${graphSummary.nodeCount}` },
        { label: 'Edges', value: `${graphSummary.edgeCount}` },
      ]}
      theme={chartTheme}
      title={`${dataset.title} / ${getStarterVariantLabel(variantId)}`}
    />
  );

  return (
    <>
      <aside className="ui-studio-rail border-t xl:min-h-0 xl:border-t-0 xl:border-r">
        <StarterWorkbenchControls
          activeDatasetId={dataset.id}
          activeKind="graph"
          activeVariantId={variantId}
          availableDatasets={availableDatasets}
          availableVariants={availableVariants}
          buttonPreset={buttonPreset}
          onDatasetChange={onDatasetChange}
          onKindChange={onKindChange}
          onRuntimeChange={setPreferredExecutionMode}
          onVariantChange={onVariantChange}
          runtime={preferredExecutionMode}
        >
          <div className="ui-studio-metric-stack grid">
            {metricReadouts.map((metric, index) => (
              <MetricReadout key={metric.label} label={metric.label} tone={index === 0 ? 'accent' : 'neutral'} value={metric.value} />
            ))}
          </div>

          <Separator className="ui-studio-divider" />

          {dataset.id === 'miserables' ? (
            <div className="grid gap-4">
              <SectionHeader detail="Miserables is the primary graph starter for force and matrix workflows." icon={Filter} title="Dataset controls" />
              <ToggleGroup className="flex flex-wrap gap-2" onValueChange={(values) => setSelectedGroups(values.map((value) => Number(value)))} type="multiple" value={selectedGroups.map(String)}>
                {groupOptions.map((group) => (
                  <ToggleGroupItem className="px-3 text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} key={group} value={String(group)}>
                    Group {group}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <RangeField label="Minimum edge weight" max={12} min={0} onChange={setMinEdgeWeight} step={0.5} value={minEdgeWeight} valueLabel={minEdgeWeight.toFixed(1)} />
              <ToggleGroup className="grid grid-cols-2 gap-2" onValueChange={(value) => value && setScopeMode(value as GraphScopeMode)} type="single" value={scopeMode}>
                <ToggleGroupItem className="text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} value="full-graph">Full graph</ToggleGroupItem>
                <ToggleGroupItem className="text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} value="focused-neighborhood">Neighborhood</ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup className="grid grid-cols-2 gap-2" onValueChange={(value) => value && setNeighborDepth(Number(value) as 1 | 2)} type="single" value={String(neighborDepth)}>
                <ToggleGroupItem className="text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} value="1">1 hop</ToggleGroupItem>
                <ToggleGroupItem className="text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} value="2">2 hop</ToggleGroupItem>
              </ToggleGroup>
              {variantId === 'matrix' ? (
                <ToggleGroup className="flex flex-wrap gap-2" onValueChange={(value) => value && setOrdering(value as 'original' | 'alphabetical' | 'degree' | 'group')} type="single" value={ordering}>
                  {ORDERING_OPTIONS.map((option) => (
                    <ToggleGroupItem className="px-3 text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} key={option.value} value={option.value}>
                      {option.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : null}
              <Input onChange={(event) => setSearchTerm(event.target.value)} placeholder="Find node label..." value={searchTerm} />
              {searchMatches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {searchMatches.slice(0, 6).map((node) => (
                    <button className="ui-studio-toggle rounded-[var(--ui-radius-control)] border px-3 py-2 text-left text-xs font-medium" key={node.id} onClick={() => setSelection(VIEW_ID, { entity: 'nodes', ids: [node.id], sourceViewId: VIEW_ID })} type="button">
                      {node.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {dataset.id === 'flare' ? (
            <div className="grid gap-4">
              <SectionHeader detail="Flare demonstrates how hierarchy techniques fit inside the same graph starter contract." icon={Filter} title="Dataset controls" />
              <ToggleGroup className="flex flex-wrap gap-2" onValueChange={(value) => value && setHierarchyVariant(value as HierarchyVariant)} type="single" value={hierarchyVariant}>
                {hierarchyVariantOptions.map((option) => (
                  <ToggleGroupItem className="px-3 text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} key={option.value} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <RangeField label="Hierarchy depth" max={8} min={2} onChange={setHierarchyDepth} value={hierarchyDepth} valueLabel={`${hierarchyDepth}`} />
            </div>
          ) : null}

          {dataset.id === 'energy' ? (
            <div className="grid gap-4">
              <SectionHeader detail="Energy shows how flow-style graph datasets can still start from the same framework shell." icon={Filter} title="Dataset controls" />
              <RangeField label="Minimum flow value" max={50} min={0} onChange={setMinEdgeWeight} step={1} value={minEdgeWeight} valueLabel={minEdgeWeight.toFixed(0)} />
            </div>
          ) : null}
        </StarterWorkbenchControls>
      </aside>

      <section className="ui-studio-stage grid border-t xl:min-h-0 xl:border-t-0 xl:border-r">
        <div className="ui-studio-stage-panel min-h-0">{stage}</div>
      </section>

      <aside className="ui-studio-detail border-t xl:min-h-0 xl:border-t-0">
        <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
          <SectionHeader detail="Graph starters share the same detail model even when the technique changes from force to matrix, hierarchy, or flow." icon={Database} title="Starter details" />
          <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
            <div className="ui-studio-surface border p-4 shadow-sm shadow-slate-950/5">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Focused entity</p>
              {dataset.id === 'energy' ? (
                energySummary.activeNode ? (
                  <div className="mt-3 grid gap-3">
                    <p className="font-[family-name:var(--font-display)] text-[1.6rem] leading-tight text-[var(--ui-text-primary)]">{energySummary.activeNode.label}</p>
                    <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                      <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Stage</span><span className="font-medium text-[var(--ui-text-primary)]">{energySummary.activeNode.stage}</span></div>
                      <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Throughput</span><span className="font-medium text-[var(--ui-text-primary)]">{energySummary.activeNode.throughput.toFixed(1)}</span></div>
                    </div>
                  </div>
                ) : <p className="ui-studio-body mt-3">Select a flow node to inspect it here.</p>
              ) : selectedNode ? (
                <div className="mt-3 grid gap-3">
                  <p className="font-[family-name:var(--font-display)] text-[1.6rem] leading-tight text-[var(--ui-text-primary)]">{selectedNode.label}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{dataset.id}</Badge>
                    <Badge variant="secondary">{variantId}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Group</span><span className="font-medium text-[var(--ui-text-primary)]">{selectedNode.group}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Degree</span><span className="font-medium text-[var(--ui-text-primary)]">{selectedNode.degree}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Weighted degree</span><span className="font-medium text-[var(--ui-text-primary)]">{selectedNode.weightedDegree.toFixed(1)}</span></div>
                  </div>
                </div>
              ) : (
                <p className="ui-studio-body mt-3">Select a node or matrix region to inspect it here.</p>
              )}
            </div>

            <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Starter guidance</p>
              <p className="ui-studio-body">{getStarterHelpText('graph', variantId)}</p>
              <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                {getStarterSchemaGuidance(dataset).map((line) => (
                  <div className="flex items-start gap-2" key={line}>
                    <span className="mt-1 size-1.5 rounded-full bg-[var(--ui-accent-text)]" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Query envelope</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{dataset.title}</Badge>
                <Badge>{resolvedExecutionMode}</Badge>
                <Badge>{getStarterVariantLabel(variantId)}</Badge>
                <StatusPill label={statusLabel} tone={statusTone} />
              </div>
              <p className="ui-studio-body">{executionPlan.reasons[0]}</p>
            </div>

            {dataset.id === 'miserables' ? (
              <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Neighborhood</p>
                <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                  {neighbors.slice(0, 8).map((neighbor) => (
                    <div className="flex items-start justify-between gap-4" key={neighbor.id}>
                      <span className="text-[var(--ui-text-muted)]">{neighbor.label}</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{neighbor.connectionWeight}</span>
                    </div>
                  ))}
                  {neighbors.length === 0 ? <p className="ui-studio-body">No focused neighbors yet.</p> : null}
                </div>
              </div>
            ) : null}

            {dataset.id === 'flare' ? (
              <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Hierarchy summary</p>
                <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                  <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Root</span><span className="font-medium text-[var(--ui-text-primary)]">{hierarchySummary.rootLabel}</span></div>
                  <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Active path</span><span className="font-medium text-[var(--ui-text-primary)]">{hierarchyPath.length}</span></div>
                  {hierarchyLeaves.slice(0, 5).map((leaf) => (
                    <div className="flex items-start justify-between gap-4" key={leaf.id}>
                      <span className="text-[var(--ui-text-muted)]">{leaf.label}</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{leaf.value.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {dataset.id === 'energy' ? (
              <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Top flow links</p>
                <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                  {topEnergyLinks.slice(0, 6).map((link) => (
                    <div className="flex items-start justify-between gap-4" key={link.id}>
                      <span className="text-[var(--ui-text-muted)]">{link.sourceLabel} to {link.targetLabel}</span>
                      <span className="font-medium text-[var(--ui-text-primary)]">{link.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Top connected nodes</p>
              <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                {topNodes.slice(0, 6).map((node) => (
                  <div className="flex items-start justify-between gap-4" key={node.id}>
                    <span className="text-[var(--ui-text-muted)]">{node.id}</span>
                    <span className="font-medium text-[var(--ui-text-primary)]">{node.degree}</span>
                  </div>
                ))}
                {topNodes.length === 0 ? <p className="ui-studio-body">No summary nodes are available for this starter view.</p> : null}
              </div>
            </div>

            <VisualizationProvenancePanel activeDatasetId={dataset.id} exampleId={visualizationId} />
          </div>
        </div>
      </aside>
    </>
  );
}
