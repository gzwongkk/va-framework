import { UndirectedGraph } from 'graphology';
import type Graph from 'graphology';
import {
  createQueryFingerprint,
  type DatasetDescriptor,
  type FilterClause,
  type GraphEdge,
  type GraphNode,
  type GraphQueryResult,
  type QuerySpec,
} from '@va/contracts';

type GraphNodeAttributes = {
  group: number;
  id: string;
  label: string;
};

type GraphEdgeAttributes = {
  value: number;
};

type RawGraph = {
  links?: Array<{ source: string; target: string; value?: number }>;
  nodes?: Array<{ group?: number; id: string }>;
};

const graphPromiseCache = new Map<string, Promise<UndirectedGraph<GraphNodeAttributes, GraphEdgeAttributes>>>();

function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function asList(value: unknown) {
  return Array.isArray(value) ? value : [value];
}

function createEdgeId(source: string, target: string) {
  return [source, target].sort((left, right) => left.localeCompare(right)).join('::');
}

function matchesNodeFilter(attributes: GraphNodeAttributes, filterClause: FilterClause) {
  const value = attributes[filterClause.field as keyof GraphNodeAttributes];
  const target = filterClause.value;

  switch (filterClause.operator) {
    case 'eq':
      return value === target;
    case 'neq':
      return value !== target;
    case 'gt':
      return toNumber(value) > toNumber(target);
    case 'gte':
      return toNumber(value) >= toNumber(target);
    case 'lt':
      return toNumber(value) < toNumber(target);
    case 'lte':
      return toNumber(value) <= toNumber(target);
    case 'in':
      return asList(target).includes(value);
    case 'between':
      return toNumber(value) >= toNumber(target) && toNumber(value) <= toNumber(filterClause.secondaryValue);
    case 'contains':
      return String(value ?? '').toLowerCase().includes(String(target ?? '').toLowerCase());
    default:
      return true;
  }
}

async function loadGraph(descriptor: DatasetDescriptor) {
  const cachedGraph = graphPromiseCache.get(descriptor.id);
  if (cachedGraph) {
    return cachedGraph;
  }

  const graphPromise = (async () => {
    const response = await fetch(descriptor.loader.localPath, {
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error(`Unable to load ${descriptor.loader.localPath}`);
    }

    const rawGraph = (await response.json()) as RawGraph;
    const graph = new UndirectedGraph<GraphNodeAttributes, GraphEdgeAttributes>();

    for (const rawNode of rawGraph.nodes ?? []) {
      graph.addNode(rawNode.id, {
        group: toNumber(rawNode.group),
        id: rawNode.id,
        label: rawNode.id,
      });
    }

    for (const rawLink of rawGraph.links ?? []) {
      const edgeId = createEdgeId(rawLink.source, rawLink.target);
      if (!graph.hasNode(rawLink.source) || !graph.hasNode(rawLink.target) || graph.hasEdge(edgeId)) {
        continue;
      }

      graph.addUndirectedEdgeWithKey(edgeId, rawLink.source, rawLink.target, {
        value: toNumber(rawLink.value),
      });
    }

    return graph;
  })();

  graphPromiseCache.set(descriptor.id, graphPromise);
  return graphPromise;
}

function buildAllowedNodeIds(
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
  query: QuerySpec,
) {
  const allowedNodeIds = new Set<string>();

  graph.forEachNode((nodeId, attributes) => {
    if (query.filters.every((filterClause) => matchesNodeFilter(attributes, filterClause))) {
      allowedNodeIds.add(nodeId);
    }
  });

  return allowedNodeIds;
}

function buildFilteredEdges(
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
  allowedNodeIds: Set<string>,
  minimumEdgeWeight: number,
) {
  const edges: GraphEdge[] = [];

  graph.forEachEdge((edgeId, attributes, source, target) => {
    if (!allowedNodeIds.has(source) || !allowedNodeIds.has(target) || attributes.value < minimumEdgeWeight) {
      return;
    }

    edges.push({
      id: edgeId,
      source,
      target,
      value: attributes.value,
    });
  });

  return edges;
}

function buildNeighborhood(
  focusNodeId: string,
  neighborDepth: 1 | 2,
  filteredEdges: GraphEdge[],
) {
  const adjacency = new Map<string, Set<string>>();

  for (const edge of filteredEdges) {
    const sourceNeighbors = adjacency.get(edge.source) ?? new Set<string>();
    sourceNeighbors.add(edge.target);
    adjacency.set(edge.source, sourceNeighbors);

    const targetNeighbors = adjacency.get(edge.target) ?? new Set<string>();
    targetNeighbors.add(edge.source);
    adjacency.set(edge.target, targetNeighbors);
  }

  const visited = new Set<string>([focusNodeId]);
  let frontier = new Set<string>([focusNodeId]);

  for (let depth = 0; depth < neighborDepth; depth += 1) {
    const nextFrontier = new Set<string>();

    for (const nodeId of frontier) {
      for (const neighborId of adjacency.get(nodeId) ?? []) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          nextFrontier.add(neighborId);
        }
      }
    }

    frontier = nextFrontier;
  }

  return visited;
}

