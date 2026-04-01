import type { GraphEdge, GraphNode, GraphQueryResult } from '@va/contracts';

import type { GraphOrdering, GraphTechnique } from '@/lib/graph-workbench';

export type MatrixCell = {
  columnIndex: number;
  rowIndex: number;
  sourceId: string;
  targetId: string;
  value: number;
  withinGroup: boolean;
};

export type OrderedGraphNode = GraphNode & {
  orderIndex: number;
};

export type AdjacencyMatrixModel = {
  cells: MatrixCell[];
  maxValue: number;
  nodes: OrderedGraphNode[];
  totalNodeCount: number;
  truncated: boolean;
  visibleNodeCount: number;
};

export type MatrixSelectionSummary = {
  crossGroupEdges: number;
  density: number;
  selectedEdgeCount: number;
  selectedNodeCount: number;
  visibleNodeCount: number;
  withinGroupEdges: number;
};

export type MatrixSelectionEdge = {
  sourceId: string;
  sourceLabel: string;
  targetId: string;
  targetLabel: string;
  value: number;
  withinGroup: boolean;
};

export type HierarchyNode = {
  attributes: GraphNode['attributes'];
  children: HierarchyNode[];
  degree: number;
  depth: number;
  group: number;
  id: string;
  label: string;
  parentId?: string;
  value: number;
  weightedDegree: number;
};

export type HierarchySummary = {
  leafCount: number;
  maxDepth: number;
  nodeCount: number;
  rootLabel: string;
};

export type HierarchyLeafPreview = {
  depth: number;
  id: string;
  label: string;
  value: number;
};

export type MultivariateMetrics = {
  betweenness: number;
  bridgeScore: number;
  closeness: number;
  community: number;
  degree: number;
  egoDepth: number;
  weightedDegree: number;
};

export type EnrichedGraphNode = GraphNode & {
  multivariate: Record<string, number | string | null>;
};

export type TechniqueHelp = {
  reference: string;
  summary: string;
  uses: string[];
};

export type MultivariateFieldOptions = {
  categorical: string[];
  numeric: string[];
};

const MAX_MATRIX_NODES = 72;

function createEdgeKey(left: string, right: string) {
  return [left, right].sort((a, b) => a.localeCompare(b)).join('::');
}

function getNodeSortValue(node: GraphNode, ordering: GraphOrdering) {
  switch (ordering) {
    case 'alphabetical':
      return node.label.toLowerCase();
    case 'degree':
      return -node.degree;
    case 'group':
      return `${String(node.group).padStart(4, '0')}::${node.label.toLowerCase()}`;
    default:
      return 0;
  }
}

export function orderGraphNodes(
  result: GraphQueryResult | undefined,
  ordering: GraphOrdering,
): OrderedGraphNode[] {
  if (!result) {
    return [];
  }

  const nodes = ordering === 'original' ? [...result.nodes] : [...result.nodes].sort((left, right) => {
      const leftValue = getNodeSortValue(left, ordering);
      const rightValue = getNodeSortValue(right, ordering);
      if (leftValue < rightValue) {
        return -1;
      }
      if (leftValue > rightValue) {
        return 1;
      }

      if (right.degree !== left.degree) {
        return right.degree - left.degree;
      }

      return left.label.localeCompare(right.label);
    });

  return nodes
    .map((node, index) => ({
      ...node,
      orderIndex: index,
    }));
}

export function buildAdjacencyMatrixModel(
  result: GraphQueryResult | undefined,
  ordering: GraphOrdering,
  maxNodes = MAX_MATRIX_NODES,
): AdjacencyMatrixModel {
  const orderedNodes = orderGraphNodes(result, ordering);
  const visibleNodes = orderedNodes.slice(0, maxNodes);
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const edgeMap = new Map<string, GraphEdge>();

  for (const edge of result?.edges ?? []) {
    if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) {
      continue;
    }

    edgeMap.set(createEdgeKey(edge.source, edge.target), edge);
  }

  const cells: MatrixCell[] = [];
  let maxValue = 0;

  visibleNodes.forEach((rowNode, rowIndex) => {
    visibleNodes.forEach((columnNode, columnIndex) => {
      const edge = edgeMap.get(createEdgeKey(rowNode.id, columnNode.id));
      const value = edge?.value ?? 0;
      maxValue = Math.max(maxValue, value);
      cells.push({
        columnIndex,
        rowIndex,
        sourceId: rowNode.id,
        targetId: columnNode.id,
        value,
        withinGroup: rowNode.group === columnNode.group,
      });
    });
  });

  return {
    cells,
    maxValue,
    nodes: visibleNodes,
    totalNodeCount: orderedNodes.length,
    truncated: orderedNodes.length > visibleNodes.length,
    visibleNodeCount: visibleNodes.length,
  };
}

