'use client';

import { AlertCircle, ArrowRight } from 'lucide-react';

import { EnergySankeyShell } from '@/components/workspace/energy-sankey-shell';
import { GraphSingleViewShell } from '@/components/workspace/graph-single-view-shell';
import { PenguinsSplomShell } from '@/components/workspace/penguins-splom-shell';
import { StarterWorkbenchShell } from '@/components/workspace/starter-workbench-shell';
import { StocksFocusContextShell } from '@/components/workspace/stocks-focus-context-shell';
import { Button } from '@va/ui';
import Link from 'next/link';

type VisualizationExampleRouterProps = {
  exampleId: string;
};

export function VisualizationExampleRouter({ exampleId }: VisualizationExampleRouterProps) {
  if (exampleId === 'graph-force') {
    return (
      <StarterWorkbenchShell
        initialDatasetId="miserables"
        initialKind="graph"
        initialVariantId="force"
        visualizationId={exampleId}
      />
    );
  }

  if (exampleId === 'graph-matrix') {
    return (
      <StarterWorkbenchShell
        initialDatasetId="miserables"
        initialKind="graph"
        initialVariantId="matrix"
        visualizationId={exampleId}
      />
    );
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
    return (
      <StarterWorkbenchShell
        initialDatasetId="flare"
        initialKind="graph"
        initialVariantId="hierarchy"
        visualizationId={exampleId}
      />
    );
  }

  if (exampleId === 'cars-scatter') {
    return (
      <StarterWorkbenchShell
        initialDatasetId="cars"
        initialKind="tabular"
        initialVariantId="scatter"
        visualizationId={exampleId}
      />
    );
  }

  if (exampleId === 'penguins-splom') {
    return <PenguinsSplomShell visualizationId={exampleId} />;
  }

  if (exampleId === 'energy-sankey') {
    return <EnergySankeyShell visualizationId={exampleId} />;
  }

  if (exampleId === 'stocks-focus-context') {
    return <StocksFocusContextShell visualizationId={exampleId} />;
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
