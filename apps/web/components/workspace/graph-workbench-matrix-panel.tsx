'use client';

import { AdjacencyMatrixBrush, type D3ScatterPlotTheme } from '@va/vis-core';

import {
  summarizeMatrixSelection,
  type AdjacencyMatrixModel,
} from '@/lib/analytics/graph-workbench-analytics';
import type { GraphOrdering } from '@/lib/graph-workbench';

type GraphWorkbenchMatrixPanelProps = {
  datasetLabel: string;
  matrix: AdjacencyMatrixModel;
  ordering: GraphOrdering;
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
  ordering,
  selectedIds,
  statusLabel,
  statusTone,
  theme,
}: GraphWorkbenchMatrixPanelProps) {
  const selectionSummary = summarizeMatrixSelection(matrix, selectedIds);

  return (
    <AdjacencyMatrixBrush
      cells={matrix.cells}
      nodes={matrix.nodes.map(({ degree, group, id, label }) => ({ degree, group, id, label }))}
      onSelectIds={onSelectIds}
      selectedIds={selectedIds}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle={`Ordered ${datasetLabel} connectivity with brushable rows and columns. ${selectionSummary.selectedNodeCount > 1 ? `${selectionSummary.selectedNodeCount} nodes selected at ${selectionSummary.density.toFixed(3)} density.` : `Ordering: ${ordering}.`}`}
      theme={theme}
      title={`${datasetLabel} adjacency matrix`}
      truncated={matrix.truncated}
    />
  );
}
