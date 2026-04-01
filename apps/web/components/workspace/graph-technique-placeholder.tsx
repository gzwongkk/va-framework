'use client';

import type { DatasetDescriptor } from '@va/contracts';
import type { D3ScatterPlotTheme } from '@va/vis-core';
import { Badge, Separator } from '@va/ui';

import type { GraphTechnique } from '@/lib/graph-workbench';

const techniqueCopy: Record<Exclude<GraphTechnique, 'force'>, { milestone: string; summary: string; reference: string }> = {
  matrix: {
    milestone: 'v2.3.3-v2.3.4',
    summary: 'Adjacency matrix brushing and ordering will build on the current node selection and dataset state.',
    reference: 'Observable adjacency matrix brush',
  },
  tree: {
    milestone: 'v2.3.5-v2.3.6',
    summary: 'Tree techniques will reuse this shared graph contract for explicit node-link and implicit hierarchy layouts.',
    reference: 'treevis taxonomy',
  },
  multivariate: {
    milestone: 'v2.3.7-v2.3.8',
    summary: 'Attribute-driven encodings will layer size, color, edge width, and positioning onto the graph workbench.',
    reference: 'MVNV guidance',
  },
};

type GraphTechniquePlaceholderProps = {
  dataset: DatasetDescriptor | undefined;
  technique: Exclude<GraphTechnique, 'force'>;
  theme: D3ScatterPlotTheme;
};

export function GraphTechniquePlaceholder({
  dataset,
  technique,
  theme,
}: GraphTechniquePlaceholderProps) {
  const copy = techniqueCopy[technique];
  const hierarchyField = dataset?.schema.hierarchy?.parentField;

  return (
    <div
      className="flex h-full min-h-[640px] flex-col overflow-hidden rounded-[var(--ui-radius-panel)] border"
      style={{
        background: theme.frameBackground,
        borderColor: theme.borderColor,
        boxShadow: theme.shadow,
      }}
    >
      <div
        className="border-b px-[var(--ui-panel-padding)] py-[var(--ui-stage-padding)]"
        style={{ background: theme.headerBackground, borderColor: theme.borderColor }}
      >
        <p className="ui-studio-label font-semibold uppercase tracking-[0.26em]" style={{ color: theme.textSecondary }}>
          Graph workbench
        </p>
        <p
          className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem]"
          style={{ color: theme.textPrimary }}
        >
          {technique[0].toUpperCase()}
          {technique.slice(1)} technique scaffold
        </p>
        <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
          {copy.summary}
        </p>
      </div>

      <div className="grid flex-1 gap-5 p-[var(--ui-panel-padding)]">
        <div className="flex flex-wrap gap-2">
          <Badge>{copy.milestone}</Badge>
          <Badge variant="secondary">{dataset?.title ?? 'Loading dataset'}</Badge>
          <Badge variant="secondary">{copy.reference}</Badge>
        </div>

        <div className="ui-studio-surface grid gap-3 border p-5 shadow-sm shadow-slate-950/5">
          <p className="ui-studio-label font-semibold uppercase tracking-[0.22em]">Foundation status</p>
          <p className="ui-studio-body">
            The workbench state, URL routing, dataset switching, and normalized graph contract are active now. This center
            panel is reserved for the concrete {technique} renderer in the next v2.3.x patch.
          </p>
        </div>

        <Separator className="ui-studio-divider" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="ui-studio-surface grid gap-3 border p-5 shadow-sm shadow-slate-950/5">
            <p className="ui-studio-label font-semibold uppercase tracking-[0.22em]">Dataset readiness</p>
            <p className="ui-studio-body">
              Kind: {dataset?.kind ?? 'graph'}{dataset?.schema.hierarchy ? ' with hierarchy metadata' : ''}
            </p>
            <p className="ui-studio-body">
              Entity rows: {dataset?.schema.rowCount ?? 0}
            </p>
            <p className="ui-studio-body">
              Hierarchy field: {hierarchyField ?? 'not required for this dataset'}
            </p>
          </div>

          <div className="ui-studio-surface grid gap-3 border p-5 shadow-sm shadow-slate-950/5">
            <p className="ui-studio-label font-semibold uppercase tracking-[0.22em]">Interaction contract</p>
            <p className="ui-studio-body">Technique and dataset are URL-backed for reload-safe deep linking.</p>
            <p className="ui-studio-body">Selections stay in the shared graph canvas state for future cross-technique reuse.</p>
            <p className="ui-studio-body">Local and remote graph query paths already share one normalized result shape.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
