export type GraphTechnique = 'force' | 'matrix' | 'tree' | 'multivariate';
export type GraphWorkbenchDatasetId = 'miserables' | 'flare';
export type GraphOrdering = 'original' | 'alphabetical' | 'degree' | 'group';
export type TreeTechniqueMode = 'node-link' | 'icicle' | 'sunburst';
export type TreeAlignment = 'axis-parallel' | 'radial';
export type MultivariateLayoutMode = 'encoded-force' | 'attribute-position' | 'faceted';

export const DEFAULT_GRAPH_TECHNIQUE: GraphTechnique = 'force';
export const DEFAULT_GRAPH_DATASET: GraphWorkbenchDatasetId = 'miserables';
export const DEFAULT_GRAPH_ORDERING: GraphOrdering = 'original';
export const DEFAULT_TREE_TECHNIQUE_MODE: TreeTechniqueMode = 'node-link';
export const DEFAULT_TREE_ALIGNMENT: TreeAlignment = 'axis-parallel';
export const DEFAULT_MULTIVARIATE_LAYOUT_MODE: MultivariateLayoutMode = 'encoded-force';

export const graphTechniqueOptions: Array<{
  description: string;
  label: string;
  value: GraphTechnique;
}> = [
  {
    value: 'force',
    label: 'Force',
    description: 'Node-link force canvas for live topology inspection and focus exploration.',
  },
  {
    value: 'matrix',
    label: 'Matrix',
    description: 'Adjacency matrix brushing and ordering scaffolding for the next v2.3.x patches.',
  },
  {
    value: 'tree',
    label: 'Tree',
    description: 'Hierarchy-focused tree techniques for explicit and implicit layouts.',
  },
  {
    value: 'multivariate',
    label: 'Multivariate',
    description: 'Attribute-rich network encodings inspired by MVNV.',
  },
];

export const treeTechniqueModeOptions: Array<{
  description: string;
  label: string;
  value: TreeTechniqueMode;
}> = [
  {
    value: 'node-link',
    label: 'Node-link',
    description: 'Explicit parent-child tree layout for path tracing and branch inspection.',
  },
  {
    value: 'icicle',
    label: 'Icicle',
    description: 'Implicit axis-parallel partition layout for structural depth comparison.',
  },
  {
    value: 'sunburst',
    label: 'Sunburst',
    description: 'Implicit radial hierarchy layout for compact structural overviews.',
  },
];

export const treeAlignmentOptions: Array<{
  description: string;
  label: string;
  value: TreeAlignment;
}> = [
  {
    value: 'axis-parallel',
    label: 'Axis',
    description: 'Linear orientation with left-to-right or stacked hierarchy reading.',
  },
  {
    value: 'radial',
    label: 'Radial',
    description: 'Circular orientation for more compact branch overviews.',
  },
];

export const multivariateLayoutOptions: Array<{
  description: string;
  label: string;
  value: MultivariateLayoutMode;
}> = [
  {
    value: 'encoded-force',
    label: 'Encoded force',
    description: 'Topology-first force graph with multivariate node and edge encodings.',
  },
  {
    value: 'attribute-position',
    label: 'Attribute position',
    description: 'Place nodes by analytical axes instead of simulated force position.',
  },
  {
    value: 'faceted',
    label: 'Faceted',
    description: 'Partition the network into one canvas with attribute-based facets.',
  },
];

export const graphDatasetOptions: Array<{
  description: string;
  label: string;
  value: GraphWorkbenchDatasetId;
}> = [
  {
    value: 'miserables',
    label: 'Les Miserables',
    description: 'General weighted character graph for force, matrix, and multivariate work.',
  },
  {
    value: 'flare',
    label: 'Flare',
    description: 'Hierarchy dataset that seeds the later tree technique line.',
  },
];

export function isGraphTechnique(value: string | null | undefined): value is GraphTechnique {
  return graphTechniqueOptions.some((option) => option.value === value);
}

export function isGraphWorkbenchDatasetId(
  value: string | null | undefined,
): value is GraphWorkbenchDatasetId {
  return graphDatasetOptions.some((option) => option.value === value);
}

export function parseGraphTechniqueParam(value: string | null | undefined): GraphTechnique {
  return isGraphTechnique(value) ? value : DEFAULT_GRAPH_TECHNIQUE;
}

export function parseGraphDatasetParam(
  value: string | null | undefined,
): GraphWorkbenchDatasetId {
  return isGraphWorkbenchDatasetId(value) ? value : DEFAULT_GRAPH_DATASET;
}
