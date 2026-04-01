import { describe, expect, it } from 'vitest';
import type { GraphQueryResult } from '@va/contracts';

import {
  buildGraphQuery,
  DEFAULT_GRAPH_CONTROLS,
  getGraphGroupOptions,
  getNodeNeighbors,
  getGraphGroupColor,
  normalizeGraphResult,
  summarizeGraphResult,
  toForceGraphData,
} from './graph-analytics';

const sampleGraphResult: GraphQueryResult = {
  datasetId: 'miserables',
  durationMs: 7.2,
  edgeCount: 3,
  edges: [
    { id: 'Cosette::Valjean', source: 'Valjean', target: 'Cosette', value: 7 },
    { id: 'Javert::Valjean', source: 'Valjean', target: 'Javert', value: 6 },
    { id: 'Cosette::Marius', source: 'Cosette', target: 'Marius', value: 5 },
  ],
  executionMode: 'local',
  nodeCount: 4,
  nodes: [
    { attributes: { group: 1, id: 'Valjean' }, degree: 2, group: 1, id: 'Valjean', label: 'Valjean', weightedDegree: 13 },
    { attributes: { group: 2, id: 'Cosette' }, degree: 2, group: 2, id: 'Cosette', label: 'Cosette', weightedDegree: 12 },
    { attributes: { group: 1, id: 'Javert' }, degree: 1, group: 1, id: 'Javert', label: 'Javert', weightedDegree: 6 },
    { attributes: { group: 3, id: 'Marius' }, degree: 1, group: 3, id: 'Marius', label: 'Marius', weightedDegree: 5 },
  ],
  queryKey: 'graph-sample',
  resultKind: 'graph',
  source: 'graphology-local',
  summary: {
    averageDegree: 1.5,
    focusedNodeId: 'Valjean',
    groupCount: 3,
    topNodes: [
      { degree: 2, group: 1, id: 'Valjean', weightedDegree: 13 },
      { degree: 2, group: 2, id: 'Cosette', weightedDegree: 12 },
    ],
  },
};

describe('graph analytics helpers', () => {
  it('builds a graph query from the graph workspace controls', () => {
    expect(
      buildGraphQuery('miserables', {
        ...DEFAULT_GRAPH_CONTROLS,
        executionMode: 'remote',
        minEdgeWeight: 3,
        neighborDepth: 2,
        scopeMode: 'focused-neighborhood',
        selectedGroups: [1, 4],
        selectedNodeId: 'Valjean',
      }),
    ).toEqual({
      aggregates: [],
      datasetId: 'miserables',
      entity: 'nodes',
      executionMode: 'remote',
      filters: [
        {
          field: 'group',
          operator: 'in',
          value: [1, 4],
        },
      ],
      graph: {
        focusNodeId: 'Valjean',
        includeIsolates: false,
        minEdgeWeight: 3,
        neighborDepth: 2,
      },
      groupBy: [],
      select: [],
      sorts: [],
    });
  });

  it('keeps the full graph visible by default even when a node is selected', () => {
    expect(
      buildGraphQuery('miserables', {
        ...DEFAULT_GRAPH_CONTROLS,
        selectedNodeId: 'Valjean',
      }),
    ).toMatchObject({
      graph: {
        focusNodeId: undefined,
        includeIsolates: true,
      },
    });
  });

  it('normalizes graph results and derives summary and canvas data', () => {
    const graphResult = normalizeGraphResult(sampleGraphResult);
    expect(graphResult?.resultKind).toBe('graph');

    expect(summarizeGraphResult(graphResult)).toEqual({
      averageDegree: 1.5,
      edgeCount: 3,
      focusedNodeLabel: 'Valjean',
      groupCount: 3,
      nodeCount: 4,
      strongestLinkWeight: 7,
    });

    expect(toForceGraphData(graphResult, 'Valjean').nodes[0]).toMatchObject({
      color: getGraphGroupColor(1),
      id: 'Valjean',
      selected: true,
    });
  });

  it('derives dynamic group options from the active graph result', () => {
    expect(getGraphGroupOptions(sampleGraphResult)).toEqual([1, 2, 3]);
  });

  it('derives selected-node neighbors from the active graph result', () => {
    const neighbors = getNodeNeighbors(sampleGraphResult, 'Valjean');

    expect(neighbors).toEqual([
      expect.objectContaining({ connectionWeight: 7, id: 'Cosette' }),
      expect.objectContaining({ connectionWeight: 6, id: 'Javert' }),
    ]);
  });
});