export function summarizeMatrixSelection(
  matrix: AdjacencyMatrixModel,
  selectedIds: string[],
): MatrixSelectionSummary {
  const selected = new Set(selectedIds);
  const selectedNodes = matrix.nodes.filter((node) => selected.has(node.id));
  const selectedNodeCount = selectedNodes.length;

  if (selectedNodeCount === 0) {
    return {
      crossGroupEdges: 0,
      density: 0,
      selectedEdgeCount: 0,
      selectedNodeCount: 0,
      visibleNodeCount: matrix.visibleNodeCount,
      withinGroupEdges: 0,
    };
  }

  let selectedEdgeCount = 0;
  let withinGroupEdges = 0;
  let crossGroupEdges = 0;

  for (const cell of matrix.cells) {
    if (cell.rowIndex >= cell.columnIndex) {
      continue;
    }
    if (!selected.has(cell.sourceId) || !selected.has(cell.targetId) || cell.value <= 0) {
      continue;
    }

    selectedEdgeCount += 1;
    if (cell.withinGroup) {
      withinGroupEdges += 1;
    } else {
      crossGroupEdges += 1;
    }
  }

  const possibleEdges = selectedNodeCount > 1 ? (selectedNodeCount * (selectedNodeCount - 1)) / 2 : 0;
  return {
    crossGroupEdges,
    density: possibleEdges > 0 ? Number((selectedEdgeCount / possibleEdges).toFixed(3)) : 0,
    selectedEdgeCount,
    selectedNodeCount,
    visibleNodeCount: matrix.visibleNodeCount,
    withinGroupEdges,
  };
}

export function getMatrixSelectionEdges(
  matrix: AdjacencyMatrixModel,
  selectedIds: string[],
  limit = 6,
): MatrixSelectionEdge[] {
  const selected = new Set(selectedIds);
  const nodeById = new Map(matrix.nodes.map((node) => [node.id, node]));

  return matrix.cells
    .filter(
      (cell) =>
        cell.rowIndex < cell.columnIndex &&
        cell.value > 0 &&
        selected.has(cell.sourceId) &&
        selected.has(cell.targetId),
    )
    .map((cell) => ({
      sourceId: cell.sourceId,
      sourceLabel: nodeById.get(cell.sourceId)?.label ?? cell.sourceId,
      targetId: cell.targetId,
      targetLabel: nodeById.get(cell.targetId)?.label ?? cell.targetId,
      value: cell.value,
      withinGroup: cell.withinGroup,
    }))
    .sort((left, right) => right.value - left.value || left.sourceLabel.localeCompare(right.sourceLabel))
    .slice(0, limit);
}

