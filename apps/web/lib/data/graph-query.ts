'use client';

import { UndirectedGraph } from 'graphology';
import type Graph from 'graphology';
import {
  createQueryFingerprint,
  type DatasetDescriptor,
  type FilterClause,
  type GraphEdge,
  type GraphNode,
  type GraphQueryResult,
  type QueryScalar,
  type QuerySpec,
} from '@va/contracts';

type GraphNodeAttributes = {
  attributes: Record<string, QueryScalar>;
  depth?: number;
  group: number;
  id: string;
  label: string;
  parentId?: string;
} & Record<string, QueryScalar | Record<string, QueryScalar> | undefined>;

type GraphEdgeAttributes = {
  value: number;
};

type RawGraphObject = {
  links?: Array<Record<string, unknown>>;
  nodes?: Array<Record<string, unknown>>;
};

type NormalizedEdgeRecord = {
  id: string;
  source: string;
  target: string;
  value: number;
};

type NormalizedGraphSource = {
  edges: NormalizedEdgeRecord[];
  nodes: GraphNodeAttributes[];
};

const graphPromiseCache = new Map<string, Promise<UndirectedGraph<GraphNodeAttributes, GraphEdgeAttributes>>>();

function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function toGraphScalar(value: unknown): QueryScalar {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return value;
  }

  return value === undefined ? null : String(value);
}

function asList(value: unknown) {
  return Array.isArray(value) ? value : [value];
}

function createEdgeId(source: string, target: string) {
  return [source, target].sort((left, right) => left.localeCompare(right)).join('::');
}

function isRawGraphObject(value: unknown): value is RawGraphObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function computeHierarchyDepths(rows: Array<Record<string, unknown>>) {
  const parentById = new Map<string, string>();
  const knownNodeIds = new Set<string>();
  const depthById = new Map<string, number>();

  for (const row of rows) {
    const rawId = row.id;
    if (rawId === undefined || rawId === null) {
      continue;
    }

    const nodeId = String(rawId);
    knownNodeIds.add(nodeId);

    if (row.parent !== undefined && row.parent !== null) {
      parentById.set(nodeId, String(row.parent));
    }
  }

  const resolveDepth = (nodeId: string): number => {
    const knownDepth = depthById.get(nodeId);
    if (knownDepth !== undefined) {
      return knownDepth;
    }

    const parentId = parentById.get(nodeId);
    if (!parentId || parentId === nodeId || !knownNodeIds.has(parentId)) {
      depthById.set(nodeId, 0);
      return 0;
    }

    const depth = resolveDepth(parentId) + 1;
    depthById.set(nodeId, depth);
    return depth;
  };

  for (const nodeId of knownNodeIds) {
    resolveDepth(nodeId);
  }

  return depthById;
}

function normalizeGraphNode(
  rawNode: Record<string, unknown>,
  depthById?: Map<string, number>,
  fallbackId?: number,
): GraphNodeAttributes | undefined {
  const rawId = rawNode.id ?? rawNode.name ?? rawNode.index ?? fallbackId;
  if (rawId === undefined || rawId === null) {
    return undefined;
  }

  const id = String(rawId);
  const parentId =
    rawNode.parent !== undefined && rawNode.parent !== null ? String(rawNode.parent) : undefined;
  const depth =
    rawNode.depth !== undefined && rawNode.depth !== null
      ? toNumber(rawNode.depth)
      : depthById?.get(id);
  const groupSource = rawNode.group ?? depth ?? 0;
  const group = toNumber(groupSource);
  const label = String(rawNode.name ?? rawNode.label ?? rawNode.id ?? rawNode.index ?? id);
  const scalarAttributes = Object.fromEntries(
    Object.entries(rawNode).map(([key, value]) => [key, toGraphScalar(value)]),
  ) satisfies Record<string, QueryScalar>;

  scalarAttributes.id = id;
  scalarAttributes.group = group;
  scalarAttributes.depth = depth ?? 0;
  if (!('parent' in scalarAttributes)) {
    scalarAttributes.parent = parentId ?? null;
  }

  return {
    ...scalarAttributes,
    attributes: scalarAttributes,
    depth,
    group,
    id,
    label,
    parentId,
  };
}

