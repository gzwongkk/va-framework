'use client';

import { D3ForceGraph } from '@va/vis-core';
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
import {
  Database,
  GitBranch,
  Network,
  Search,
  SlidersHorizontal,
  Sparkles,
  TreePine,
  Workflow,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  type CSSProperties,
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  handleSelectableRowKeyDown,
  formatMetric,
  MetricReadout,
  RangeField,
  SectionHeader,
  StatusPill,
} from '@/components/workspace/cars-shell-primitives';
import { GraphWorkbenchMatrixPanel } from '@/components/workspace/graph-workbench-matrix-panel';
import { GraphWorkbenchMultivariatePanel } from '@/components/workspace/graph-workbench-multivariate-panel';
import { GraphWorkbenchTreePanel } from '@/components/workspace/graph-workbench-tree-panel';
import { UiStudioDrawer } from '@/components/workspace/ui-studio-drawer';
import { WorkspaceRouteNav } from '@/components/workspace/workspace-route-nav';
import {
  buildAdjacencyMatrixModel,
  buildHierarchyTree,
  deriveMultivariateNodes,
  getHierarchyLeafPreview,
  getHierarchyPath,
  getMatrixSelectionEdges,
  getMultivariateFieldProfiles,
  getMultivariateFieldOptions,
  getMultivariateValue,
  getTechniqueHelp,
  summarizeHierarchyTree,
  summarizeMatrixSelection,
  type EnrichedGraphNode,
} from '@/lib/analytics/graph-workbench-analytics';
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
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useDatasetCatalog, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import {
  graphDatasetOptions,
  graphTechniqueOptions,
  isGraphWorkbenchDatasetId,
  isGraphTechnique,
  multivariateLayoutOptions,
  parseGraphDatasetParam,
  parseGraphTechniqueParam,
  treeAlignmentOptions,
  treeTechniqueModeOptions,
  type GraphTechnique,
  type MultivariateLayoutMode,
  type TreeAlignment,
  type TreeTechniqueMode,
} from '@/lib/graph-workbench';
import {
  type MultivariateEncodingConfig,
  useGraphWorkbenchStore,
} from '@/lib/graph-workbench-store';
import { resolveChartTheme, resolveUiStudioVars } from '@/lib/ui-studio';
import { useUiStudioStore } from '@/lib/ui-studio-store';

const VIEW_ID = 'graph-canvas';
const EMPTY_SELECTION_IDS: string[] = [];
const EXECUTION_MODES = ['local', 'remote'] as const;
const DEPTH_OPTIONS = ['1', '2'] as const;
const GRAPH_SCOPE_OPTIONS = ['full-graph', 'focused-neighborhood'] as const;
const ORDERING_OPTIONS = [
  { label: 'Original', value: 'original' },
  { label: 'Alpha', value: 'alphabetical' },
  { label: 'Degree', value: 'degree' },
  { label: 'Group', value: 'group' },
] as const;
const EDGE_WIDTH_OPTIONS = [
  { description: 'Scale link thickness by edge weight.', label: 'Weight', value: 'value' },
  { description: 'Emphasize within-community vs cross-community links.', label: 'Community', value: 'community' },
] as const;
const EDGE_COLOR_OPTIONS = [
  { description: 'Use edge weight intensity for stroke color.', label: 'Weight', value: 'value' },
  { description: 'Color edges by shared community context.', label: 'Community', value: 'community' },
] as const;
const SHOW_UI_STUDIO = process.env.NODE_ENV !== 'production';

function formatWeight(value: number) {
  return `${value.toFixed(1)} weight`;
}

