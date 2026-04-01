import { Suspense } from 'react';

import { GraphSingleViewShell } from '@/components/workspace/graph-single-view-shell';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <GraphSingleViewShell />
    </Suspense>
  );
}
