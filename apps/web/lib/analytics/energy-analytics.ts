import {
  isGraphQueryResult,
  type ExecutionMode,
  type QueryResult,
  type QuerySpec,
} from '@va/contracts';

export const ENERGY_DATASET_ID = 'energy';

export type EnergyNode = {
  group: number;
  id: string;
  inDegree: number;
  label: string;
  outDegree: number;
  stage: number;
};

export type EnergyLink = {
  id: string;
  source: string;
  sourceLabel: string;
  sourceStage: number;
  target: string;
  targetLabel: string;
  targetStage: number;
  value: number;
};

export type EnergyFlowGraph = {
  links: EnergyLink[];
  nodes: EnergyNode[];
  totalFlow: number;
};

export type EnergyStageSummary = {
  inflow: number;
  nodeCount: number;
  outflow: number;
  stage: number;
};

export type EnergyFlowSummary = {
  activeNode?: {
    id: string;
    inflow: number;
    label: string;
    outflow: number;
    stage: number;
    throughput: number;
  };
  linkCount: number;
  stageSummaries: EnergyStageSummary[];
  totalFlow: number;
  visibleNodeCount: number;
};

const STAGE_LABELS: Record<number, string> = {
  0: 'Sources',
  1: 'Supply',
  2: 'Conversion',
  3: 'Distribution',
  4: 'Infrastructure',
  5: 'Use',
  6: 'Losses',
  7: 'Demand',
};

function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

export function getEnergyStageLabel(stage: number) {
  return STAGE_LABELS[stage] ?? `Stage ${stage}`;
}

export function buildEnergyQuery({
  executionMode,
  minFlowValue,
}: {
  executionMode: ExecutionMode;
  minFlowValue: number;
}): QuerySpec {
  return {
    aggregates: [],
    datasetId: ENERGY_DATASET_ID,
    entity: 'nodes',
    executionMode,
    filters: [],
    graph: {
      includeIsolates: true,
      minEdgeWeight: minFlowValue,
      neighborDepth: 1,
    },
    groupBy: [],
    select: [],
    sorts: [],
  };
}

export function normalizeEnergyGraph(
  result: QueryResult | undefined,
): EnergyFlowGraph | undefined {
  if (!isGraphQueryResult(result)) {
    return undefined;
  }

  const nodeById = new Map(
    result.nodes.map((node) => {
      const stage = toNumber(node.attributes.stage ?? node.group);
      return [
        node.id,
        {
          group: node.group,
          id: node.id,
          inDegree: toNumber(node.attributes.in_degree),
          label: String(node.attributes.name ?? node.label),
          outDegree: toNumber(node.attributes.out_degree),
          stage,
        } satisfies EnergyNode,
      ] as const;
    }),
  );

  const links = result.edges
    .map((edge) => {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) {
        return undefined;
      }

      return {
        id: edge.id,
        source: edge.source,
        sourceLabel: source.label,
        sourceStage: source.stage,
        target: edge.target,
        targetLabel: target.label,
        targetStage: target.stage,
        value: edge.value,
      } satisfies EnergyLink;
    })
    .filter((link): link is EnergyLink => Boolean(link))
    .sort(
      (left, right) =>
        left.sourceStage - right.sourceStage ||
        left.targetStage - right.targetStage ||
        right.value - left.value ||
        left.id.localeCompare(right.id),
    );

  return {
    links,
    nodes: [...nodeById.values()].sort(
      (left, right) =>
        left.stage - right.stage || left.label.localeCompare(right.label),
    ),
    totalFlow: Number(
      links.reduce((total, link) => total + link.value, 0).toFixed(3),
    ),
  };
}

export function getEnergyStageOptions(graph: EnergyFlowGraph | undefined) {
  if (!graph) {
    return [];
  }

  return Array.from(new Set(graph.nodes.map((node) => node.stage))).sort(
    (left, right) => left - right,
  );
}

export function getEnergyLegend(graph: EnergyFlowGraph | undefined) {
  return getEnergyStageOptions(graph).map((stage) => ({
    color: getEnergyStageColor(stage),
    label: getEnergyStageLabel(stage),
  }));
}

export function getEnergyStageColor(stage: number) {
  const palette = [
    '#315f7d',
    '#2b8cbe',
    '#4bb48a',
    '#7a9e43',
    '#d7a349',
    '#db7b4d',
    '#b45d76',
    '#6b6ecf',
  ];
  const index = Math.max(0, Math.round(stage)) % palette.length;
  return palette[index] ?? palette[0];
}

