'use client';

import { AlertCircle, ArrowRight } from 'lucide-react';

import { CarsSingleViewShell } from '@/components/workspace/cars-single-view-shell';
import { GraphSingleViewShell } from '@/components/workspace/graph-single-view-shell';
import { VisualizationPendingShell } from '@/components/workspace/visualization-pending-shell';
import { Button } from '@va/ui';
import Link from 'next/link';

type VisualizationExampleRouterProps = {
  exampleId: string;
};

export function VisualizationExampleRouter({ exampleId }: VisualizationExampleRouterProps) {
  if (exampleId === 'graph-force') {
    return <GraphSingleViewShell initialDatasetId="miserables" initialTechnique="force" visualizationId={exampleId} />;
  }

  if (exampleId === 'graph-matrix') {
    return <GraphSingleViewShell initialDatasetId="miserables" initialTechnique="matrix" visualizationId={exampleId} />;
  }

  if (exampleId === 'graph-multivariate') {
    return (
      <GraphSingleViewShell
        initialDatasetId="miserables"
        initialTechnique="multivariate"
        visualizationId={exampleId}
      />
    );
  }

  if (exampleId === 'hierarchy-suite') {
    return <GraphSingleViewShell initialDatasetId="flare" initialTechnique="tree" visualizationId={exampleId} />;
  }

  if (exampleId === 'cars-scatter') {
    return <CarsSingleViewShell visualizationId={exampleId} />;
  }

  if (exampleId === 'penguins-splom') {
    return (
      <VisualizationPendingShell
        description="The normalized penguins dataset is registered and ready. The native brushable scatterplot matrix lands in the next gallery patch."
        releaseLabel="Coming in v2.3.14"
        title="Brushable scatterplot matrix"
      />
    );
  }

  if (exampleId === 'energy-sankey') {
    return (
      <VisualizationPendingShell
        description="The energy flow network is now in the shared registry. The Sankey renderer lands in the flow-specific patch immediately after the SPLOM."
        releaseLabel="Coming in v2.3.15"
        title="Energy Sankey diagram"
      />
    );
  }

  if (exampleId === 'stocks-focus-context') {
    return (
      <VisualizationPendingShell
        description="The stocks time-series pack is registered and ready. The focus-plus-context time-series workbench lands later in the gallery line."
        releaseLabel="Coming in v2.3.17"
        title="Focus + context time series"
      />
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-5 rounded-[var(--ui-radius-shell)] border ui-studio-shell p-10 text-center">
        <div className="ui-studio-icon-chip rounded-[var(--ui-radius-control)] border p-3">
          <AlertCircle className="size-5" />
        </div>
        <div className="grid gap-2">
          <h1 className="ui-studio-shell-title font-[family-name:var(--font-display)]">Visualization not available</h1>
          <p className="ui-studio-body">
            The requested example id is not registered in the current gallery line.
          </p>
        </div>
        <Button asChild className="gap-2" variant="outline">
          <Link href="/gallery">
            Open gallery
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </main>
  );
}
