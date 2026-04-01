import {
  isGraphQueryResult,
  type ExecutionMode,
  type GraphNode,
  type GraphQueryResult,
  type QueryResult,
  type QuerySpec,
} from '@va/contracts';
import type { ForceGraphEdgeDatum, ForceGraphNodeDatum } from '@va/vis-core';

export type GraphViewControls = {
  executionMode: ExecutionMode;
  minEdgeWeight: number;
  neighborDepth: 1 | 2;
  scopeMode: GraphScopeMode;
  searchTerm?: string;
  selectedGroups: number[];
  selectedNodeId?: string;
};

export type GraphScopeMode = 'focused-neighborhood' | 'full-graph';

export type GraphWorkspaceSummary = {
  averageDegree: number;
  edgeCount: number;
  focusedNodeLabel: string;
  groupCount: number;
  nodeCount: number;
  strongestLinkWeight: number;
};

export const GRAPH_DATASET_ID = 'miserables';
export const GRAPH_GROUP_OPTIONS = [1, 2, 3, 4] as const;
export const DEFAULT_GRAPH_CONTROLS: GraphViewControls = {
  executionMode: 'local',
  minEdgeWeight: 0,
  neighborDepth: 1,
  scopeMode: 'full-graph',
  searchTerm: '',
  selectedGroups: [],
};

export const GRAPH_GROUP_PALETTE: Record<number, string> = {
  1: '#2f607d',
  2: '#2aa876',
  3: '#d97745',
  4: '#7b6bb7',
};

function clampNodeRadius(degree: number) {
  return Math.max(8, Math.min(18, 8 + degree * 1.65));
}

export function buildGraphQuery(controls: GraphViewControls): QuerySpec {
  const focusNodeId =
    controls.scopeMode === 'focused-neighborhood' ? controls.selectedNodeId : undefined;

  return {
    datasetId: GRAPH_DATASET_ID,
    entity: 'nodes',
    executionMode: controls.executionMode,
    filters:
      controls.selectedGroups.length > 0
        ? [
            {
              field: 'group',
              operator: 'in',
              value: controls.selectedGroups,
            },
          ]
        : [],
    sorts: [],
    select: [],
    groupBy: [],
    aggregates: [],
    graph: {
      focusNodeId,
      includeIsolates: !focusNodeId,
      minEdgeWeight: controls.minEdgeWeight,
      neighborDepth: controls.neighborDepth,
    },
  };
}

export function normalizeGraphResult(result: QueryResult | undefined): GraphQueryResult | undefined {
  return isGraphQueryResult(result) ? result : undefined;
}

export function toForceGraphData(
  result: GraphQueryResult | undefined,
  selectedId?: string,
): {
  edges: ForceGraphEdgeDatum[];
  nodes: ForceGraphNodeDatum[];
} {
  if (!result) {
    return {
      edges: [],
      nodes: [],
    };
  }

  return {
    edges: result.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      value: edge.value,
    })),
    nodes: result.nodes.map((node) => ({
      color: GRAPH_GROUP_PALETTE[node.group] ?? '#526172',
      degree: node.degree,
      group: node.group,
      id: node.id,
      label: node.label,
      radius: clampNodeRadius(node.degree),
      selected: node.id === selectedId,
      weightedDegree: node.weightedDegree,
    })),
  };
}

export function summarizeGraphResult(result: GraphQueryResult | undefined): GraphWorkspaceSummary {
  if (!result) {
    return {
      averageDegree: 0,
      edgeCount: 0,
      focusedNodeLabel: 'None',
      groupCount: 0,
      nodeCount: 0,
      strongestLinkWeight: 0,
    };
  }

  const focusedNode = result.summary.focusedNodeId
    ? result.nodes.find((node) => node.id === result.summary.focusedNodeId)
    : undefined;

  return {
    averageDegree: result.summary.averageDegree,
    edgeCount: result.edgeCount,
    focusedNodeLabel: focusedNode?.label ?? 'All nodes',
    groupCount: result.summary.groupCount,
    nodeCount: result.nodeCount,
    strongestLinkWeight: result.edges[0]?.value ?? 0,
  };
}

export function findSelectedGraphNode(
  result: GraphQueryResult | undefined,
  selectedId?: string,
): GraphNode | undefined {
  if (!result) {
    return undefined;
  }

  const focusId = selectedId ?? result.summary.focusedNodeId;
  return focusId ? result.nodes.find((node) => node.id === focusId) : undefined;
}

export function getNodeNeighbors(
  result: GraphQueryResult | undefined,
  selectedId?: string,
): Array<GraphNode & { connectionWeight: number }> {
  const selectedNode = findSelectedGraphNode(result, selectedId);
  if (!result || !selectedNode) {
    return [];
  }

  const nodeById = new Map(result.nodes.map((node) => [node.id, node]));

  return result.edges
    .flatMap((edge) => {
      if (edge.source === selectedNode.id) {
        return [{ connectionWeight: edge.value, nodeId: edge.target }];
      }

      if (edge.target === selectedNode.id) {
        return [{ connectionWeight: edge.value, nodeId: edge.source }];
      }

      return [];
    })
    .map(({ connectionWeight, nodeId }) => {
      const neighbor = nodeById.get(nodeId);
      if (!neighbor) {
        return undefined;
      }

      return {
        ...neighbor,
        connectionWeight,
      };
    })
    .filter((neighbor): neighbor is GraphNode & { connectionWeight: number } => Boolean(neighbor))
    .sort(
      (
        left: GraphNode & { connectionWeight: number },
        right: GraphNode & { connectionWeight: number },
      ) =>
        right.connectionWeight - left.connectionWeight ||
        right.degree - left.degree ||
        left.id.localeCompare(right.id),
    );
}

export function getTopGraphNodes(result: GraphQueryResult | undefined) {
  return result?.summary.topNodes ?? [];
}

export function getNodeSearchMatches(
  result: GraphQueryResult | undefined,
  searchTerm: string,
): GraphNode[] {
  if (!result) {
    return [];
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  if (!normalizedSearchTerm) {
    return result.nodes.slice(0, 6);
  }

  return result.nodes
    .filter((node) => node.label.toLowerCase().includes(normalizedSearchTerm))
    .slice(0, 8);
}
