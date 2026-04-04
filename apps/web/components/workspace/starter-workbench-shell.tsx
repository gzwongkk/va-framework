'use client';

import type { DataKindAdapterId } from '@va/contracts';
import { Badge } from '@va/ui';
import { Boxes, LayoutTemplate } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type CSSProperties, startTransition, useEffect, useMemo } from 'react';

import { SectionHeader } from '@/components/workspace/cars-shell-primitives';
import { StarterGraphPanels } from '@/components/workspace/starter-graph-panels';
import { StarterTabularPanels } from '@/components/workspace/starter-tabular-panels';
import { UiStudioDrawer } from '@/components/workspace/ui-studio-drawer';
import { WorkspaceActionBar } from '@/components/workspace/workspace-action-bar';
import { useCoordinationStore } from '@/lib/coordination-store';
import { useDatasetCatalog } from '@/lib/data/query-hooks';
import {
  buildStarterSearchParams,
  getStarterVisualizationId,
  isSupportedStarterKind,
  resolveStarterDataset,
  resolveStarterVariant,
  starterAdapters,
  type SupportedStarterKind,
} from '@/lib/starter-workbench';
import { resolveChartTheme, resolveUiStudioVars } from '@/lib/ui-studio';
import { useUiStudioStore } from '@/lib/ui-studio-store';
import { singleMainCanvasLayout } from '@va/view-system';

const SHOW_UI_STUDIO = process.env.NODE_ENV !== 'production';

type StarterWorkbenchShellProps = {
  initialDatasetId?: string;
  initialKind?: SupportedStarterKind;
  initialVariantId?: string;
  visualizationId?: string;
};