function formatFieldLabel(field: string) {
  return field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTechniqueNarrative(technique: GraphTechnique, datasetTitle: string) {
  switch (technique) {
    case 'matrix':
      return `Inspect ${datasetTitle} as an ordered adjacency matrix with brushing and density-oriented comparison.`;
    case 'tree':
      return `Read ${datasetTitle} through explicit and implicit hierarchy layouts when parent-child structure is the dominant task.`;
    case 'multivariate':
      return `Encode ${datasetTitle} by graph metrics and attributes so topology and attribute structure can be compared together.`;
    default:
      return `Explore ${datasetTitle} as a topology-first force graph, then carry the same state into matrix, tree, and multivariate techniques.`;
  }
}

function getTechniqueStageSubtitle(
  technique: GraphTechnique,
  datasetLabel: string,
  scopeMode: GraphScopeMode,
) {
  switch (technique) {
    case 'matrix':
      return `Ordered ${datasetLabel} connectivity with brushable rows and columns for block analysis.`;
    case 'tree':
      return `Hierarchy-focused analysis for ${datasetLabel} using explicit and implicit tree techniques.`;
    case 'multivariate':
      return `Analytical network encodings for ${datasetLabel} without leaving the single-canvas workbench.`;
    default:
      return scopeMode === 'full-graph'
        ? `The full ${datasetLabel} topology with shared workbench state and live node inspection.`
        : 'A focused neighborhood view around the selected node with weighted links and live filtering.';
  }
}

function needsFlareTreeDataset(datasetId: string, technique: GraphTechnique) {
  return technique === 'tree' && datasetId !== 'flare';
}

function WorkbenchNotice({
  action,
  description,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="ui-studio-surface flex h-[640px] flex-col items-center justify-center gap-4 border border-dashed px-8 text-center">
      <div className="ui-studio-icon-chip rounded-[var(--ui-radius-control)] border p-3 shadow-sm shadow-slate-950/5">
        <TreePine className="size-5" />
      </div>
      <div className="grid max-w-lg gap-2">
        <p className="font-[family-name:var(--font-display)] text-[1.6rem] leading-tight text-[var(--ui-text-primary)]">
          {title}
        </p>
        <p className="ui-studio-body">{description}</p>
      </div>
      {action}
    </div>
  );
}

function getSafeEncodingConfig(
  encodings: MultivariateEncodingConfig,
  nodes: EnrichedGraphNode[],
): MultivariateEncodingConfig {
  const fieldOptions = getMultivariateFieldOptions(nodes);
  const allFieldOptions = [...fieldOptions.numeric, ...fieldOptions.categorical];
  const firstNumericField = fieldOptions.numeric[0] ?? 'degree';
  const fallbackXField = fieldOptions.numeric.includes('betweenness') ? 'betweenness' : firstNumericField;
  const fallbackYField =
    fieldOptions.numeric.find((field) => field !== fallbackXField) ?? firstNumericField;
  const firstCategoricalField =
    fieldOptions.categorical.includes('community')
      ? 'community'
      : fieldOptions.categorical[0];

  return {
    colorField: allFieldOptions.includes(encodings.colorField)
      ? encodings.colorField
      : firstCategoricalField ?? firstNumericField,
    edgeColorField:
      EDGE_COLOR_OPTIONS.some((option) => option.value === encodings.edgeColorField)
        ? encodings.edgeColorField
        : 'community',
    edgeWidthField:
      EDGE_WIDTH_OPTIONS.some((option) => option.value === encodings.edgeWidthField)
        ? encodings.edgeWidthField
        : 'value',
    facetField:
      encodings.facetField && fieldOptions.categorical.includes(encodings.facetField)
        ? encodings.facetField
        : firstCategoricalField,
    layoutMode: multivariateLayoutOptions.some((option) => option.value === encodings.layoutMode)
      ? encodings.layoutMode
      : 'encoded-force',
    sizeField: fieldOptions.numeric.includes(encodings.sizeField) ? encodings.sizeField : firstNumericField,
    xField: fieldOptions.numeric.includes(encodings.xField) ? encodings.xField : fallbackXField,
    yField: fieldOptions.numeric.includes(encodings.yField) ? encodings.yField : fallbackYField,
  };
}

export function GraphSingleViewShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const datasetCatalog = useDatasetCatalog();
  const uiPrefs = useUiStudioStore((state) => state.prefs);
  const uiCssVars = useMemo(() => resolveUiStudioVars(uiPrefs), [uiPrefs]);
  const chartTheme = useMemo(() => resolveChartTheme(uiPrefs), [uiPrefs]);

  const workbenchTechnique = useGraphWorkbenchStore((state) => state.technique);
  const workbenchDataset = useGraphWorkbenchStore((state) => state.dataset);
  const ordering = useGraphWorkbenchStore((state) => state.ordering);
  const treeMode = useGraphWorkbenchStore((state) => state.treeMode);
  const treeAlignment = useGraphWorkbenchStore((state) => state.treeAlignment);
  const encodings = useGraphWorkbenchStore((state) => state.encodings);
  const setWorkbenchTechnique = useGraphWorkbenchStore((state) => state.setTechnique);
  const setWorkbenchDataset = useGraphWorkbenchStore((state) => state.setDataset);
  const setOrdering = useGraphWorkbenchStore((state) => state.setOrdering);
  const setWorkbenchScopeMode = useGraphWorkbenchStore((state) => state.setScopeMode);
  const setWorkbenchSelectedNodeIds = useGraphWorkbenchStore((state) => state.setSelectedNodeIds);
  const setWorkbenchFocusNodeId = useGraphWorkbenchStore((state) => state.setFocusNodeId);
  const setTreeMode = useGraphWorkbenchStore((state) => state.setTreeMode);
  const setTreeAlignment = useGraphWorkbenchStore((state) => state.setTreeAlignment);
  const setEncodings = useGraphWorkbenchStore((state) => state.setEncodings);

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
  const selectedNodeIds = useCoordinationStore((state) => state.selections[VIEW_ID]?.ids ?? EMPTY_SELECTION_IDS);
  const selectedNodeId = selectedNodeIds[0];
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

  function selectNodes(ids: string[]) {
    setSelection(VIEW_ID, {
      entity: 'nodes',
      ids,
      sourceViewId: VIEW_ID,
    });
  }

  function selectNode(nodeId: string) {
    selectNodes([nodeId]);
  }

  function clearSelection() {
    selectNodes([]);
  }

  function activateTechnique(nextTechnique: GraphTechnique) {
    setWorkbenchTechnique(nextTechnique);
    updateWorkbenchUrl({ technique: nextTechnique });
  }

  function activateDataset(nextDatasetId: typeof activeDatasetId) {
    setSelectedGroups([]);
    setSearchTerm('');
    clearSelection();
    setWorkbenchDataset(nextDatasetId);
    updateWorkbenchUrl({ dataset: nextDatasetId });
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
    setWorkbenchSelectedNodeIds(selectedNodeIds);
    setWorkbenchFocusNodeId(selectedNodeId);
  }, [selectedNodeId, selectedNodeIds, setWorkbenchFocusNodeId, setWorkbenchSelectedNodeIds]);

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
  const matrixModel = useMemo(() => buildAdjacencyMatrixModel(graphResult, ordering), [graphResult, ordering]);
  const matrixSelectionSummary = useMemo(
    () => summarizeMatrixSelection(matrixModel, selectedNodeIds),
    [matrixModel, selectedNodeIds],
  );
  const matrixSelectionEdges = useMemo(
    () => getMatrixSelectionEdges(matrixModel, selectedNodeIds),
    [matrixModel, selectedNodeIds],
  );
  const hierarchyRoot = useMemo(() => buildHierarchyTree(graphResult), [graphResult]);
  const hierarchySummary = useMemo(() => summarizeHierarchyTree(hierarchyRoot), [hierarchyRoot]);
  const hierarchyPath = useMemo(() => getHierarchyPath(hierarchyRoot, selectedNodeId), [hierarchyRoot, selectedNodeId]);
  const hierarchyLeaves = useMemo(() => getHierarchyLeafPreview(hierarchyRoot), [hierarchyRoot]);
  const multivariateNodes = useMemo(
    () => deriveMultivariateNodes(graphResult, selectedNodeId),
    [graphResult, selectedNodeId],
  );
  const safeEncodingConfig = useMemo(
    () => getSafeEncodingConfig(encodings, multivariateNodes),
    [encodings, multivariateNodes],
  );
  const multivariateFieldOptions = useMemo(
    () => getMultivariateFieldOptions(multivariateNodes),
    [multivariateNodes],
  );
  const multivariateFieldProfiles = useMemo(
    () => getMultivariateFieldProfiles(multivariateNodes),
    [multivariateNodes],
  );
  const selectedMultivariateNode = useMemo(
    () => multivariateNodes.find((node) => node.id === selectedNodeId),
    [multivariateNodes, selectedNodeId],
  );
  const selectedNodeSet = useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);
  const techniqueHelp = useMemo(() => getTechniqueHelp(activeTechnique), [activeTechnique]);
  const treeTechniqueRequiresFlare = needsFlareTreeDataset(activeDatasetId, activeTechnique);

  useEffect(() => {
    const safeEncodingJson = JSON.stringify(safeEncodingConfig);
    const currentEncodingJson = JSON.stringify(encodings);
    if (safeEncodingJson !== currentEncodingJson) {
      setEncodings(safeEncodingConfig);
    }
  }, [encodings, safeEncodingConfig, setEncodings]);

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
    if (!graphResult || selectedNodeIds.length === 0) {
      return;
    }

    const visibleNodeIds = new Set(graphResult.nodes.map((node) => node.id));
    if (!selectedNodeIds.every((nodeId) => visibleNodeIds.has(nodeId))) {
      setSelection(VIEW_ID, {
        entity: 'nodes',
        ids: [],
        sourceViewId: VIEW_ID,
      });
    }
  }, [graphResult, selectedNodeIds, setSelection]);

  const handleKeyboardShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const isEditableTarget =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      Boolean(target?.isContentEditable);

    if (event.key === '/' && !isEditableTarget) {
      event.preventDefault();
      searchInputRef.current?.focus();
      return;
    }

    if (event.key === 'Escape') {
      const currentSearchInput = searchInputRef.current;
      if (isEditableTarget && currentSearchInput && currentSearchInput === target) {
        currentSearchInput.blur();
      }
      setSelection(VIEW_ID, {
        entity: 'nodes',
        ids: [],
        sourceViewId: VIEW_ID,
      });
      return;
    }

    if (isEditableTarget) {
      return;
    }

    if (event.key === '1') {
      activateTechnique('force');
    } else if (event.key === '2') {
      activateTechnique('matrix');
    } else if (event.key === '3') {
      activateTechnique('tree');
    } else if (event.key === '4') {
      activateTechnique('multivariate');
    }
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyboardShortcut(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initialLoading = datasetCatalog.isLoading || (activePreview.isLoading && !activePreview.data);
  const isRefreshing = activePreview.isFetching && Boolean(activePreview.data);
  const activeError = activePreview.error;
  const datasetLabel = graphDataset?.title ?? 'Graph dataset';
  const techniqueNarrative = formatTechniqueNarrative(activeTechnique, datasetLabel);
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
        detail: 'Controls update the active graph quietly while the current technique remains visible.',
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

  const effectiveStatusLabel = treeTechniqueRequiresFlare ? 'Switch to flare for tree analysis' : consoleStatus.label;
  const effectiveStatusTone = treeTechniqueRequiresFlare ? 'warning' : consoleStatus.tone;
  const scopeHelpText =
    scopeMode === 'full-graph'
      ? `Showing the full ${datasetLabel} topology. Selecting a node highlights it without filtering the current graph.`
      : selectedNode
        ? 'The canvas is scoped to the selected node and expanded by the active neighborhood depth.'
        : 'Neighborhood mode is enabled. Select a node in the graph or search results to narrow the visible graph.';

  const selectedNodeMetrics = selectedNode
    ? [
        { label: 'Degree', tone: 'accent' as const, value: `${selectedNode.degree}` },
        { label: 'Weighted degree', tone: 'neutral' as const, value: selectedNode.weightedDegree.toFixed(1) },
        { label: 'Neighbors shown', tone: 'neutral' as const, value: `${neighbors.length}` },
      ]
    : [];

  const stagePanel = (() => {
    if (activeTechnique === 'force') {
      return (
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
          selectedId={selectedNodeId}
          statusLabel={effectiveStatusLabel}
          statusTone={effectiveStatusTone}
          subtitle={getTechniqueStageSubtitle(activeTechnique, datasetLabel, scopeMode)}
          theme={chartTheme}
          title={`${datasetLabel} network canvas`}
        />
      );
    }

    if (activeTechnique === 'matrix') {
      return (
        <GraphWorkbenchMatrixPanel
          datasetLabel={datasetLabel}
          matrix={matrixModel}
          onSelectIds={selectNodes}
          ordering={ordering}
          selectedIds={selectedNodeIds}
          statusLabel={effectiveStatusLabel}
          statusTone={effectiveStatusTone}
          theme={chartTheme}
        />
      );
    }

    if (activeTechnique === 'tree') {
      if (treeTechniqueRequiresFlare) {
        return (
          <WorkbenchNotice
            action={(
              <Button
                className="ui-studio-toggle px-4"
                data-active
                data-button-style={uiPrefs.buttonPreset}
                onClick={() => activateDataset('flare')}
                type="button"
                variant="default"
              >
                Switch to flare
              </Button>
            )}
            description="The tree line in v2.3 is grounded in the true hierarchy dataset. Switch to flare to inspect explicit and implicit tree layouts."
            title="Tree techniques are ready for flare"
          />
        );
      }

      return (
        <GraphWorkbenchTreePanel
          alignment={treeAlignment}
          datasetLabel={datasetLabel}
          mode={treeMode}
          onSelect={selectNode}
          root={hierarchyRoot}
          selectedId={selectedNodeId}
          selectedPathIds={hierarchyPath.map((node) => node.id)}
          statusLabel={effectiveStatusLabel}
          statusTone={effectiveStatusTone}
          theme={chartTheme}
        />
      );
    }

    return (
      <GraphWorkbenchMultivariatePanel
        config={safeEncodingConfig}
        datasetLabel={datasetLabel}
        onSelect={selectNode}
        result={graphResult}
        selectedId={selectedNodeId}
        statusLabel={effectiveStatusLabel}
        statusTone={effectiveStatusTone}
        theme={chartTheme}
      />
    );
  })();

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
              <p className="ui-studio-label font-semibold uppercase tracking-[0.28em]">va-framework / graph workbench</p>
              <h1 className="ui-studio-shell-title mt-2 font-[family-name:var(--font-display)] leading-none">{datasetLabel}</h1>
              <p className="ui-studio-body mt-2 max-w-3xl">{techniqueNarrative}</p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <WorkspaceRouteNav buttonPreset={uiPrefs.buttonPreset} />
              <Badge>{activeTechnique}</Badge>
              <Badge>{activeDatasetId}</Badge>
              <Badge>{resolvedExecutionMode}</Badge>
              <Badge>{`${graphSummary.nodeCount} nodes / ${graphSummary.edgeCount} edges`}</Badge>
              <StatusPill label={effectiveStatusLabel} tone={effectiveStatusTone} />
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
                      activateTechnique(value);
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
                      activateDataset(value);
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
                  detail="Tune execution mode, graph scope, ordering, and technique-specific controls for the active dataset."
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
                  <p className="ui-studio-body">Order the shared graph state for adjacency matrix analysis and later technique reuse.</p>
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
                        <span className="mr-2 size-2 rounded-full" style={{ backgroundColor: getGraphGroupColor(groupId) }} />
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
                  {selectedNodeIds.length > 0 ? (
                    <Button
                      className="ui-studio-toggle justify-center px-3"
                      data-active={false}
                      data-button-style={uiPrefs.buttonPreset}
                      onClick={clearSelection}
                      type="button"
                      variant="secondary"
                    >
                      Clear selection
                    </Button>
                  ) : null}
                </div>

                {activeTechnique === 'tree' ? (
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Tree technique</p>
                      <TreePine className="size-4 text-[var(--ui-text-muted)]" />
                    </div>
                    <ToggleGroup
                      className="grid gap-2"
                      onValueChange={(value) => {
                        if (value === 'node-link' || value === 'icicle' || value === 'sunburst') {
                          setTreeMode(value as TreeTechniqueMode);
                        }
                      }}
                      type="single"
                      value={treeMode}
                    >
                      {treeTechniqueModeOptions.map((option) => (
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
                    {treeMode === 'node-link' ? (
                      <ToggleGroup
                        className="grid w-full grid-cols-2 gap-2"
                        onValueChange={(value) => {
                          if (value === 'axis-parallel' || value === 'radial') {
                            setTreeAlignment(value as TreeAlignment);
                          }
                        }}
                        type="single"
                        value={treeAlignment}
                      >
                        {treeAlignmentOptions.map((option) => (
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
                    ) : null}
                  </div>
                ) : null}

                {activeTechnique === 'multivariate' ? (
                  <>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Layout mode</p>
                        <Sparkles className="size-4 text-[var(--ui-text-muted)]" />
                      </div>
                      <ToggleGroup
                        className="grid gap-2"
                        onValueChange={(value) => {
                          if (value === 'encoded-force' || value === 'attribute-position' || value === 'faceted') {
                            setEncodings({ layoutMode: value as MultivariateLayoutMode });
                          }
                        }}
                        type="single"
                        value={safeEncodingConfig.layoutMode}
                      >
                        {multivariateLayoutOptions.map((option) => (
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

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Node size</p>
                        <Sparkles className="size-4 text-[var(--ui-text-muted)]" />
                      </div>
                      <ToggleGroup
                        className="flex flex-wrap gap-2"
                        onValueChange={(value) => {
                          if (multivariateFieldOptions.numeric.includes(value)) {
                            setEncodings({ sizeField: value });
                          }
                        }}
                        type="single"
                        value={safeEncodingConfig.sizeField}
                      >
                        {multivariateFieldOptions.numeric.slice(0, 8).map((field) => (
                          <ToggleGroupItem
                            key={field}
                            className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                            data-button-style={uiPrefs.buttonPreset}
                            value={field}
                          >
                            {formatFieldLabel(field)}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Node color</p>
                        <Sparkles className="size-4 text-[var(--ui-text-muted)]" />
                      </div>
                      <ToggleGroup
                        className="flex flex-wrap gap-2"
                        onValueChange={(value) => {
                          if ([...multivariateFieldOptions.categorical, ...multivariateFieldOptions.numeric].includes(value)) {
                            setEncodings({ colorField: value });
                          }
                        }}
                        type="single"
                        value={safeEncodingConfig.colorField}
                      >
                        {[...multivariateFieldOptions.categorical, ...multivariateFieldOptions.numeric].slice(0, 8).map((field) => (
                          <ToggleGroupItem
                            key={field}
                            className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                            data-button-style={uiPrefs.buttonPreset}
                            value={field}
                          >
                            {formatFieldLabel(field)}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Edge encoding</p>
                        <Network className="size-4 text-[var(--ui-text-muted)]" />
                      </div>
                      <ToggleGroup
                        className="grid w-full grid-cols-2 gap-2"
                        onValueChange={(value) => {
                          if (value === 'value' || value === 'community') {
                            setEncodings({ edgeWidthField: value });
                          }
                        }}
                        type="single"
                        value={safeEncodingConfig.edgeWidthField}
                      >
                        {EDGE_WIDTH_OPTIONS.map((option) => (
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
                      <ToggleGroup
                        className="grid w-full grid-cols-2 gap-2"
                        onValueChange={(value) => {
                          if (value === 'value' || value === 'community') {
                            setEncodings({ edgeColorField: value });
                          }
                        }}
                        type="single"
                        value={safeEncodingConfig.edgeColorField}
                      >
                        {EDGE_COLOR_OPTIONS.map((option) => (
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

                    {safeEncodingConfig.layoutMode !== 'encoded-force' ? (
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Positioning</p>
                          <Workflow className="size-4 text-[var(--ui-text-muted)]" />
                        </div>
                        <ToggleGroup
                          className="flex flex-wrap gap-2"
                          onValueChange={(value) => {
                            if (multivariateFieldOptions.numeric.includes(value)) {
                              setEncodings({ xField: value });
                            }
                          }}
                          type="single"
                          value={safeEncodingConfig.xField}
                        >
                          {multivariateFieldOptions.numeric.slice(0, 8).map((field) => (
                            <ToggleGroupItem
                              key={`x-${field}`}
                              className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                              data-button-style={uiPrefs.buttonPreset}
                              value={field}
                            >
                              X {formatFieldLabel(field)}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                        <ToggleGroup
                          className="flex flex-wrap gap-2"
                          onValueChange={(value) => {
                            if (multivariateFieldOptions.numeric.includes(value)) {
                              setEncodings({ yField: value });
                            }
                          }}
                          type="single"
                          value={safeEncodingConfig.yField}
                        >
                          {multivariateFieldOptions.numeric.slice(0, 8).map((field) => (
                            <ToggleGroupItem
                              key={`y-${field}`}
                              className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                              data-button-style={uiPrefs.buttonPreset}
                              value={field}
                            >
                              Y {formatFieldLabel(field)}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                        {safeEncodingConfig.layoutMode === 'faceted' && safeEncodingConfig.facetField ? (
                          <ToggleGroup
                            className="flex flex-wrap gap-2"
                            onValueChange={(value) => {
                              if (multivariateFieldOptions.categorical.includes(value)) {
                                setEncodings({ facetField: value });
                              }
                            }}
                            type="single"
                            value={safeEncodingConfig.facetField}
                          >
                            {multivariateFieldOptions.categorical.slice(0, 8).map((field) => (
                              <ToggleGroupItem
                                key={`facet-${field}`}
                                className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                                data-button-style={uiPrefs.buttonPreset}
                                value={field}
                              >
                                Facet {formatFieldLabel(field)}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : null}

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Node search</p>
                    <Search className="size-4 text-[var(--ui-text-muted)]" />
                  </div>
                  <Input
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={searchPlaceholder}
                    ref={searchInputRef}
                    value={searchTerm}
                  />
                  <ScrollArea className="max-h-44 rounded-[var(--ui-radius-panel)] border ui-studio-surface">
                    <div className="grid gap-2 p-3">
                      {searchMatches.length > 0 ? (
                        searchMatches.map((node) => (
                          <button
                            key={node.id}
                            className="ui-studio-record-row ui-studio-table-cell cursor-pointer rounded-[var(--ui-radius-control)] border text-left"
                            data-active={selectedNodeSet.has(node.id)}
                            onClick={() => selectNode(node.id)}
                            onMouseDown={(event) => event.preventDefault()}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-[var(--ui-text-primary)]">{node.label}</span>
                              <Badge variant="secondary">{groupTagLabel} {node.group}</Badge>
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
            <div className="ui-studio-stage-panel min-h-0">{stagePanel}</div>
          </section>

          <aside className="ui-studio-detail border-t xl:min-h-0 xl:border-t-0">
            <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
              <SectionHeader
                detail="Inspect the active selection, read back technique-specific summaries, and keep analytical guidance visible while switching graph techniques."
                icon={Database}
                title="Detail rail"
              />
              <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
                {selectedNode ? (
                  <>
                    <div className="ui-studio-surface border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Focused node</p>
                      <p className="mt-3 font-[family-name:var(--font-display)] text-[1.8rem] leading-tight text-[var(--ui-text-primary)]">{selectedNode.label}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{groupTagLabel} {selectedNode.group}</Badge>
                        <Badge>{selectedNode.degree} degree</Badge>
                        <Badge>{selectedNode.weightedDegree.toFixed(1)} weighted</Badge>
                        {selectedNode.depth !== undefined ? <Badge>Depth {selectedNode.depth}</Badge> : null}
                        {selectedNode.parentId ? <Badge>Parent {selectedNode.parentId}</Badge> : null}
                      </div>
                    </div>
                    <div className="ui-studio-metric-stack grid">
                      {selectedNodeMetrics.map((metric) => (
                        <MetricReadout key={metric.label} label={metric.label} tone={metric.tone} value={metric.value} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="ui-studio-surface border border-dashed p-5 text-sm leading-6 text-[var(--ui-text-secondary)]">
                    Select a node in the active technique or from the search list to inspect it here.
                  </div>
                )}

                {activeTechnique === 'matrix' ? (
                  <>
                    <Separator className="ui-studio-divider" />
                    <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Matrix selection</p>
                      <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Selected nodes</span><span className="font-medium text-[var(--ui-text-primary)]">{matrixSelectionSummary.selectedNodeCount}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Selected edges</span><span className="font-medium text-[var(--ui-text-primary)]">{matrixSelectionSummary.selectedEdgeCount}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Block density</span><span className="font-medium text-[var(--ui-text-primary)]">{matrixSelectionSummary.density.toFixed(3)}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Within-group links</span><span className="font-medium text-[var(--ui-text-primary)]">{matrixSelectionSummary.withinGroupEdges}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Cross-group links</span><span className="font-medium text-[var(--ui-text-primary)]">{matrixSelectionSummary.crossGroupEdges}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Visible nodes</span><span className="font-medium text-[var(--ui-text-primary)]">{matrixModel.visibleNodeCount}{matrixModel.truncated ? ` of ${matrixModel.totalNodeCount}` : ''}</span></div>
                      </div>
                    </div>
                    <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Selected block links</p>
                      {matrixSelectionEdges.length > 0 ? (
                        <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                          {matrixSelectionEdges.map((edge) => (
                            <button
                              key={`${edge.sourceId}:${edge.targetId}`}
                              className="ui-studio-record-row rounded-[var(--ui-radius-control)] border p-3 text-left"
                              onClick={() => selectNodes([edge.sourceId, edge.targetId])}
                              onMouseDown={(event) => event.preventDefault()}
                              type="button"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium text-[var(--ui-text-primary)]">{edge.sourceLabel} / {edge.targetLabel}</span>
                                <Badge variant={edge.withinGroup ? 'secondary' : 'outline'}>{edge.value.toFixed(1)}</Badge>
                              </div>
                              <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                                {edge.withinGroup ? 'Within-group' : 'Cross-group'} connection
                              </p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="ui-studio-body">Brush or click matrix cells to inspect the strongest links inside the selected block.</p>
                      )}
                    </div>
                  </>
                ) : null}

                {activeTechnique === 'tree' && !treeTechniqueRequiresFlare ? (
                  <>
                    <Separator className="ui-studio-divider" />
                    <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Hierarchy summary</p>
                      <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Root</span><span className="font-medium text-[var(--ui-text-primary)]">{hierarchySummary.rootLabel}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Nodes</span><span className="font-medium text-[var(--ui-text-primary)]">{hierarchySummary.nodeCount}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Leaves</span><span className="font-medium text-[var(--ui-text-primary)]">{hierarchySummary.leafCount}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Max depth</span><span className="font-medium text-[var(--ui-text-primary)]">{hierarchySummary.maxDepth}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Layout</span><span className="font-medium text-[var(--ui-text-primary)]">{treeMode === 'node-link' ? `${formatFieldLabel(treeMode)} / ${formatFieldLabel(treeAlignment)}` : formatFieldLabel(treeMode)}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Root id</span><span className="font-medium text-[var(--ui-text-primary)]">{graphDataset?.schema.hierarchy?.rootId ?? 'Derived'}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Parent field</span><span className="font-medium text-[var(--ui-text-primary)]">{graphDataset?.schema.hierarchy?.parentField ?? 'parentId'}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Depth field</span><span className="font-medium text-[var(--ui-text-primary)]">{graphDataset?.schema.hierarchy?.depthField ?? 'depth'}</span></div>
                      </div>
                    </div>
                    <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Hierarchy path</p>
                      {hierarchyPath.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {hierarchyPath.map((node) => (
                            <Badge key={node.id} variant={node.id === selectedNodeId ? 'secondary' : 'outline'}>
                              {node.label}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="ui-studio-body">Select a tree node to inspect its ancestry path from the hierarchy root.</p>
                      )}
                    </div>
                    <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Largest leaves</p>
                      {hierarchyLeaves.length > 0 ? (
                        <div className="grid gap-2">
                          {hierarchyLeaves.map((leaf) => (
                            <button
                              key={leaf.id}
                              className="ui-studio-record-row rounded-[var(--ui-radius-control)] border p-3 text-left"
                              onClick={() => selectNode(leaf.id)}
                              onMouseDown={(event) => event.preventDefault()}
                              type="button"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium text-[var(--ui-text-primary)]">{leaf.label}</span>
                                <Badge variant="secondary">Value {leaf.value.toFixed(0)}</Badge>
                              </div>
                              <p className="mt-1 text-xs text-[var(--ui-text-muted)]">Depth {leaf.depth}</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="ui-studio-body">No leaf preview is available for the current hierarchy slice.</p>
                      )}
                    </div>
                  </>
                ) : null}

                {activeTechnique === 'multivariate' ? (
                  <>
                    <Separator className="ui-studio-divider" />
                    <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Multivariate encodings</p>
                      <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Layout</span><span className="font-medium text-[var(--ui-text-primary)]">{formatFieldLabel(safeEncodingConfig.layoutMode)}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Size</span><span className="font-medium text-[var(--ui-text-primary)]">{formatFieldLabel(safeEncodingConfig.sizeField)}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Color</span><span className="font-medium text-[var(--ui-text-primary)]">{formatFieldLabel(safeEncodingConfig.colorField)}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Edge width</span><span className="font-medium text-[var(--ui-text-primary)]">{formatFieldLabel(safeEncodingConfig.edgeWidthField)}</span></div>
                        <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Edge color</span><span className="font-medium text-[var(--ui-text-primary)]">{formatFieldLabel(safeEncodingConfig.edgeColorField)}</span></div>
                        {safeEncodingConfig.layoutMode !== 'encoded-force' ? (
                          <>
                            <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">X axis</span><span className="font-medium text-[var(--ui-text-primary)]">{formatFieldLabel(safeEncodingConfig.xField)}</span></div>
                            <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Y axis</span><span className="font-medium text-[var(--ui-text-primary)]">{formatFieldLabel(safeEncodingConfig.yField)}</span></div>
                            {safeEncodingConfig.layoutMode === 'faceted' && safeEncodingConfig.facetField ? (
                              <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Facet</span><span className="font-medium text-[var(--ui-text-primary)]">{formatFieldLabel(safeEncodingConfig.facetField)}</span></div>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>

                    {selectedMultivariateNode ? (
                      <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                        <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Selected metrics</p>
                        <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                          {['degree', 'weightedDegree', 'betweenness', 'closeness', 'bridgeScore', 'egoDepth'].map((field) => {
                            const rawValue = getMultivariateValue(selectedMultivariateNode, field);
                            return (
                              <div key={field} className="flex items-start justify-between gap-4">
                                <span className="text-[var(--ui-text-muted)]">{formatFieldLabel(field)}</span>
                                <span className="font-medium text-[var(--ui-text-primary)]">{typeof rawValue === 'number' ? rawValue.toFixed(field === 'degree' || field === 'egoDepth' ? 0 : 3) : 'N/A'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Field profiles</p>
                      <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                        {[safeEncodingConfig.sizeField, safeEncodingConfig.colorField, safeEncodingConfig.xField, safeEncodingConfig.yField, safeEncodingConfig.facetField]
                          .filter((field): field is string => Boolean(field))
                          .filter((field, index, fields) => fields.indexOf(field) === index)
                          .map((field) => {
                            const profile = multivariateFieldProfiles.find((candidate) => candidate.field === field);
                            return (
                              <div key={field} className="flex items-start justify-between gap-4">
                                <span className="text-[var(--ui-text-muted)]">{formatFieldLabel(field)}</span>
                                <span className="text-right font-medium text-[var(--ui-text-primary)]">
                                  {profile?.kind === 'numeric'
                                    ? `${profile.min?.toFixed(3)} to ${profile.max?.toFixed(3)}`
                                    : `${profile?.categoryCount ?? 0} categories`}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                ) : null}

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
                        {neighbors.length > 0 ? neighbors.map((neighbor) => (
                          <TableRow
                            key={neighbor.id}
                            className="ui-studio-record-row cursor-pointer"
                            data-active={selectedNodeSet.has(neighbor.id)}
                            onClick={() => selectNode(neighbor.id)}
                            onKeyDown={(event) => handleSelectableRowKeyDown(event, () => selectNode(neighbor.id))}
                            onMouseDown={(event) => event.preventDefault()}
                            tabIndex={0}
                          >
                            <TableCell className="ui-studio-table-cell">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full" style={{ backgroundColor: getGraphGroupColor(neighbor.group) }} />
                                {neighbor.label}
                              </div>
                            </TableCell>
                            <TableCell className="ui-studio-table-cell">{neighbor.connectionWeight}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow className="ui-studio-record-row">
                            <TableCell className="ui-studio-table-cell" colSpan={2}>No focused neighbors yet.</TableCell>
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
                              data-active={selectedNodeSet.has(node.id)}
                              onClick={() => selectNode(node.id)}
                              onKeyDown={(event) => handleSelectableRowKeyDown(event, () => selectNode(node.id))}
                              onMouseDown={(event) => event.preventDefault()}
                              tabIndex={0}
                            >
                              <TableCell className="ui-studio-table-cell">
                                <div className="flex items-center gap-2">
                                  <span className="size-2 rounded-full" style={{ backgroundColor: getGraphGroupColor(node.group) }} />
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
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Technique</span><span className="text-right font-medium text-[var(--ui-text-primary)]">{activeTechnique}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Dataset</span><span className="text-right font-medium text-[var(--ui-text-primary)]">{datasetLabel}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Focused node</span><span className="text-right font-medium text-[var(--ui-text-primary)]">{graphSummary.focusedNodeLabel}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Group count</span><span className="font-medium text-[var(--ui-text-primary)]">{graphSummary.groupCount}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Average degree</span><span className="font-medium text-[var(--ui-text-primary)]">{graphSummary.averageDegree.toFixed(2)}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Strongest link</span><span className="font-medium text-[var(--ui-text-primary)]">{formatWeight(graphSummary.strongestLinkWeight)}</span></div>
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Neighborhood depth</span><span className="font-medium text-[var(--ui-text-primary)]">{neighborDepth} hop</span></div>
                  </div>
                </div>

                <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Technique guide</p>
                  <div className="grid gap-3 text-sm text-[var(--ui-text-secondary)]">
                    <div className="flex items-start justify-between gap-4"><span className="text-[var(--ui-text-muted)]">Reference</span><span className="text-right font-medium text-[var(--ui-text-primary)]">{techniqueHelp.reference}</span></div>
                    <p className="ui-studio-body">{techniqueHelp.summary}</p>
                    <ul className="grid gap-2 pl-4 text-[var(--ui-text-secondary)]">
                      {techniqueHelp.uses.map((line) => (
                        <li key={line} className="list-disc">{line}</li>
                      ))}
                    </ul>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">Shortcuts: 1 force, 2 matrix, 3 tree, 4 multivariate, / search, Esc clear selection.</p>
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
