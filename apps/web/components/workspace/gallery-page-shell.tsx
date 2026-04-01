'use client';

import Link from 'next/link';
import { ArrowRight, Boxes, Database, Network, Shapes, Waves } from 'lucide-react';

import { WorkspaceRouteNav } from '@/components/workspace/workspace-route-nav';
import { getVisualizationExamplesByCategory } from '@/lib/visualization-catalog';
import { useUiStudioStore } from '@/lib/ui-studio-store';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@va/ui';

const CATEGORY_META = {
  flow: { icon: Waves, label: 'Flow' },
  graph: { icon: Network, label: 'Graph' },
  hierarchy: { icon: Boxes, label: 'Hierarchy' },
  multivariate: { icon: Shapes, label: 'Multivariate' },
  tabular: { icon: Database, label: 'Tabular' },
  'time-series': { icon: Waves, label: 'Time series' },
} as const;

export function GalleryPageShell() {
  const buttonPreset = useUiStudioStore((state) => state.prefs.buttonPreset);
  const groupedExamples = getVisualizationExamplesByCategory().filter((group) => group.examples.length > 0);

  return (
    <main className="min-h-screen px-5 py-6 lg:px-8">
      <section className="mx-auto flex max-w-[1680px] flex-col gap-5">
        <header className="ui-studio-shell flex flex-col gap-4 border p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-2">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.22em]">Example gallery</p>
              <h1 className="ui-studio-shell-title font-[family-name:var(--font-display)]">
                Registry-driven analytics gallery
              </h1>
              <p className="ui-studio-body max-w-3xl">
                Browse the current visualization line, open examples in the workbench shell, and use the
                same routing model that will later host imported SPLOM, Sankey, hierarchy, and time-series
                examples.
              </p>
            </div>
            <WorkspaceRouteNav buttonPreset={buttonPreset} />
          </div>
        </header>

        {groupedExamples.map(({ category, examples }) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;

          return (
            <section className="grid gap-3" key={category}>
              <div className="flex items-center gap-3">
                <div className="ui-studio-icon-chip rounded-[var(--ui-radius-control)] border p-2.5">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="ui-studio-label font-semibold uppercase tracking-[0.2em]">{meta.label}</p>
                  <p className="ui-studio-body">Registered examples in the {meta.label.toLowerCase()} line.</p>
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {examples.map((example) => (
                  <Card className="ui-studio-surface border" key={example.id}>
                    <CardHeader className="gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid gap-2">
                          <p className="ui-studio-label font-semibold uppercase tracking-[0.22em]">
                            {example.category}
                          </p>
                          <CardTitle className="font-[family-name:var(--font-display)] text-[1.32rem]">
                            {example.title}
                          </CardTitle>
                        </div>
                        <span className="rounded-[var(--ui-radius-pill)] border px-2.5 py-1 text-xs font-medium text-[var(--ui-text-secondary)]">
                          {example.datasetIds.join(', ')}
                        </span>
                      </div>
                      <CardDescription className="ui-studio-body">{example.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid gap-1 text-sm text-[var(--ui-text-secondary)]">
                        <span className="font-medium text-[var(--ui-text-primary)]">{example.provenanceLabel}</span>
                        <a
                          className="truncate underline decoration-[var(--ui-border)] underline-offset-4"
                          href={example.provenanceUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {example.provenanceUrl}
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild className="gap-2">
                          <Link href={example.routePath}>
                            Open example
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}
