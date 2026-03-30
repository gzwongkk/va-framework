export type CoordinateSpace = 'screen-2d' | 'world-3d' | 'spatial-anchor';

export type ViewDefinition = {
  id: string;
  label: string;
  summary: string;
  coordinateSpace: CoordinateSpace;
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
