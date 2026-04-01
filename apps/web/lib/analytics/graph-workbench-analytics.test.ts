import { describe, expect, it } from 'vitest';
import type { GraphQueryResult } from '@va/contracts';

import {
  buildAdjacencyMatrixModel,
  buildHierarchyTree,
  deriveMultivariateNodes,
  getMultivariateFieldProfiles,
  getHierarchyLeafPreview,
  getHierarchyPath,
  getMatrixSelectionEdges,
  summarizeMultivariateFacets,
  getMultivariateFieldOptions,
  getTechniqueHelp,
  orderGraphNodes,
  summarizeHierarchyTree,
  summarizeMatrixSelection,
} from './graph-workbench-analytics';

const sampleGraphResult: GraphQueryResult = {
  datasetId: 'miserables',
  durationMs: 7.2,
  edgeCount: 3,
  edges: [
    { id: 'Valjean::Cosette', source: 'Valjean', target: 'Cosette', value: 7 },
    { id: 'Valjean::Javert', source: 'Valjean', target: 'Javert', value: 6 },
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

const hierarchyResult: GraphQueryResult = {
  datasetId: 'flare',
  durationMs: 4.8,
  edgeCount: 3,
  edges: [
    { id: '1::2', source: '1', target: '2', value: 1 },
    { id: '1::3', source: '1', target: '3', value: 1 },
    { id: '3::4', source: '3', target: '4', value: 1 },
  ],
  executionMode: 'local',
  nodeCount: 4,
  nodes: [
    { attributes: { depth: 0, group: 0, id: '1', name: 'root', parent: null, size: 10 }, degree: 2, depth: 0, group: 0, id: '1', label: 'root', weightedDegree: 2 },
    { attributes: { depth: 1, group: 1, id: '2', name: 'alpha', parent: '1', size: 6 }, degree: 1, depth: 1, group: 1, id: '2', label: 'alpha', parentId: '1', weightedDegree: 1 },
    { attributes: { depth: 1, group: 1, id: '3', name: 'beta', parent: '1', size: 8 }, degree: 2, depth: 1, group: 1, id: '3', label: 'beta', parentId: '1', weightedDegree: 2 },
    { attributes: { depth: 2, group: 2, id: '4', name: 'gamma', parent: '3', size: 4 }, degree: 1, depth: 2, group: 2, id: '4', label: 'gamma', parentId: '3', weightedDegree: 1 },
  ],
  queryKey: 'hierarchy-sample',
  resultKind: 'graph',
  source: 'graphology-local',
  summary: {
    averageDegree: 1.5,
    focusedNodeId: '1',
    groupCount: 3,
    topNodes: [{ degree: 2, group: 0, id: '1', weightedDegree: 2 }],
  },
};

describe('graph workbench analytics', () => {
  it('preserves input order for original ordering and sorts by graph group when requested', () => {
    expect(orderGraphNodes(sampleGraphResult, 'original').map((node) => node.id)).toEqual([
      'Valjean',
      'Cosette',
      'Javert',
      'Marius',
    ]);

    expect(orderGraphNodes(sampleGraphResult, 'group').map((node) => node.id)).toEqual([
      'Javert',
      'Valjean',
      'Cosette',
      'Marius',
    ]);
  });

  it('builds a brushable adjacency matrix and summarizes selected blocks', () => {
    const matrix = buildAdjacencyMatrixModel(sampleGraphResult, 'degree');
    const summary = summarizeMatrixSelection(matrix, ['Valjean', 'Cosette', 'Javert']);
    const selectedEdges = getMatrixSelectionEdges(matrix, ['Valjean', 'Cosette', 'Javert']);

    expect(matrix.visibleNodeCount).toBe(4);
    expect(matrix.cells.some((cell) => cell.sourceId === 'Valjean' && cell.targetId === 'Cosette' && cell.value === 7)).toBe(true);
    expect(summary).toEqual({
      crossGroupEdges: 1,
      density: 0.667,
      selectedEdgeCount: 2,
      selectedNodeCount: 3,
      visibleNodeCount: 4,
      withinGroupEdges: 1,
    });
    expect(selectedEdges[0]).toEqual({
      sourceId: 'Cosette',
      sourceLabel: 'Cosette',
      targetId: 'Valjean',
      targetLabel: 'Valjean',
      value: 7,
      withinGroup: false,
    });
  });

  it('normalizes hierarchy trees and summarizes tree structure', () => {
    const hierarchyRoot = buildHierarchyTree(hierarchyResult);
    const summary = summarizeHierarchyTree(hierarchyRoot);
    const path = getHierarchyPath(hierarchyRoot, '4');
    const leaves = getHierarchyLeafPreview(hierarchyRoot, 2);

    expect(hierarchyRoot?.label).toBe('root');
    expect(hierarchyRoot?.children.map((child) => child.label)).toEqual(['alpha', 'beta']);
    expect(summary).toEqual({
      leafCount: 2,
      maxDepth: 2,
      nodeCount: 4,
      rootLabel: 'root',
    });
    expect(path.map((node) => node.label)).toEqual(['root', 'beta', 'gamma']);
    expect(leaves).toEqual([
      { depth: 1, id: '2', label: 'alpha', value: 6 },
      { depth: 2, id: '4', label: 'gamma', value: 4 },
    ]);
  });

  it('derives multivariate node metrics and exposes field options', () => {
    const nodes = deriveMultivariateNodes(sampleGraphResult, 'Valjean');
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const options = getMultivariateFieldOptions(nodes);
    const profiles = getMultivariateFieldProfiles(nodes);

    expect(nodeById.get('Valjean')?.multivariate.egoDepth).toBe(0);
    expect(nodeById.get('Cosette')?.multivariate.degree).toBe(2);
    expect(options.numeric).toContain('betweenness');
    expect(options.numeric).toContain('weightedDegree');
    expect(options.categorical).toContain('community');
    expect(profiles.find((profile) => profile.field === 'weightedDegree')).toEqual(
      expect.objectContaining({ kind: 'numeric', max: 13, min: 5 }),
    );
    expect(profiles.find((profile) => profile.field === 'id')).toEqual(
      expect.objectContaining({ categoryCount: 4, kind: 'categorical' }),
    );
    expect(summarizeMultivariateFacets(nodes, 'community')).toEqual([
      { count: 2, label: '1', share: 0.5 },
      { count: 1, label: '2', share: 0.25 },
      { count: 1, label: '3', share: 0.25 },
    ]);
  });

  it('returns technique-specific reference guidance', () => {
    expect(getTechniqueHelp('matrix').reference).toBe('Adjacency Matrix Brush');
    expect(getTechniqueHelp('tree').reference).toBe('treevis taxonomy');
    expect(getTechniqueHelp('multivariate').reference).toBe('MVNV');
  });
});