function buildNodeReferenceLookup(nodes: GraphNodeAttributes[]) {
  const lookup = new Map<string, string>();

  for (const node of nodes) {
    lookup.set(node.id, node.id);

    const name = node.attributes.name;
    if (name !== undefined && name !== null) {
      lookup.set(String(name), node.id);
    }

    const index = node.attributes.index;
    if (index !== undefined && index !== null) {
      lookup.set(String(index), node.id);
    }
  }

  return lookup;
}

function normalizeHierarchyRows(rows: Array<Record<string, unknown>>): NormalizedGraphSource {
  const depthById = computeHierarchyDepths(rows);
  const nodes = rows
    .map((row) => normalizeGraphNode(row, depthById))
    .filter((node): node is GraphNodeAttributes => Boolean(node));
  const edges = rows
    .flatMap((row) => {
      if (row.id === undefined || row.id === null || row.parent === undefined || row.parent === null) {
        return [];
      }

      const source = String(row.parent);
      const target = String(row.id);
      return [
        {
          id: createEdgeId(source, target),
          source,
          target,
          value: 1,
        },
      ] satisfies NormalizedEdgeRecord[];
    });

  return {
    edges,
    nodes,
  };
}

function normalizeGraphObject(rawGraph: RawGraphObject): NormalizedGraphSource {
  const nodes = (rawGraph.nodes ?? [])
    .map((row, index) => normalizeGraphNode(row, undefined, index))
    .filter((node): node is GraphNodeAttributes => Boolean(node));
  const nodeReferenceLookup = buildNodeReferenceLookup(nodes);
  const edges = (rawGraph.links ?? []).flatMap((rawLink) => {
    const source = rawLink.source;
    const target = rawLink.target;
    if (source === undefined || source === null || target === undefined || target === null) {
      return [];
    }

    const normalizedSource = nodeReferenceLookup.get(String(source)) ?? String(source);
    const normalizedTarget = nodeReferenceLookup.get(String(target)) ?? String(target);

    return [
      {
        id: createEdgeId(normalizedSource, normalizedTarget),
        source: normalizedSource,
        target: normalizedTarget,
        value: toNumber(rawLink.value),
      },
    ] satisfies NormalizedEdgeRecord[];
  });

  return {
    edges,
    nodes,
  };
}

function normalizeGraphSource(rawGraph: unknown): NormalizedGraphSource {
  if (Array.isArray(rawGraph)) {
    return normalizeHierarchyRows(rawGraph as Array<Record<string, unknown>>);
  }

  if (isRawGraphObject(rawGraph)) {
    return normalizeGraphObject(rawGraph);
  }

  return {
    edges: [],
    nodes: [],
  };
}

function matchesNodeFilter(attributes: GraphNodeAttributes, filterClause: FilterClause) {
  const value = attributes[filterClause.field];
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

    const rawGraph = await response.json();
    const normalizedGraph = normalizeGraphSource(rawGraph);
    const graph = new UndirectedGraph<GraphNodeAttributes, GraphEdgeAttributes>();

    for (const normalizedNode of normalizedGraph.nodes) {
      graph.addNode(normalizedNode.id, normalizedNode);
    }

    for (const edge of normalizedGraph.edges) {
      if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target) || graph.hasEdge(edge.id)) {
        continue;
      }

      graph.addUndirectedEdgeWithKey(edge.id, edge.source, edge.target, {
        value: edge.value,
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
        attributes: attributes.attributes,
        degree: degreeByNode.get(nodeId) ?? 0,
        depth: attributes.depth,
        group: attributes.group,
        id: nodeId,
        label: attributes.label,
        parentId: attributes.parentId,
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
