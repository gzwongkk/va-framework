'use client';

import type { ExecutionMode, FilterClause, QuerySpec } from '@va/contracts';
import { baselineWorkspaceLayout, type CoordinationState, type SelectionState, type ViewportState } from '@va/view-system';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CoordinationStore = CoordinationState & {
  preferredExecutionMode: ExecutionMode;
  setActiveDatasetId: (datasetId: string) => void;
  setActiveViewId: (viewId: string) => void;
  setPreferredExecutionMode: (mode: ExecutionMode) => void;
  setFilters: (filters: FilterClause[]) => void;
  setLastJobId: (jobId?: string) => void;
  setLastQuery: (query: QuerySpec) => void;
  setSelection: (viewId: string, selection: SelectionState) => void;
  setViewport: (viewId: string, viewport: ViewportState) => void;
};

const initialState: CoordinationState = {
  activeDatasetId: undefined,
  activeViewId: 'graph-canvas',
  filters: [],
  hover: undefined,
  layout: baselineWorkspaceLayout,
  lastJobId: undefined,
  lastQuery: undefined,
  selections: {},
  viewports: {},
};

function arePrimitiveArraysEqual(
  left: readonly (string | number | boolean | null | undefined)[],
  right: readonly (string | number | boolean | null | undefined)[],
) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function hasSameSerializedValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function areSelectionsEqual(left: SelectionState | undefined, right: SelectionState) {
  if (left === right) {
    return true;
  }

  if (!left) {
    return false;
  }

  return (
    left.entity === right.entity &&
    left.sourceViewId === right.sourceViewId &&
    arePrimitiveArraysEqual(left.ids, right.ids)
  );
}

function areViewportsEqual(left: ViewportState | undefined, right: ViewportState) {
  if (left === right) {
    return true;
  }

  if (!left) {
    return false;
  }

  return (
    left.coordinateSpace === right.coordinateSpace &&
    left.zoom === right.zoom &&
    arePrimitiveArraysEqual(left.center ?? [], right.center ?? []) &&
    arePrimitiveArraysEqual(left.xDomain ?? [], right.xDomain ?? []) &&
    arePrimitiveArraysEqual(left.yDomain ?? [], right.yDomain ?? [])
  );
}

export const useCoordinationStore = create<CoordinationStore>()(
  persist(
    (set) => ({
      ...initialState,
      preferredExecutionMode: 'local',
      setActiveDatasetId: (datasetId) =>
        set((state) => {
          if (state.activeDatasetId === datasetId && state.lastJobId === undefined) {
            return state;
          }

          return {
            activeDatasetId: datasetId,
            lastJobId: undefined,
          };
        }),
      setActiveViewId: (viewId) => set((state) => (state.activeViewId === viewId ? state : { activeViewId: viewId })),
      setPreferredExecutionMode: (mode) =>
        set((state) => (state.preferredExecutionMode === mode ? state : { preferredExecutionMode: mode })),
      setFilters: (filters) => set((state) => (hasSameSerializedValue(state.filters, filters) ? state : { filters })),
      setLastJobId: (jobId) => set((state) => (state.lastJobId === jobId ? state : { lastJobId: jobId })),
      setLastQuery: (query) => set((state) => (hasSameSerializedValue(state.lastQuery, query) ? state : { lastQuery: query })),
      setSelection: (viewId, selection) =>
        set((state) => {
          if (areSelectionsEqual(state.selections[viewId], selection)) {
            return state;
          }

          return {
            selections: {
              ...state.selections,
              [viewId]: selection,
            },
          };
        }),
      setViewport: (viewId, viewport) =>
        set((state) => {
          if (areViewportsEqual(state.viewports[viewId], viewport)) {
            return state;
          }

          return {
            viewports: {
              ...state.viewports,
              [viewId]: viewport,
            },
          };
        }),
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
