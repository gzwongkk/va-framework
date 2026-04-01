import {
  GraphTreeTechniques,
  type D3ScatterPlotTheme,
  type TreeAlignment,
  type TreeTechniqueMode,
} from '@va/vis-core';

import type { HierarchyNode } from '@/lib/analytics/graph-workbench-analytics';

type GraphWorkbenchTreePanelProps = {
  alignment: TreeAlignment;
  datasetLabel: string;
  mode: TreeTechniqueMode;
  onSelect: (id: string) => void;
  root: HierarchyNode | undefined;
  selectedId?: string;
  statusLabel: string;
  statusTone: 'accent' | 'neutral' | 'warning' | 'error';
  theme: D3ScatterPlotTheme;
};

export function GraphWorkbenchTreePanel({
  alignment,
  datasetLabel,
  mode,
  onSelect,
  root,
  selectedId,
  statusLabel,
  statusTone,
  theme,
}: GraphWorkbenchTreePanelProps) {
  return (
    <GraphTreeTechniques
      alignment={alignment}
      mode={mode}
      onSelect={onSelect}
      root={root}
      selectedId={selectedId}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle={`Hierarchy exploration for ${datasetLabel} with explicit and implicit tree techniques.`}
      theme={theme}
      title={`${datasetLabel} tree workspace`}
    />
  );
}
