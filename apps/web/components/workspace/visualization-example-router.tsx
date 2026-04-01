'use client';

import { AlertCircle, ArrowRight } from 'lucide-react';

import { CarsSingleViewShell } from '@/components/workspace/cars-single-view-shell';
import { GraphSingleViewShell } from '@/components/workspace/graph-single-view-shell';
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
