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
    controlSpecs: [
      {
        id: 'technique',
        label: 'Technique',
        type: 'button-group',
        options: [
          { label: 'Force', value: 'force' },
          { label: 'Matrix', value: 'matrix' },
          { label: 'Tree', value: 'tree' },
          { label: 'Multivariate', value: 'multivariate' },
        ],
      },
      {
        id: 'dataset',
        label: 'Dataset',
        type: 'select',
        options: [
          { label: 'Les Miserables', value: 'miserables' },
          { label: 'Flare', value: 'flare' },
        ],
      },
      {
        id: 'ordering',
        label: 'Ordering',
        type: 'button-group',
        options: [
          { label: 'Original', value: 'original' },
          { label: 'Alpha', value: 'alphabetical' },
          { label: 'Degree', value: 'degree' },
          { label: 'Group', value: 'group' },
        ],
      },
    ],
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
    controlSpecs: [
      {
        id: 'technique',
        label: 'Technique',
        type: 'button-group',
        options: [
          { label: 'Force', value: 'force' },
          { label: 'Matrix', value: 'matrix' },
          { label: 'Tree', value: 'tree' },
          { label: 'Multivariate', value: 'multivariate' },
        ],
      },
      {
        id: 'dataset',
        label: 'Dataset',
        type: 'select',
        options: [
          { label: 'Les Miserables', value: 'miserables' },
          { label: 'Flare', value: 'flare' },
        ],
      },
      {
        id: 'ordering',
        label: 'Ordering',
        type: 'button-group',
        options: [
          { label: 'Original', value: 'original' },
          { label: 'Alpha', value: 'alphabetical' },
          { label: 'Degree', value: 'degree' },
          { label: 'Group', value: 'group' },
        ],
      },
    ],
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
    controlSpecs: [
      {
        id: 'technique',
        label: 'Technique',
        type: 'button-group',
        options: [
          { label: 'Force', value: 'force' },
          { label: 'Matrix', value: 'matrix' },
          { label: 'Tree', value: 'tree' },
          { label: 'Multivariate', value: 'multivariate' },
        ],
      },
      {
        id: 'dataset',
        label: 'Dataset',
        type: 'select',
        options: [
          { label: 'Les Miserables', value: 'miserables' },
          { label: 'Flare', value: 'flare' },
        ],
      },
      {
        id: 'ordering',
        label: 'Ordering',
        type: 'button-group',
        options: [
          { label: 'Original', value: 'original' },
          { label: 'Alpha', value: 'alphabetical' },
          { label: 'Degree', value: 'degree' },
          { label: 'Group', value: 'group' },
        ],
      },
    ],
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
    controlSpecs: [
      {
        id: 'technique',
        label: 'Technique',
        type: 'button-group',
        options: [
          { label: 'Force', value: 'force' },
          { label: 'Matrix', value: 'matrix' },
          { label: 'Tree', value: 'tree' },
          { label: 'Multivariate', value: 'multivariate' },
        ],
      },
      {
        id: 'dataset',
        label: 'Dataset',
        type: 'select',
        options: [
          { label: 'Les Miserables', value: 'miserables' },
          { label: 'Flare', value: 'flare' },
        ],
      },
      {
        id: 'ordering',
        label: 'Ordering',
        type: 'button-group',
        options: [
          { label: 'Original', value: 'original' },
          { label: 'Alpha', value: 'alphabetical' },
          { label: 'Degree', value: 'degree' },
          { label: 'Group', value: 'group' },
        ],
      },
    ],
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
    controlSpecs: [
      {
        id: 'execution',
        label: 'Execution',
        type: 'button-group',
        options: [
          { label: 'Local', value: 'local' },
          { label: 'Remote', value: 'remote' },
        ],
      },
    ],
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
