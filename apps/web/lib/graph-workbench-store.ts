'use client';

import { create } from 'zustand';

import type { GraphScopeMode } from '@/lib/analytics/graph-analytics';
import {
  DEFAULT_GRAPH_DATASET,
  DEFAULT_MULTIVARIATE_LAYOUT_MODE,
  DEFAULT_GRAPH_ORDERING,
  DEFAULT_GRAPH_TECHNIQUE,
  DEFAULT_TREE_ALIGNMENT,
  DEFAULT_TREE_TECHNIQUE_MODE,
  type GraphOrdering,
  type GraphTechnique,
  type GraphWorkbenchDatasetId,
  type MultivariateLayoutMode,
  type TreeAlignment,
  type TreeTechniqueMode,
} from '@/lib/graph-workbench';

export type MultivariateEncodingConfig = {
  colorField: string;
  edgeColorField: string;
  edgeWidthField: string;
  facetField?: string;
  layoutMode: MultivariateLayoutMode;
  sizeField: string;
  xField: string;
  yField: string;
};

type GraphWorkbenchState = {
  dataset: GraphWorkbenchDatasetId;
  treeAlignment: TreeAlignment;
  treeMode: TreeTechniqueMode;
  focusNodeId?: string;
  ordering: GraphOrdering;
  scopeMode: GraphScopeMode;
  selectedNodeIds: string[];
  technique: GraphTechnique;
  encodings: MultivariateEncodingConfig;
  setDataset: (dataset: GraphWorkbenchDatasetId) => void;
  setFocusNodeId: (focusNodeId?: string) => void;
  setOrdering: (ordering: GraphOrdering) => void;
  setScopeMode: (scopeMode: GraphScopeMode) => void;
  setSelectedNodeIds: (selectedNodeIds: string[]) => void;
  setTechnique: (technique: GraphTechnique) => void;
  setTreeAlignment: (alignment: TreeAlignment) => void;
  setTreeMode: (mode: TreeTechniqueMode) => void;
  setEncodings: (encodings: Partial<MultivariateEncodingConfig>) => void;
};

const DEFAULT_ENCODINGS: MultivariateEncodingConfig = {
  colorField: 'group',
  edgeColorField: 'community',
  edgeWidthField: 'value',
  layoutMode: DEFAULT_MULTIVARIATE_LAYOUT_MODE,
  sizeField: 'degree',
  xField: 'betweenness',
  yField: 'weightedDegree',
};

export const useGraphWorkbenchStore = create<GraphWorkbenchState>()((set) => ({
  dataset: DEFAULT_GRAPH_DATASET,
  encodings: DEFAULT_ENCODINGS,
  focusNodeId: undefined,
  ordering: DEFAULT_GRAPH_ORDERING,
  scopeMode: 'full-graph',
  selectedNodeIds: [],
  technique: DEFAULT_GRAPH_TECHNIQUE,
  treeAlignment: DEFAULT_TREE_ALIGNMENT,
  treeMode: DEFAULT_TREE_TECHNIQUE_MODE,
  setDataset: (dataset) => set((state) => (state.dataset === dataset ? state : { dataset })),
  setEncodings: (encodings) =>
    set((state) => {
      const nextEncodings = {
        ...state.encodings,
        ...encodings,
      };

      return JSON.stringify(state.encodings) === JSON.stringify(nextEncodings)
        ? state
        : {
            encodings: nextEncodings,
          };
    }),
  setFocusNodeId: (focusNodeId) => set((state) => (state.focusNodeId === focusNodeId ? state : { focusNodeId })),
  setOrdering: (ordering) => set((state) => (state.ordering === ordering ? state : { ordering })),
  setScopeMode: (scopeMode) => set((state) => (state.scopeMode === scopeMode ? state : { scopeMode })),
  setSelectedNodeIds: (selectedNodeIds) =>
    set((state) =>
      state.selectedNodeIds.length === selectedNodeIds.length &&
      state.selectedNodeIds.every((id, index) => id === selectedNodeIds[index])
        ? state
        : { selectedNodeIds },
    ),
  setTechnique: (technique) => set((state) => (state.technique === technique ? state : { technique })),
  setTreeAlignment: (treeAlignment) =>
    set((state) => (state.treeAlignment === treeAlignment ? state : { treeAlignment })),
  setTreeMode: (treeMode) => set((state) => (state.treeMode === treeMode ? state : { treeMode })),
}));
