export type GraphTechnique = 'force' | 'matrix' | 'tree' | 'multivariate';
export type GraphWorkbenchDatasetId = 'miserables' | 'flare';
export type GraphOrdering = 'original' | 'alphabetical' | 'degree' | 'group';

export const DEFAULT_GRAPH_TECHNIQUE: GraphTechnique = 'force';
export const DEFAULT_GRAPH_DATASET: GraphWorkbenchDatasetId = 'miserables';
export const DEFAULT_GRAPH_ORDERING: GraphOrdering = 'original';

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
