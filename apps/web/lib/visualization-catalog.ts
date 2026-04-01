import type { VisualizationExampleDefinition } from '@va/view-system';

export const visualizationCatalog: VisualizationExampleDefinition[] = [
  {
    id: 'graph-force',
    title: 'Les Miserables force graph',
    summary: 'Topology-first graph workbench with force layout, selection, neighborhood scope, and remote/local parity.',
    category: 'graph',
    datasetIds: ['miserables'],
    defaultDatasetId: 'miserables',
    rendererId: 'graph-workbench',
    routePath: '/examples/graph-force',
    provenanceLabel: 'Vega Miserables + native D3 force graph',
    provenanceUrl: 'https://vega.github.io/vega-datasets/data/miserables.json',
    controlSpecs: [],
    presets: [
      {
        id: 'full-force',
        label: 'Full graph',
        description: 'Open the canonical graph home with the full topology visible.',
        values: {
          dataset: 'miserables',
          technique: 'force',
        },
      },
    ],
  },
  {
    id: 'graph-matrix',
    title: 'Adjacency matrix brush',
    summary: 'Brushable adjacency matrix with deterministic ordering and graph subset inspection.',
    category: 'graph',
    datasetIds: ['miserables'],
    defaultDatasetId: 'miserables',
    rendererId: 'graph-workbench',
    routePath: '/examples/graph-matrix',
    provenanceLabel: 'Observable adjacency matrix brush, rebuilt natively',
    provenanceUrl: 'https://observablehq.com/@jannespeeters/adjacency-matrix-brush',
    controlSpecs: [],
  },
  {
    id: 'graph-multivariate',
    title: 'Multivariate network encoding',
    summary: 'MVNV-inspired graph encoding surface for node, edge, and attribute-position controls.',
    category: 'multivariate',
    datasetIds: ['miserables'],
    defaultDatasetId: 'miserables',
    rendererId: 'graph-workbench',
    routePath: '/examples/graph-multivariate',
    provenanceLabel: 'MVNV-inspired native graph workbench',
    provenanceUrl: 'https://vdl.sci.utah.edu/mvnv/',
    controlSpecs: [],
  },
  {
    id: 'hierarchy-suite',
    title: 'Hierarchy technique suite',
    summary: 'Tree-focused workspace for explicit and implicit hierarchy techniques on flare.',
    category: 'hierarchy',
    datasetIds: ['flare'],
    defaultDatasetId: 'flare',
    rendererId: 'graph-workbench',
    routePath: '/examples/hierarchy-suite',
    provenanceLabel: 'treevis taxonomy mapped onto native D3 hierarchy views',
    provenanceUrl: 'https://treevis.net/',
    controlSpecs: [],
  },
  {
    id: 'cars-scatter',
    title: 'Cars single-view reference',
    summary: 'Reference single-view analytics workflow retained from the v2.2 line.',
    category: 'tabular',
    datasetIds: ['cars'],
    defaultDatasetId: 'cars',
    rendererId: 'cars-single-view',
    routePath: '/examples/cars-scatter',
    provenanceLabel: 'Vega Cars dataset + native D3 scatterplot',
    provenanceUrl: 'https://vega.github.io/vega-datasets/data/cars.json',
    controlSpecs: [],
  },
];

export const visualizationCategoryOrder: VisualizationExampleDefinition['category'][] = [
  'graph',
  'hierarchy',
  'multivariate',
  'tabular',
  'flow',
  'time-series',
];

export function getVisualizationExample(exampleId: string) {
  return visualizationCatalog.find((example) => example.id === exampleId);
}

export function getVisualizationExamplesByCategory() {
  return visualizationCategoryOrder.map((category) => ({
    category,
    examples: visualizationCatalog.filter((example) => example.category === category),
  }));
}