export function StarterWorkbenchShell({
  initialDatasetId,
  initialKind = 'tabular',
  initialVariantId,
  visualizationId,
}: StarterWorkbenchShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const datasetCatalog = useDatasetCatalog();
  const uiPrefs = useUiStudioStore((state) => state.prefs);
  const uiCssVars = useMemo(() => resolveUiStudioVars(uiPrefs), [uiPrefs]);
  const chartTheme = useMemo(() => resolveChartTheme(uiPrefs), [uiPrefs]);

  const persistedKind = useCoordinationStore((state) => state.activeStarterKind);
  const persistedDatasetId = useCoordinationStore((state) => state.activeDatasetId);
  const persistedVariant = useCoordinationStore((state) => state.activeStarterVariant);
  const setActiveLayoutId = useCoordinationStore((state) => state.setActiveLayoutId);
  const setActiveStarterKind = useCoordinationStore((state) => state.setActiveStarterKind);
  const setActiveStarterVariant = useCoordinationStore((state) => state.setActiveStarterVariant);
  const setActiveVisualizationId = useCoordinationStore((state) => state.setActiveVisualizationId);
  const setDatasetBinding = useCoordinationStore((state) => state.setDatasetBinding);
  const setViewInstance = useCoordinationStore((state) => state.setViewInstance);

  const requestedKind = searchParams.get('kind');
  const requestedDatasetId = searchParams.get('dataset');
  const requestedVariantId = searchParams.get('variant');
  const resolvedKind = isSupportedStarterKind(requestedKind)
    ? requestedKind
    : isSupportedStarterKind(persistedKind)
      ? persistedKind
      : initialKind;
  const resolvedDataset = resolveStarterDataset(
    datasetCatalog.data,
    resolvedKind,
    requestedDatasetId ?? initialDatasetId ?? persistedDatasetId,
  );
  const activeKind = (resolvedDataset?.starter?.kindAdapterId ?? resolvedKind) as SupportedStarterKind;
  const resolvedVariant = resolveStarterVariant(
    resolvedDataset,
    requestedVariantId ?? initialVariantId ?? persistedVariant ?? undefined,
  );
  const activeExampleId =
    visualizationId ??
    (resolvedDataset && resolvedVariant
      ? getStarterVisualizationId(activeKind, resolvedDataset.id, resolvedVariant.id)
      : undefined) ??
    starterAdapters[activeKind].id;
  const availableDatasets = useMemo(
    () =>
      (datasetCatalog.data ?? []).filter(
        (dataset) =>
          dataset.starter?.kindAdapterId === activeKind && dataset.starter.priority !== 'seed',
      ),
    [activeKind, datasetCatalog.data],
  );
  const availableVariants = useMemo(
    () =>
      resolvedDataset?.starter?.supportedVariants
        .map((variantId) => resolveStarterVariant(resolvedDataset, variantId))
        .filter((variant): variant is NonNullable<typeof variant> => Boolean(variant)) ?? [],
    [resolvedDataset],
  );

  useEffect(() => {
    if (!resolvedDataset || !resolvedVariant) {
      return;
    }

    const nextQuery = buildStarterSearchParams(activeKind, resolvedDataset.id, resolvedVariant.id);
    if (searchParams.toString() !== nextQuery) {
      startTransition(() => {
        router.replace(`${pathname}?${nextQuery}`, { scroll: false });
      });
    }
  }, [activeKind, pathname, resolvedDataset, resolvedVariant, router, searchParams]);

  useEffect(() => {
    if (!resolvedDataset || !resolvedVariant) {
      return;
    }

    const viewInstanceId = activeKind === 'graph' ? 'starter-graph' : 'starter-tabular';
    const viewId = activeKind === 'graph' ? 'graph-canvas' : 'single-view-plot';
    const bindingId = `${viewInstanceId}-binding`;

    setActiveLayoutId(singleMainCanvasLayout.id);
    setActiveStarterKind(activeKind);
    setActiveStarterVariant(resolvedVariant.id);
    setActiveVisualizationId(activeExampleId);
    setViewInstance({
      id: viewInstanceId,
      label: `${starterAdapters[activeKind].label} primary`,
      role: 'primary',
      viewId,
    });
    setDatasetBinding({
      id: bindingId,
      datasetId: resolvedDataset.id,
      kindAdapterId: activeKind as DataKindAdapterId,
      viewInstanceIds: [viewInstanceId],
      isPrimary: true,
    });
  }, [
    activeExampleId,
    activeKind,
    resolvedDataset,
    resolvedVariant,
    setActiveLayoutId,
    setActiveStarterKind,
    setActiveStarterVariant,
    setActiveVisualizationId,
    setDatasetBinding,
    setViewInstance,
  ]);

  const updateStarter = (next: Partial<{ datasetId: string; kind: SupportedStarterKind; variantId: string }>) => {
    if (!resolvedDataset || !resolvedVariant) {
      return;
    }

    const kind = next.kind ?? activeKind;
    const datasetId = next.datasetId ?? resolvedDataset.id;
    const variantId = next.variantId ?? resolvedVariant.id;
    startTransition(() => {
      router.replace(`${pathname}?${buildStarterSearchParams(kind, datasetId, variantId)}`, { scroll: false });
    });
  };

  if (!resolvedDataset || !resolvedVariant) {
    return null;
  }

  return (
    <main
      className="min-h-screen xl:flex xl:items-center xl:justify-center xl:overflow-hidden"
      data-ui-button={uiPrefs.buttonPreset}
      data-ui-density={uiPrefs.densityPreset}
      data-ui-radius={uiPrefs.radiusPreset}
      data-ui-shell={uiPrefs.shellPreset}
      data-ui-theme={uiPrefs.themePreset}
      style={
        {
          ...uiCssVars,
          background: 'var(--ui-page-background)',
          color: 'var(--ui-text-primary)',
        } as CSSProperties
      }
    >
      <div className="mx-auto flex min-h-screen w-full items-center justify-center px-3 py-3 sm:px-4 lg:px-5 xl:min-h-0 xl:px-6 xl:py-5">
        <div className="ui-studio-shell grid min-h-[760px] w-full overflow-hidden border xl:h-[min(calc(100vh-2.5rem),var(--ui-shell-target-height))] xl:w-[min(calc(100vw-3rem),var(--ui-shell-target-width))] xl:grid-cols-[var(--ui-shell-left-rail)_minmax(0,1fr)_var(--ui-shell-right-rail)] xl:grid-rows-[auto_minmax(0,1fr)]">
          <header className="ui-studio-header col-span-full flex flex-wrap items-start justify-between gap-4 border-b">
            <div className="grid gap-2">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.28em]">va-framework / starter workbench</p>
              <h1 className="ui-studio-shell-title font-[family-name:var(--font-display)] leading-none">
                Unified Visual Analytics Starter
              </h1>
              <p className="ui-studio-body max-w-3xl">
                Start with a first-class data kind, pick a starter dataset, and adapt the same shell to a new
                visual analytics system without jumping between unrelated demos.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <WorkspaceActionBar buttonPreset={uiPrefs.buttonPreset} />
              <Badge>{activeKind}</Badge>
              <Badge>{resolvedDataset.id}</Badge>
              <Badge>{resolvedVariant.id}</Badge>
              {SHOW_UI_STUDIO ? <UiStudioDrawer buttonPreset={uiPrefs.buttonPreset} /> : null}
            </div>
          </header>

          <section className="col-span-full border-b p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <SectionHeader
                detail={`${starterAdapters[activeKind].summary} The current starter is bound to ${resolvedDataset.title} with the ${resolvedVariant.label} variant.`}
                icon={LayoutTemplate}
                title="Starter context"
              />
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">{starterAdapters[activeKind].label}</Badge>
                <Badge>{resolvedDataset.title}</Badge>
                <Badge>{resolvedVariant.label}</Badge>
                <Badge>{availableDatasets.length} starter datasets</Badge>
              </div>
            </div>
          </section>

          {activeKind === 'graph' ? (
            <StarterGraphPanels
              availableDatasets={availableDatasets}
              availableVariants={availableVariants}
              buttonPreset={uiPrefs.buttonPreset}
              chartTheme={chartTheme}
              dataset={resolvedDataset}
              key={`graph:${resolvedDataset.id}:${resolvedVariant.id}`}
              onDatasetChange={(datasetId) => updateStarter({ datasetId })}
              onKindChange={(kind) => updateStarter({ kind, datasetId: starterAdapters[kind].defaultDatasetId, variantId: starterAdapters[kind].defaultVariantId })}
              onVariantChange={(variantId) => updateStarter({ variantId })}
              variantId={resolvedVariant.id as 'force' | 'matrix' | 'hierarchy' | 'flow'}
              visualizationId={activeExampleId}
            />
          ) : (
            <StarterTabularPanels
              availableDatasets={availableDatasets}
              availableVariants={availableVariants}
              buttonPreset={uiPrefs.buttonPreset}
              chartTheme={chartTheme}
              dataset={resolvedDataset}
              key={`tabular:${resolvedDataset.id}:${resolvedVariant.id}`}
              onDatasetChange={(datasetId) => updateStarter({ datasetId })}
              onKindChange={(kind) => updateStarter({ kind, datasetId: starterAdapters[kind].defaultDatasetId, variantId: starterAdapters[kind].defaultVariantId })}
              onVariantChange={(variantId) => updateStarter({ variantId })}
              variantId={resolvedVariant.id as 'scatter' | 'splom' | 'time-series' | 'table'}
              visualizationId={activeExampleId}
            />
          )}
        </div>
      </div>
    </main>
  );
}
