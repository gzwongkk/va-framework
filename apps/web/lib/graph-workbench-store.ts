'use client';

import { create } from 'zustand';

import type { GraphScopeMode } from '@/lib/analytics/graph-analytics';
import {
  DEFAULT_GRAPH_DATASET,
  DEFAULT_GRAPH_ORDERING,
  DEFAULT_GRAPH_TECHNIQUE,
  type GraphOrdering,
  type GraphTechnique,
  type GraphWorkbenchDatasetId,
} from '@/lib/graph-workbench';

export type MultivariateEncodingConfig = {
  colorField: string;
  edgeWidthField: string;
  facetField?: string;
  sizeField: string;
};

type GraphWorkbenchState = {
  dataset: GraphWorkbenchDatasetId;
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
  setEncodings: (encodings: Partial<MultivariateEncodingConfig>) => void;
};

const DEFAULT_ENCODINGS: MultivariateEncodingConfig = {
  colorField: 'group',
  edgeWidthField: 'value',
  sizeField: 'degree',
};

export const useGraphWorkbenchStore = create<GraphWorkbenchState>()((set) => ({
  dataset: DEFAULT_GRAPH_DATASET,
  encodings: DEFAULT_ENCODINGS,
  focusNodeId: undefined,
  ordering: DEFAULT_GRAPH_ORDERING,
  scopeMode: 'full-graph',
  selectedNodeIds: [],
  technique: DEFAULT_GRAPH_TECHNIQUE,
  setDataset: (dataset) => set((state) => (state.dataset === dataset ? state : { dataset })),
  setEncodings: (encodings) =>
    set((state) => ({
      encodings: {
        ...state.encodings,
        ...encodings,
      },
    })),
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
}));
