export const corePalette = {
  canvas: '#07131c',
  accent: '#33b2c9',
  accentMuted: '#89d6df',
  paper: '#f4f8fb',
};

export type ChartFrame = {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
};

export * from './d3-force-graph';
export * from './d3-scatter-plot';
export * from './adjacency-matrix-brush';
export * from './brushable-scatterplot-matrix';
export * from './graph-tree-techniques';
export * from './multivariate-network-view';
export * from './sankey-flow-diagram';
export * from './scatter-plot';
