import { Suspense } from 'react';

import { StarterWorkbenchShell } from '@/components/workspace/starter-workbench-shell';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <StarterWorkbenchShell initialDatasetId="cars" initialKind="tabular" initialVariantId="scatter" />
    </Suspense>
  );
}
