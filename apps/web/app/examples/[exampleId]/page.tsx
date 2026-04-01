import { notFound } from 'next/navigation';

import { VisualizationExampleRouter } from '@/components/workspace/visualization-example-router';
import { getVisualizationExample } from '@/lib/visualization-catalog';

export default async function VisualizationExamplePage({
  params,
}: {
  params: Promise<{ exampleId: string }>;
}) {
  const { exampleId } = await params;
  if (!getVisualizationExample(exampleId)) {
    notFound();
  }

  return <VisualizationExampleRouter exampleId={exampleId} />;
}