export function filterEnergyGraph(
  graph: EnergyFlowGraph | undefined,
  {
    sourceStages,
    targetStages,
  }: {
    sourceStages: number[];
    targetStages: number[];
  },
): EnergyFlowGraph | undefined {
  if (!graph) {
    return undefined;
  }

  const sourceStageSet = new Set(sourceStages);
  const targetStageSet = new Set(targetStages);
  const links = graph.links.filter((link) => {
    const sourceMatches =
      sourceStageSet.size === 0 || sourceStageSet.has(link.sourceStage);
    const targetMatches =
      targetStageSet.size === 0 || targetStageSet.has(link.targetStage);
    return sourceMatches && targetMatches;
  });
  const visibleNodeIds = new Set(
    links.flatMap((link) => [link.source, link.target]),
  );
  const nodes = graph.nodes.filter((node) => visibleNodeIds.has(node.id));

  return {
    links,
    nodes,
    totalFlow: Number(
      links.reduce((total, link) => total + link.value, 0).toFixed(3),
    ),
  };
}

export function summarizeEnergyFlow(
  graph: EnergyFlowGraph | undefined,
  selectedNodeId?: string,
): EnergyFlowSummary {
  if (!graph) {
    return {
      linkCount: 0,
      stageSummaries: [],
      totalFlow: 0,
      visibleNodeCount: 0,
    };
  }

  const stageMap = new Map<number, EnergyStageSummary>();
  const incomingByNode = new Map<string, number>();
  const outgoingByNode = new Map<string, number>();

  for (const node of graph.nodes) {
    stageMap.set(node.stage, {
      inflow: 0,
      nodeCount: (stageMap.get(node.stage)?.nodeCount ?? 0) + 1,
      outflow: 0,
      stage: node.stage,
    });
  }

  for (const link of graph.links) {
    const sourceStageSummary = stageMap.get(link.sourceStage);
    if (sourceStageSummary) {
      sourceStageSummary.outflow = Number(
        (sourceStageSummary.outflow + link.value).toFixed(3),
      );
    }

    const targetStageSummary = stageMap.get(link.targetStage);
    if (targetStageSummary) {
      targetStageSummary.inflow = Number(
        (targetStageSummary.inflow + link.value).toFixed(3),
      );
    }

    incomingByNode.set(
      link.target,
      Number(((incomingByNode.get(link.target) ?? 0) + link.value).toFixed(3)),
    );
    outgoingByNode.set(
      link.source,
      Number(((outgoingByNode.get(link.source) ?? 0) + link.value).toFixed(3)),
    );
  }

  const activeNode = selectedNodeId
    ? graph.nodes.find((node) => node.id === selectedNodeId)
    : undefined;

  return {
    activeNode: activeNode
      ? {
          id: activeNode.id,
          inflow: incomingByNode.get(activeNode.id) ?? 0,
          label: activeNode.label,
          outflow: outgoingByNode.get(activeNode.id) ?? 0,
          stage: activeNode.stage,
          throughput: Number(
            (
              (incomingByNode.get(activeNode.id) ?? 0) +
              (outgoingByNode.get(activeNode.id) ?? 0)
            ).toFixed(3),
          ),
        }
      : undefined,
    linkCount: graph.links.length,
    stageSummaries: [...stageMap.values()].sort(
      (left, right) => left.stage - right.stage,
    ),
    totalFlow: graph.totalFlow,
    visibleNodeCount: graph.nodes.length,
  };
}

export function getTopEnergyLinks(
  graph: EnergyFlowGraph | undefined,
  limit = 8,
) {
  if (!graph) {
    return [];
  }

  return [...graph.links]
    .sort(
      (left, right) => right.value - left.value || left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}

export function getEnergyNodeConnections(
  graph: EnergyFlowGraph | undefined,
  nodeId?: string,
  limit = 8,
) {
  if (!graph || !nodeId) {
    return [];
  }

  return graph.links
    .filter((link) => link.source === nodeId || link.target === nodeId)
    .sort(
      (left, right) => right.value - left.value || left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}

export function getEnergyDatasetSummary(result: QueryResult | undefined) {
  const graph = normalizeEnergyGraph(result);
  return summarizeEnergyFlow(graph);
}
