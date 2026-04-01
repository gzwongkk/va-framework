'use client';

import { WorkspaceRouteNav } from '@/components/workspace/workspace-route-nav';
import { VisualizationCommandDialog } from '@/components/workspace/visualization-command-dialog';

type WorkspaceActionBarProps = {
  buttonPreset: string;
};

export function WorkspaceActionBar({ buttonPreset }: WorkspaceActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <WorkspaceRouteNav buttonPreset={buttonPreset} />
      <VisualizationCommandDialog buttonPreset={buttonPreset} />
    </div>
  );
}
