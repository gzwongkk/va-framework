import type { ExecutionMode, QuerySpec } from '@va/contracts';
import type { TreeAlignment, TreeTechniqueMode } from '@va/vis-core';

import type { HierarchyNode } from '@/lib/analytics/graph-workbench-analytics';

export const HIERARCHY_DATASET_ID = 'flare';

export type HierarchyVariant =
  | 'tidy-tree'
  | 'radial-cluster'
  | 'icicle'
  | 'sunburst'
  | 'treemap';

export const hierarchyVariantOptions: Array<{
  description: string;
  label: string;
  value: HierarchyVariant;
}> = [
  {
    value: 'tidy-tree',
    label: 'Tidy tree',
    description: 'Explicit axis-parallel node-link tree for branch tracing and label-heavy reading.',
  },
  {
    value: 'radial-cluster',
    label: 'Radial cluster',
    description: 'Explicit radial clustering for compact overviews of the hierarchy skeleton.',
  },
  {
    value: 'icicle',
    label: 'Icicle',
    description: 'Implicit axis-parallel partition view for structural depth and containment.',
  },
  {
    value: 'sunburst',
    label: 'Sunburst',
    description: 'Implicit radial hierarchy view for compact containment overviews.',
  },
  {
    value: 'treemap',
    label: 'Treemap',
    description: 'Implicit area-based hierarchy view for leaf value comparison.',
  },
];

export function buildHierarchyQuery(executionMode: ExecutionMode): QuerySpec {
  return {
    aggregates: [],
    datasetId: HIERARCHY_DATASET_ID,
    entity: 'nodes',
    executionMode,
    filters: [],
    graph: {
      includeIsolates: true,
      minEdgeWeight: 0,
      neighborDepth: 1,
    },
    groupBy: [],
    select: [],
    sorts: [],
  };
}

export function resolveHierarchyVariant(variant: HierarchyVariant): {
  alignment: TreeAlignment;
  mode: TreeTechniqueMode;
} {
  switch (variant) {
    case 'radial-cluster':
      return { alignment: 'radial', mode: 'node-link' };
    case 'icicle':
      return { alignment: 'axis-parallel', mode: 'icicle' };
    case 'sunburst':
      return { alignment: 'radial', mode: 'sunburst' };
    case 'treemap':
      return { alignment: 'axis-parallel', mode: 'treemap' };
    default:
      return { alignment: 'axis-parallel', mode: 'node-link' };
  }
}

export function limitHierarchyDepth(
  root: HierarchyNode | undefined,
  maxDepth: number,
): HierarchyNode | undefined {
  if (!root) {
    return undefined;
  }

  return {
    ...root,
    children:
      root.depth >= maxDepth
        ? []
        : root.children
            .map((child) => limitHierarchyDepth(child, maxDepth))
            .filter((child): child is HierarchyNode => Boolean(child)),
  };
}
