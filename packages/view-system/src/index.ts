export type CoordinateSpace = 'screen-2d' | 'world-3d' | 'spatial-anchor';
export type CoordinationSignal = 'selection' | 'hover' | 'brush' | 'zoom' | 'filter' | 'query';
export type DatasetKind = 'tabular' | 'graph' | 'spatio-temporal';
export type DataKindAdapterId = 'tabular' | 'graph' | 'spatio-temporal' | 'text' | 'tree-native' | 'image' | 'xr-scene';
export type VisualizationCategory =
  | 'graph'
  | 'hierarchy'
  | 'multivariate'
  | 'tabular'
  | 'flow'
  | 'time-series';
export type VisualizationControlType = 'toggle-group' | 'select' | 'button-group';
export type VisualizationControlValue = string | number | boolean | null | string[];
export type StarterPriority = 'primary' | 'reference' | 'seed';
export type ViewRole = 'primary' | 'supporting' | 'detail' | 'overview';

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

export type WorkspaceLayoutDefinition = {
  id: string;
  label: string;
  mode: 'single-main-canvas';
  slots: ViewLayoutSlot[];
};

export type ViewInstanceDefinition = {
  id: string;
  label: string;
  role: ViewRole;
  viewId: string;
};

export type DatasetBinding = {
  id: string;
  datasetId: string;
  entity?: string;
  kindAdapterId: DataKindAdapterId;
  viewInstanceIds: string[];
  isPrimary: boolean;
};

export type CoordinationChannel = {
  id: string;
  signal: CoordinationSignal;
  sourceViewInstanceId: string;
  targetViewInstanceIds: string[];
  datasetBindingIds: string[];
};

export type StarterVariantDefinition = {
  id: string;
  label: string;
  summary: string;
};

export type StarterWorkbenchDefinition = {
  id: string;
  label: string;
  summary: string;
  kindAdapterId: DataKindAdapterId;
  defaultDatasetId: string;
  defaultVariantId: string;
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
  activeLayoutId?: string;
  activeStarterKind?: DataKindAdapterId;
  activeStarterVariant?: string;
  activeViewId?: string;
  activeVisualizationId?: string;
  coordinationChannels: Record<string, CoordinationChannel>;
  datasetBindings: Record<string, DatasetBinding>;
  filters: CoordinationFilter[];
  layout: ViewLayout;
  lastQuery?: CoordinationQuery;
  lastJobId?: string;
  selections: Record<string, SelectionState>;
  hover?: HoverState;
  visualizationControlValues: Record<string, Record<string, VisualizationControlValue>>;
  viewInstances: Record<string, ViewInstanceDefinition>;
  viewports: Record<string, ViewportState>;
};

export type VisualizationControlOption = {
  description?: string;
  label: string;
  value: string;
};

export type VisualizationControlSpec = {
  id: string;
  label: string;
  type: VisualizationControlType;
  description?: string;
  options?: VisualizationControlOption[];
  valueKey?: string;
};

export type VisualizationPreset = {
  id: string;
  label: string;
  description?: string;
  values: Record<string, VisualizationControlValue>;
};

export type VisualizationRendererProps = {
  datasetId: string;
  exampleId: string;
  controlValues: Record<string, VisualizationControlValue>;
  preferredExecutionMode?: 'local' | 'remote';
};

export type VisualizationExampleDefinition = {
  id: string;
  title: string;
  summary: string;
  category: VisualizationCategory;
  datasetIds: string[];
  defaultDatasetId: string;
  rendererId: string;
  routePath: string;
  provenanceLabel: string;
  provenanceUrl: string;
  controlSpecs: VisualizationControlSpec[];
  presets?: VisualizationPreset[];
};

export type DatasetStarterMetadata = {
  kindAdapterId: DataKindAdapterId;
  priority: StarterPriority;
  defaultVariant: string;
  supportedVariants: string[];
  supportsMultiDatasetBinding: boolean;
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

export const singleMainCanvasLayout: WorkspaceLayoutDefinition = {
  id: 'single-main-canvas',
  label: 'Single main canvas',
  mode: 'single-main-canvas',
  slots: baselineWorkspaceLayout.slots,
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
