import { Suspense } from 'react';

import { StarterWorkbenchShell } from '@/components/workspace/starter-workbench-shell';

export default function CarsPage() {
  return (
    <Suspense fallback={null}>
      <StarterWorkbenchShell
        initialDatasetId="cars"
        initialKind="tabular"
        initialVariantId="scatter"
        visualizationId="cars-scatter"
      />
    </Suspense>
  );
}
