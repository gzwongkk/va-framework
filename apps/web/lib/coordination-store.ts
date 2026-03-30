'use client';

import type { ExecutionMode, FilterClause, QuerySpec } from '@va/contracts';
import { baselineWorkspaceLayout, type CoordinationState, type SelectionState, type ViewportState } from '@va/view-system';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CoordinationStore = CoordinationState & {
  preferredExecutionMode: ExecutionMode;
  setActiveDatasetId: (datasetId: string) => void;
  setPreferredExecutionMode: (mode: ExecutionMode) => void;
  setFilters: (filters: FilterClause[]) => void;
  setLastJobId: (jobId?: string) => void;
  setLastQuery: (query: QuerySpec) => void;
  setSelection: (viewId: string, selection: SelectionState) => void;
  setViewport: (viewId: string, viewport: ViewportState) => void;
};

const initialState: CoordinationState = {
  activeDatasetId: undefined,
  activeViewId: 'single-view-plot',
  filters: [],
  hover: undefined,
  layout: baselineWorkspaceLayout,
  lastJobId: undefined,
  lastQuery: undefined,
  selections: {},
  viewports: {},
};

export const useCoordinationStore = create<CoordinationStore>()(
  persist(
    (set) => ({
      ...initialState,
      preferredExecutionMode: 'local',
      setActiveDatasetId: (datasetId) =>
        set({
          activeDatasetId: datasetId,
          lastJobId: undefined,
        }),
      setPreferredExecutionMode: (mode) => set({ preferredExecutionMode: mode }),
      setFilters: (filters) => set({ filters }),
      setLastJobId: (jobId) => set({ lastJobId: jobId }),
      setLastQuery: (query) => set({ lastQuery: query }),
      setSelection: (viewId, selection) =>
        set((state) => ({
          selections: {
            ...state.selections,
            [viewId]: selection,
          },
        })),
      setViewport: (viewId, viewport) =>
        set((state) => ({
          viewports: {
            ...state.viewports,
            [viewId]: viewport,
          },
        })),
    }),
    {
      name: 'va-foundation-store',
      partialize: (state) => ({
        activeDatasetId: state.activeDatasetId,
        activeViewId: state.activeViewId,
        filters: state.filters,
        lastJobId: state.lastJobId,
        lastQuery: state.lastQuery,
        preferredExecutionMode: state.preferredExecutionMode,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