export function buildHierarchyTree(result: GraphQueryResult | undefined): HierarchyNode | undefined {
  if (!result || result.nodes.length === 0) {
    return undefined;
  }

  const childrenByParent = new Map<string, HierarchyNode[]>();
  const nodeMap = new Map<string, HierarchyNode>();

  for (const node of result.nodes) {
    nodeMap.set(node.id, {
      attributes: node.attributes,
      children: [],
      degree: node.degree,
      depth: node.depth ?? 0,
      group: node.group,
      id: node.id,
      label: node.label,
      parentId: node.parentId,
      value: Number(node.attributes.size ?? node.weightedDegree ?? 1),
      weightedDegree: node.weightedDegree,
    });
  }

  for (const node of nodeMap.values()) {
    if (!node.parentId || !nodeMap.has(node.parentId)) {
      continue;
    }
    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  for (const node of nodeMap.values()) {
    node.children = childrenByParent.get(node.id) ?? [];
  }

  const roots = [...nodeMap.values()].filter((node) => !node.parentId || !nodeMap.has(node.parentId));
  if (roots.length === 1) {
    return roots[0];
  }

  return {
    attributes: {},
    children: roots,
    degree: 0,
    depth: 0,
    group: 0,
    id: 'synthetic-root',
    label: 'Root',
    value: roots.reduce((total, root) => total + root.value, 0),
    weightedDegree: 0,
  };
}

export function summarizeHierarchyTree(root: HierarchyNode | undefined): HierarchySummary {
  if (!root) {
    return {
      leafCount: 0,
      maxDepth: 0,
      nodeCount: 0,
      rootLabel: 'None',
    };
  }

  let nodeCount = 0;
  let leafCount = 0;
  let maxDepth = 0;
  const queue = [root];

  while (queue.length > 0) {
    const current = queue.shift()!;
    nodeCount += 1;
    maxDepth = Math.max(maxDepth, current.depth);
    if (current.children.length === 0) {
      leafCount += 1;
    }
    queue.push(...current.children);
  }

  return {
    leafCount,
    maxDepth,
    nodeCount,
    rootLabel: root.label,
  };
}

export function getHierarchyPath(
  root: HierarchyNode | undefined,
  targetId?: string,
): HierarchyNode[] {
  if (!root || !targetId) {
    return [];
  }

  const path: HierarchyNode[] = [];

  function visit(node: HierarchyNode): boolean {
    path.push(node);
    if (node.id === targetId) {
      return true;
    }

    for (const child of node.children) {
      if (visit(child)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  return visit(root) ? path : [];
}

export function getHierarchyLeafPreview(
  root: HierarchyNode | undefined,
  limit = 6,
): HierarchyLeafPreview[] {
  if (!root) {
    return [];
  }

  const leaves: HierarchyLeafPreview[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.children.length === 0) {
      leaves.push({
        depth: node.depth,
        id: node.id,
        label: node.label,
        value: node.value,
      });
      continue;
    }

    stack.push(...node.children);
  }

  return leaves
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function buildAdjacency(result: GraphQueryResult) {
  const adjacency = new Map<string, Set<string>>();
  const weightedAdjacency = new Map<string, number>();

  for (const node of result.nodes) {
    adjacency.set(node.id, new Set());
    weightedAdjacency.set(node.id, 0);
  }

  for (const edge of result.edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
    weightedAdjacency.set(edge.source, (weightedAdjacency.get(edge.source) ?? 0) + edge.value);
    weightedAdjacency.set(edge.target, (weightedAdjacency.get(edge.target) ?? 0) + edge.value);
  }

  return {
    adjacency,
    weightedAdjacency,
  };
}

function computeCloseness(adjacency: Map<string, Set<string>>, sourceId: string) {
  const visited = new Set<string>([sourceId]);
  const queue: Array<{ depth: number; nodeId: string }> = [{ depth: 0, nodeId: sourceId }];
  let totalDistance = 0;
  let reachable = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighborId of adjacency.get(current.nodeId) ?? []) {
      if (visited.has(neighborId)) {
        continue;
      }

      visited.add(neighborId);
      const depth = current.depth + 1;
      totalDistance += depth;
      reachable += 1;
      queue.push({ depth, nodeId: neighborId });
    }
  }

  return reachable > 0 && totalDistance > 0 ? Number((reachable / totalDistance).toFixed(3)) : 0;
}

function computeEgoDepths(adjacency: Map<string, Set<string>>, anchorId: string) {
  const distances = new Map<string, number>([[anchorId, 0]]);
  const queue = [anchorId];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const currentDepth = distances.get(nodeId) ?? 0;
    for (const neighborId of adjacency.get(nodeId) ?? []) {
      if (distances.has(neighborId)) {
        continue;
      }
      distances.set(neighborId, currentDepth + 1);
      queue.push(neighborId);
    }
  }

  return distances;
}

function computeBetweenness(adjacency: Map<string, Set<string>>) {
  const nodeIds = [...adjacency.keys()];
  const betweenness = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));

  for (const source of nodeIds) {
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>(nodeIds.map((nodeId) => [nodeId, []]));
    const sigma = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
    const distance = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, -1]));

    sigma.set(source, 1);
    distance.set(source, 0);

    const queue = [source];
    while (queue.length > 0) {
      const vertex = queue.shift()!;
      stack.push(vertex);
      for (const neighbor of adjacency.get(vertex) ?? []) {
        if ((distance.get(neighbor) ?? -1) < 0) {
          queue.push(neighbor);
          distance.set(neighbor, (distance.get(vertex) ?? 0) + 1);
        }

        if ((distance.get(neighbor) ?? 0) === (distance.get(vertex) ?? 0) + 1) {
          sigma.set(neighbor, (sigma.get(neighbor) ?? 0) + (sigma.get(vertex) ?? 0));
          predecessors.get(neighbor)?.push(vertex);
        }
      }
    }

    const delta = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
    while (stack.length > 0) {
      const vertex = stack.pop()!;
      for (const predecessor of predecessors.get(vertex) ?? []) {
        const sigmaVertex = sigma.get(vertex) ?? 1;
        const contribution =
          ((sigma.get(predecessor) ?? 0) / sigmaVertex) * (1 + (delta.get(vertex) ?? 0));
        delta.set(predecessor, (delta.get(predecessor) ?? 0) + contribution);
      }
      if (vertex !== source) {
        betweenness.set(vertex, (betweenness.get(vertex) ?? 0) + (delta.get(vertex) ?? 0));
      }
    }
  }

  const normalizer = nodeIds.length > 2 ? 1 / ((nodeIds.length - 1) * (nodeIds.length - 2)) : 1;
  for (const nodeId of nodeIds) {
    betweenness.set(nodeId, Number(((betweenness.get(nodeId) ?? 0) * normalizer).toFixed(3)));
  }

  return betweenness;
}

