'use client';

import { AdjacencyMatrixBrush, type D3ScatterPlotTheme } from '@va/vis-core';

import type { AdjacencyMatrixModel } from '@/lib/analytics/graph-workbench-analytics';

type GraphWorkbenchMatrixPanelProps = {
  datasetLabel: string;
  matrix: AdjacencyMatrixModel;
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  statusLabel: string;
  statusTone: 'accent' | 'neutral' | 'warning' | 'error';
  theme: D3ScatterPlotTheme;
};

export function GraphWorkbenchMatrixPanel({
  datasetLabel,
  matrix,
  onSelectIds,
  selectedIds,
  statusLabel,
  statusTone,
  theme,
}: GraphWorkbenchMatrixPanelProps) {
  return (
    <AdjacencyMatrixBrush
      cells={matrix.cells}
      nodes={matrix.nodes.map(({ degree, group, id, label }) => ({ degree, group, id, label }))}
      onSelectIds={onSelectIds}
      selectedIds={selectedIds}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle={`Ordered ${datasetLabel} connectivity with brushable rows and columns.`}
      theme={theme}
      title={`${datasetLabel} adjacency matrix`}
      truncated={matrix.truncated}
    />
  );
}
