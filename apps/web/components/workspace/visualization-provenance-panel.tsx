'use client';

import { useMemo } from 'react';

import { useDatasetCatalog } from '@/lib/data/query-hooks';
import { getVisualizationExample } from '@/lib/visualization-catalog';
import { Badge } from '@va/ui';

type VisualizationProvenancePanelProps = {
  activeDatasetId?: string;
  exampleId: string;
};

export function VisualizationProvenancePanel({
  activeDatasetId,
  exampleId,
}: VisualizationProvenancePanelProps) {
  const datasetCatalog = useDatasetCatalog();
  const example = getVisualizationExample(exampleId);

  const datasets = useMemo(() => {
    if (!example) {
      return [];
    }

    const orderedIds = activeDatasetId
      ? [activeDatasetId, ...example.datasetIds.filter((datasetId) => datasetId !== activeDatasetId)]
      : example.datasetIds;

    return orderedIds
      .map((datasetId) => datasetCatalog.data?.find((dataset) => dataset.id === datasetId))
      .filter((dataset): dataset is NonNullable<typeof dataset> => Boolean(dataset));
  }, [activeDatasetId, datasetCatalog.data, example]);

  if (!example) {
    return null;
  }

  return (
    <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
      <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Provenance</p>

      <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Example source</Badge>
          <a
            className="font-medium text-[var(--ui-text-primary)] underline decoration-[var(--ui-border)] underline-offset-4"
            href={example.provenanceUrl}
            rel="noreferrer"
            target="_blank"
          >
            {example.provenanceLabel}
          </a>
        </div>
        <p className="ui-studio-body">{example.summary}</p>
      </div>

      {datasets.map((dataset) => (
        <div className="grid gap-2 border-t border-[var(--ui-border)] pt-3 text-sm text-[var(--ui-text-secondary)]" key={dataset.id}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{dataset.id}</Badge>
            <Badge variant="outline">{dataset.category ?? dataset.kind}</Badge>
          </div>
          <div className="grid gap-1">
            <span className="font-medium text-[var(--ui-text-primary)]">{dataset.provenance.name}</span>
            <a
              className="truncate underline decoration-[var(--ui-border)] underline-offset-4"
              href={dataset.provenance.url}
              rel="noreferrer"
              target="_blank"
            >
              {dataset.provenance.url}
            </a>
          </div>
          <p className="ui-studio-body">
            {dataset.provenance.notes ?? dataset.previewSummary ?? dataset.description}
          </p>
        </div>
      ))}
    </div>
  );
}
