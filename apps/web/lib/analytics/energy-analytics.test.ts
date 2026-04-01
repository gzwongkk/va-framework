import { describe, expect, it } from 'vitest';

import {
  filterEnergyGraph,
  normalizeEnergyGraph,
  summarizeEnergyFlow,
} from './energy-analytics';

describe('energy analytics', () => {
  it('normalizes graph rows into sankey-ready nodes and links', () => {
    const graph = normalizeEnergyGraph({
      datasetId: 'energy',
      durationMs: 2,
      edgeCount: 2,
      edges: [
        { id: 'a::b', source: 'a', target: 'b', value: 10 },
        { id: 'b::c', source: 'b', target: 'c', value: 5 },
      ],
      executionMode: 'local',
      nodeCount: 3,
      nodes: [
        { attributes: { id: 'a', in_degree: 0, name: 'Source', out_degree: 1, stage: 0 }, degree: 1, group: 0, id: 'a', label: 'Source', weightedDegree: 10 },
        { attributes: { id: 'b', in_degree: 1, name: 'Bridge', out_degree: 1, stage: 1 }, degree: 2, group: 1, id: 'b', label: 'Bridge', weightedDegree: 15 },
        { attributes: { id: 'c', in_degree: 1, name: 'Target', out_degree: 0, stage: 2 }, degree: 1, group: 2, id: 'c', label: 'Target', weightedDegree: 5 },
      ],
      queryKey: 'test',
      resultKind: 'graph',
      source: 'graphology-local',
      summary: { averageDegree: 1.33, groupCount: 3, topNodes: [] },
    });

    expect(graph?.nodes).toHaveLength(3);
    expect(graph?.links).toHaveLength(2);
    expect(graph?.links[0]?.sourceLabel).toBe('Source');
  });

  it('filters source and target stages and summarizes throughput', () => {
    const filtered = filterEnergyGraph(
      {
        links: [
          { id: 'a::b', source: 'a', sourceLabel: 'A', sourceStage: 0, target: 'b', targetLabel: 'B', targetStage: 1, value: 10 },
          { id: 'b::c', source: 'b', sourceLabel: 'B', sourceStage: 1, target: 'c', targetLabel: 'C', targetStage: 2, value: 5 },
        ],
        nodes: [
          { group: 0, id: 'a', inDegree: 0, label: 'A', outDegree: 1, stage: 0 },
          { group: 1, id: 'b', inDegree: 1, label: 'B', outDegree: 1, stage: 1 },
          { group: 2, id: 'c', inDegree: 1, label: 'C', outDegree: 0, stage: 2 },
        ],
        totalFlow: 15,
      },
      {
        sourceStages: [0],
        targetStages: [1],
      },
    );

    const summary = summarizeEnergyFlow(filtered, 'b');

    expect(filtered?.links).toHaveLength(1);
    expect(summary.totalFlow).toBe(10);
    expect(summary.activeNode?.throughput).toBe(10);
  });
});
