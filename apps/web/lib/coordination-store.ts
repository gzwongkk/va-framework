'use client';

import type { DataKindAdapterId, ExecutionMode, FilterClause, QuerySpec } from '@va/contracts';
import {
  baselineWorkspaceLayout,
  singleMainCanvasLayout,
  type CoordinationChannel,
  type CoordinationState,
  type DatasetBinding,
  type SelectionState,
  type ViewInstanceDefinition,
  type ViewportState,
} from '@va/view-system';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CoordinationStore = CoordinationState & {
  setActiveLayoutId: (layoutId: string) => void;
  setActiveStarterKind: (kind: DataKindAdapterId) => void;
  setActiveStarterVariant: (variantId: string) => void;
  preferredExecutionMode: ExecutionMode;
  setActiveDatasetId: (datasetId: string) => void;
  setActiveViewId: (viewId: string) => void;
  setActiveVisualizationId: (visualizationId: string) => void;
  setPreferredExecutionMode: (mode: ExecutionMode) => void;
  setFilters: (filters: FilterClause[]) => void;
  setLastJobId: (jobId?: string) => void;
  setLastQuery: (query: QuerySpec) => void;
  setCoordinationChannel: (channel: CoordinationChannel) => void;
  setDatasetBinding: (binding: DatasetBinding) => void;
  setSelection: (viewId: string, selection: SelectionState) => void;
  setVisualizationControlValues: (
    visualizationId: string,
    values: Record<string, string | number | boolean | null | string[]>,
  ) => void;
  setViewInstance: (viewInstance: ViewInstanceDefinition) => void;
  setViewport: (viewId: string, viewport: ViewportState) => void;
};

const defaultViewInstances: Record<string, ViewInstanceDefinition> = {
  'primary-canvas': {
    id: 'primary-canvas',
    label: 'Primary canvas',
    role: 'primary',
    viewId: 'single-view-plot',
  },
};

const initialState: CoordinationState = {
  activeDatasetId: undefined,
  activeLayoutId: singleMainCanvasLayout.id,
  activeStarterKind: 'tabular',
  activeStarterVariant: 'scatter',
  activeViewId: 'graph-canvas',
  activeVisualizationId: 'graph-force',
  coordinationChannels: {},
  datasetBindings: {},
  filters: [],
  hover: undefined,
  layout: baselineWorkspaceLayout,
  lastJobId: undefined,
  lastQuery: undefined,
  selections: {},
  visualizationControlValues: {},
  viewInstances: defaultViewInstances,
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
      setActiveLayoutId: (layoutId) =>
        set((state) => (state.activeLayoutId === layoutId ? state : { activeLayoutId: layoutId })),
      setActiveStarterKind: (activeStarterKind) =>
        set((state) => (state.activeStarterKind === activeStarterKind ? state : { activeStarterKind })),
      setActiveStarterVariant: (activeStarterVariant) =>
        set((state) => (state.activeStarterVariant === activeStarterVariant ? state : { activeStarterVariant })),
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
      setActiveVisualizationId: (visualizationId) =>
        set((state) => (state.activeVisualizationId === visualizationId ? state : { activeVisualizationId: visualizationId })),
      setPreferredExecutionMode: (mode) =>
        set((state) => (state.preferredExecutionMode === mode ? state : { preferredExecutionMode: mode })),
      setFilters: (filters) => set((state) => (hasSameSerializedValue(state.filters, filters) ? state : { filters })),
      setLastJobId: (jobId) => set((state) => (state.lastJobId === jobId ? state : { lastJobId: jobId })),
      setLastQuery: (query) => set((state) => (hasSameSerializedValue(state.lastQuery, query) ? state : { lastQuery: query })),
      setCoordinationChannel: (channel) =>
        set((state) => {
          if (hasSameSerializedValue(state.coordinationChannels[channel.id], channel)) {
            return state;
          }

          return {
            coordinationChannels: {
              ...state.coordinationChannels,
              [channel.id]: channel,
            },
          };
        }),
      setDatasetBinding: (binding) =>
        set((state) => {
          if (hasSameSerializedValue(state.datasetBindings[binding.id], binding)) {
            return state;
          }

          return {
            datasetBindings: {
              ...state.datasetBindings,
              [binding.id]: binding,
            },
          };
        }),
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
      setVisualizationControlValues: (visualizationId, values) =>
        set((state) => {
          if (hasSameSerializedValue(state.visualizationControlValues[visualizationId], values)) {
            return state;
          }

          return {
            visualizationControlValues: {
              ...state.visualizationControlValues,
              [visualizationId]: values,
            },
          };
        }),
      setViewInstance: (viewInstance) =>
        set((state) => {
          if (hasSameSerializedValue(state.viewInstances[viewInstance.id], viewInstance)) {
            return state;
          }

          return {
            viewInstances: {
              ...state.viewInstances,
              [viewInstance.id]: viewInstance,
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
        activeLayoutId: state.activeLayoutId,
        activeStarterKind: state.activeStarterKind,
        activeStarterVariant: state.activeStarterVariant,
        activeViewId: state.activeViewId,
        activeVisualizationId: state.activeVisualizationId,
        coordinationChannels: state.coordinationChannels,
        datasetBindings: state.datasetBindings,
        filters: state.filters,
        lastJobId: state.lastJobId,
        lastQuery: state.lastQuery,
        preferredExecutionMode: state.preferredExecutionMode,
        visualizationControlValues: state.visualizationControlValues,
        viewInstances: state.viewInstances,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
