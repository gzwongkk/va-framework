'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  Database,
  LayoutGrid,
  Network,
  Shapes,
  Waves,
} from 'lucide-react';

import { getVisualizationExamplesByCategory } from '@/lib/visualization-catalog';
import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@va/ui';

const CATEGORY_META = {
  flow: { icon: Waves, label: 'Flow' },
  graph: { icon: Network, label: 'Graph' },
  hierarchy: { icon: Boxes, label: 'Hierarchy' },
  multivariate: { icon: Shapes, label: 'Multivariate' },
  tabular: { icon: Database, label: 'Tabular' },
  'time-series': { icon: ChartNoAxesCombined, label: 'Time series' },
} as const;

type VisualizationCommandDialogProps = {
  buttonPreset: string;
};

export function VisualizationCommandDialog({
  buttonPreset,
}: VisualizationCommandDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const groupedExamples = useMemo(
    () => getVisualizationExamplesByCategory().filter((group) => group.examples.length > 0),
    [],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        className="ui-studio-toggle gap-2 px-3"
        data-button-style={buttonPreset}
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        <LayoutGrid className="size-4" />
        Open Example
      </Button>

      <CommandDialog onOpenChange={setOpen} open={open}>
        <Command className="border-0">
          <CommandInput placeholder="Search the gallery or jump to a registered example..." />
          <CommandList>
            <CommandEmpty>No registered example matches the current search.</CommandEmpty>
            {groupedExamples.map(({ category, examples }, groupIndex) => {
              const meta = CATEGORY_META[category];
              const Icon = meta.icon;

              return (
                <div key={category}>
                  <CommandGroup heading={meta.label}>
                    {examples.map((example) => (
                      <CommandItem
                        key={example.id}
                        keywords={[example.category, ...example.datasetIds]}
                        onSelect={() => {
                          setOpen(false);
                          router.push(example.routePath);
                        }}
                        value={`${example.title} ${example.summary} ${example.datasetIds.join(' ')}`}
                      >
                        <Icon className="size-4 text-[var(--ui-text-muted)]" />
                        <div className="grid gap-0.5">
                          <span className="font-medium text-[var(--ui-text-primary)]">{example.title}</span>
                          <span className="text-xs text-[var(--ui-text-secondary)]">{example.summary}</span>
                        </div>
                        <CommandShortcut>{example.datasetIds.join(', ')}</CommandShortcut>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {groupIndex < groupedExamples.length - 1 ? <CommandSeparator /> : null}
                </div>
              );
            })}
          </CommandList>
          <div className="flex items-center justify-between border-t border-[var(--ui-border)] px-3 py-2 text-xs text-[var(--ui-text-secondary)]">
            <span>Jump between gallery examples without leaving the current shell.</span>
            <Button
              asChild
              className="h-8 gap-2 px-3"
              data-button-style={buttonPreset}
              type="button"
              variant="secondary"
            >
              <a href="/gallery">
                Browse gallery
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