export function deriveMultivariateNodes(
  result: GraphQueryResult | undefined,
  focusNodeId?: string,
): EnrichedGraphNode[] {
  if (!result) {
    return [];
  }

  const { adjacency, weightedAdjacency } = buildAdjacency(result);
  const anchorId = focusNodeId ?? result.summary.focusedNodeId ?? result.summary.topNodes[0]?.id ?? result.nodes[0]?.id;
  const egoDepths = anchorId ? computeEgoDepths(adjacency, anchorId) : new Map<string, number>();
  const betweenness = computeBetweenness(adjacency);
  const nodeById = new Map(result.nodes.map((node) => [node.id, node]));
  const incidentEdgesByNode = new Map<string, GraphEdge[]>();

  for (const node of result.nodes) {
    incidentEdgesByNode.set(node.id, []);
  }

  for (const edge of result.edges) {
    incidentEdgesByNode.get(edge.source)?.push(edge);
    incidentEdgesByNode.get(edge.target)?.push(edge);
  }

  return result.nodes.map((node) => {
    const crossGroupEdges = (incidentEdgesByNode.get(node.id) ?? []).filter((edge) => {
      const otherId = edge.source === node.id ? edge.target : edge.source;
      const otherNode = nodeById.get(otherId);
      return otherNode ? otherNode.group !== node.group : false;
    }).length;
    const bridgeScore = node.degree > 0 ? Number((crossGroupEdges / node.degree).toFixed(3)) : 0;
    const closeness = computeCloseness(adjacency, node.id);
    const metrics: MultivariateMetrics = {
      betweenness: betweenness.get(node.id) ?? 0,
      bridgeScore,
      closeness,
      community: node.group,
      degree: node.degree,
      egoDepth: egoDepths.get(node.id) ?? -1,
      weightedDegree: Number((weightedAdjacency.get(node.id) ?? node.weightedDegree).toFixed(3)),
    };

    return {
      ...node,
      multivariate: {
        ...node.attributes,
        betweenness: metrics.betweenness,
        bridgeScore: metrics.bridgeScore,
        closeness: metrics.closeness,
        community: metrics.community,
        degree: metrics.degree,
        egoDepth: metrics.egoDepth,
        weightedDegree: metrics.weightedDegree,
      },
    };
  });
}

export function getMultivariateFieldOptions(nodes: EnrichedGraphNode[]): MultivariateFieldOptions {
  const numeric = new Set<string>();
  const categorical = new Set<string>();
  const categoricalNumericFields = new Set(['community', 'group', 'egoDepth']);

  for (const node of nodes) {
    for (const [field, value] of Object.entries(node.multivariate)) {
      if (typeof value === 'number') {
        numeric.add(field);
        if (categoricalNumericFields.has(field)) {
          categorical.add(field);
        }
      } else if (typeof value === 'string') {
        categorical.add(field);
      }
    }
  }

  return {
    categorical: [...categorical].sort((left, right) => left.localeCompare(right)),
    numeric: [...numeric].sort((left, right) => left.localeCompare(right)),
  };
}

export function getMultivariateValue(
  node: EnrichedGraphNode,
  field: string,
): number | string | null {
  return node.multivariate[field] ?? null;
}

export function getTechniqueHelp(technique: GraphTechnique): TechniqueHelp {
  switch (technique) {
    case 'matrix':
      return {
        reference: 'Adjacency Matrix Brush',
        summary: 'Use matrix brushing when link density and cluster blocks matter more than path tracing.',
        uses: [
          'Compare within-group and cross-group connectivity patterns.',
          'Brush dense blocks to select multiple actors at once.',
          'Apply deterministic orderings to reveal latent structure.',
        ],
      };
    case 'tree':
      return {
        reference: 'treevis taxonomy',
        summary: 'Use tree techniques when parent-child containment and hierarchical depth are the dominant analytical task.',
        uses: [
          'Switch between explicit node-link and implicit partition-based views.',
          'Use axis-parallel layouts for readable labels and radial layouts for compact overviews.',
          'Stay on flare for hierarchy work in the v2.3 line.',
        ],
      };
    case 'multivariate':
      return {
        reference: 'MVNV',
        summary: 'Use multivariate network views when topology alone is insufficient and node or edge attributes must drive analysis.',
        uses: [
          'Encode size, color, and width by graph metrics or attributes.',
          'Switch to attribute positioning to compare nodes along analytical axes.',
          'Facet the network to compare communities without entering a general multi-view mode.',
        ],
      };
    default:
      return {
        reference: 'Graph workbench',
        summary: 'Use the force technique for direct topology inspection, neighborhood tracing, and live interaction.',
        uses: [
          'Inspect weighted links and local neighborhoods.',
          'Use force layout as the baseline before switching to another technique.',
          'Keep selection and scope state stable across technique changes.',
        ],
      };
  }
}
