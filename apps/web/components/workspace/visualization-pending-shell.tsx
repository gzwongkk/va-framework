'use client';

import Link from 'next/link';
import { ArrowRight, Clock3 } from 'lucide-react';

import { Button } from '@va/ui';

type VisualizationPendingShellProps = {
  description: string;
  releaseLabel: string;
  title: string;
};

export function VisualizationPendingShell({
  description,
  releaseLabel,
  title,
}: VisualizationPendingShellProps) {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-5 rounded-[var(--ui-radius-shell)] border ui-studio-shell p-10 text-center">
        <div className="ui-studio-icon-chip rounded-[var(--ui-radius-control)] border p-3">
          <Clock3 className="size-5" />
        </div>
        <div className="grid gap-2">
          <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">{releaseLabel}</p>
          <h1 className="ui-studio-shell-title font-[family-name:var(--font-display)]">{title}</h1>
          <p className="ui-studio-body">{description}</p>
        </div>
        <Button asChild className="gap-2" variant="outline">
          <Link href="/gallery">
            Back to gallery
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </main>
  );
}