function buildNodeMetrics(nodeIds: Set<string>, edges: GraphEdge[]) {
  const degreeByNode = new Map<string, number>();
  const weightedDegreeByNode = new Map<string, number>();

  for (const nodeId of nodeIds) {
    degreeByNode.set(nodeId, 0);
    weightedDegreeByNode.set(nodeId, 0);
  }

  for (const edge of edges) {
    degreeByNode.set(edge.source, (degreeByNode.get(edge.source) ?? 0) + 1);
    degreeByNode.set(edge.target, (degreeByNode.get(edge.target) ?? 0) + 1);
    weightedDegreeByNode.set(edge.source, (weightedDegreeByNode.get(edge.source) ?? 0) + edge.value);
    weightedDegreeByNode.set(edge.target, (weightedDegreeByNode.get(edge.target) ?? 0) + edge.value);
  }

  return {
    degreeByNode,
    weightedDegreeByNode,
  };
}

function sortGraphNodes(left: GraphNode, right: GraphNode) {
  if (left.degree !== right.degree) {
    return right.degree - left.degree;
  }

  if (left.weightedDegree !== right.weightedDegree) {
    return right.weightedDegree - left.weightedDegree;
  }

  return left.id.localeCompare(right.id);
}

export async function executeLocalGraphQuery(
  descriptor: DatasetDescriptor,
  query: QuerySpec,
): Promise<GraphQueryResult> {
  const startedAt = performance.now();
  const graph = await loadGraph(descriptor);
  const allowedNodeIds = buildAllowedNodeIds(graph, query);
  const minimumEdgeWeight = query.graph?.minEdgeWeight ?? 0;
  const filteredEdges = buildFilteredEdges(graph, allowedNodeIds, minimumEdgeWeight);
  const requestedFocusNodeId = query.graph?.focusNodeId;
  const focusNodeId =
    requestedFocusNodeId && allowedNodeIds.has(requestedFocusNodeId) ? requestedFocusNodeId : undefined;
  const includeIsolates = query.graph?.includeIsolates ?? !focusNodeId;

  let selectedNodeIds =
    focusNodeId && graph.hasNode(focusNodeId)
      ? buildNeighborhood(focusNodeId, query.graph?.neighborDepth ?? 1, filteredEdges)
      : new Set<string>(allowedNodeIds);

  if (!includeIsolates && !focusNodeId) {
    selectedNodeIds = new Set(filteredEdges.flatMap((edge) => [edge.source, edge.target]));
  }

  if (selectedNodeIds.size === 0 && allowedNodeIds.size > 0) {
    selectedNodeIds = focusNodeId ? new Set<string>([focusNodeId]) : new Set<string>(allowedNodeIds);
  }

  const edges = filteredEdges
    .filter((edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target))
    .sort((left: GraphEdge, right: GraphEdge) => right.value - left.value || left.id.localeCompare(right.id));

  const { degreeByNode, weightedDegreeByNode } = buildNodeMetrics(selectedNodeIds, edges);
  const nodes = Array.from(selectedNodeIds)
    .map((nodeId) => {
      const attributes = graph.getNodeAttributes(nodeId);
      return {
        degree: degreeByNode.get(nodeId) ?? 0,
        group: attributes.group,
        id: nodeId,
        label: attributes.label,
        weightedDegree: Number((weightedDegreeByNode.get(nodeId) ?? 0).toFixed(3)),
      } satisfies GraphNode;
    })
    .sort(sortGraphNodes);

  const averageDegree =
    nodes.length > 0
      ? Number((nodes.reduce((total: number, node: GraphNode) => total + node.degree, 0) / nodes.length).toFixed(3))
      : 0;
  const groupCount = new Set(nodes.map((node: GraphNode) => node.group)).size;

  return {
    resultKind: 'graph',
    datasetId: query.datasetId,
    durationMs: Number((performance.now() - startedAt).toFixed(3)),
    edgeCount: edges.length,
    edges,
    executionMode: 'local',
    nodeCount: nodes.length,
    nodes,
    queryKey: createQueryFingerprint(query),
    source: 'graphology-local',
    summary: {
      averageDegree,
      focusedNodeId: focusNodeId,
      groupCount,
      topNodes: nodes.slice(0, 5).map(({ degree, group, id, weightedDegree }: GraphNode) => ({
        degree,
        group,
        id,
        weightedDegree,
      })),
    },
  };
}
