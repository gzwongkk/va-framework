export type CoordinateSpace = 'screen-2d' | 'world-3d' | 'spatial-anchor';
export type CoordinationSignal = 'selection' | 'hover' | 'brush' | 'zoom' | 'filter' | 'query';
export type DatasetKind = 'tabular' | 'graph' | 'spatio-temporal';

export type CoordinationFilter = {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between' | 'contains';
  value: unknown;
  secondaryValue?: string | number | boolean | null;
};

export type CoordinationQuery = {
  datasetId: string;
  entity?: string;
  executionMode?: 'local' | 'remote';
  select?: string[];
  filters?: CoordinationFilter[];
  sorts?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  groupBy?: string[];
  aggregates?: Array<{
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
    field?: string;
    as: string;
  }>;
  limit?: number;
  graph?: {
    focusNodeId?: string;
    neighborDepth?: 1 | 2;
    minEdgeWeight?: number;
    includeIsolates?: boolean;
  };
};

export type ViewDefinition = {
  id: string;
  label: string;
  summary: string;
  coordinateSpace: CoordinateSpace;
  supportedKinds: DatasetKind[];
  signals: CoordinationSignal[];
};

export type ViewLayoutSlot = {
  id: string;
  label: string;
  role: 'header' | 'canvas' | 'sidebar' | 'details';
};

export type ViewLayout = {
  id: string;
  mode: 'single-page-workspace';
  slots: ViewLayoutSlot[];
};

export type SelectionState = {
  ids: string[];
  sourceViewId?: string;
  entity?: string;
};

export type HoverState = {
  id?: string;
  sourceViewId?: string;
  entity?: string;
};

export type ViewportState = {
  coordinateSpace: CoordinateSpace;
  xDomain?: [number, number];
  yDomain?: [number, number];
  zoom?: number;
  center?: [number, number];
};

export type CoordinationState = {
  activeDatasetId?: string;
  activeViewId?: string;
  filters: CoordinationFilter[];
  layout: ViewLayout;
  lastQuery?: CoordinationQuery;
  lastJobId?: string;
  selections: Record<string, SelectionState>;
  hover?: HoverState;
  viewports: Record<string, ViewportState>;
};

export const baselineWorkspaceLayout: ViewLayout = {
  id: 'baseline-shell',
  mode: 'single-page-workspace',
  slots: [
    { id: 'header', label: 'Top-level context and actions', role: 'header' },
    { id: 'canvas', label: 'Primary analysis surface', role: 'canvas' },
    { id: 'sidebar', label: 'Controls and query tuning', role: 'sidebar' },
    { id: 'details', label: 'Derived details and explanations', role: 'details' },
  ],
};

export const starterViews: ViewDefinition[] = [
  {
    id: 'single-view-plot',
    label: 'Single-view canvas',
    summary: 'Focused analytic chart surface driven by the shared query contract.',
    coordinateSpace: 'screen-2d',
    supportedKinds: ['tabular', 'spatio-temporal'],
    signals: ['selection', 'hover', 'brush', 'zoom', 'filter', 'query'],
  },
  {
    id: 'graph-canvas',
    label: 'Graph canvas',
    summary: 'Graph-native surface for the v2.3.x graph workbench line.',
    coordinateSpace: 'screen-2d',
    supportedKinds: ['graph'],
    signals: ['selection', 'hover', 'filter', 'query'],
  },
];
