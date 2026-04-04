'use client';

import type { DatasetDescriptor, ExecutionMode } from '@va/contracts';
import type { StarterVariantDefinition } from '@va/view-system';
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  ToggleGroup,
  ToggleGroupItem,
} from '@va/ui';
import { Cpu, Layers3, Shapes } from 'lucide-react';

import { SectionHeader } from '@/components/workspace/cars-shell-primitives';
import type { SupportedStarterKind } from '@/lib/starter-workbench';

type StarterWorkbenchControlsProps = {
  activeDatasetId: string;
  activeKind: SupportedStarterKind;
  activeVariantId: string;
  availableDatasets: DatasetDescriptor[];
  availableVariants: StarterVariantDefinition[];
  buttonPreset: string;
  children?: React.ReactNode;
  onDatasetChange: (datasetId: string) => void;
  onKindChange: (kind: SupportedStarterKind) => void;
  onRuntimeChange: (executionMode: ExecutionMode) => void;
  onVariantChange: (variantId: string) => void;
  runtime: ExecutionMode;
};

const EXECUTION_MODES = ['local', 'remote'] as const;

export function StarterWorkbenchControls({
  activeDatasetId,
  activeKind,
  activeVariantId,
  availableDatasets,
  availableVariants,
  buttonPreset,
  children,
  onDatasetChange,
  onKindChange,
  onRuntimeChange,
  onVariantChange,
  runtime,
}: StarterWorkbenchControlsProps) {
  return (
    <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
      <div className="grid gap-4">
        <SectionHeader
          detail="Choose a first-class data kind, bind a starter dataset, and switch the active starter variant without leaving the shared shell."
          icon={Layers3}
          title="Starter configuration"
        />

        <div className="grid gap-3">
          <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Data kind</p>
          <ToggleGroup
            className="grid w-full grid-cols-2 gap-2"
            onValueChange={(value) => {
              if (value === 'tabular' || value === 'graph') {
                onKindChange(value);
              }
            }}
            type="single"
            value={activeKind}
          >
            <ToggleGroupItem className="w-full text-xs font-semibold uppercase tracking-[0.18em]" data-button-style={buttonPreset} value="tabular">
              Tabular
            </ToggleGroupItem>
            <ToggleGroupItem className="w-full text-xs font-semibold uppercase tracking-[0.18em]" data-button-style={buttonPreset} value="graph">
              Graph
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid gap-3">
          <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Dataset</p>
          <Select onValueChange={onDatasetChange} value={activeDatasetId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose dataset" />
            </SelectTrigger>
            <SelectContent>
              {availableDatasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  {dataset.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {availableDatasets.map((dataset) => (
              <Badge key={dataset.id} variant={dataset.id === activeDatasetId ? 'secondary' : 'outline'}>
                {dataset.starter?.priority ?? 'starter'}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Variant</p>
          <ToggleGroup
            className="flex flex-wrap gap-2"
            onValueChange={(value) => {
              if (value) {
                onVariantChange(value);
              }
            }}
            type="single"
            value={activeVariantId}
          >
            {availableVariants.map((variant) => (
              <ToggleGroupItem
                className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                data-button-style={buttonPreset}
                key={variant.id}
                value={variant.id}
              >
                {variant.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <Separator className="ui-studio-divider" />

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Runtime</p>
          <Cpu className="size-4 text-[var(--ui-text-muted)]" />
        </div>
        <ToggleGroup
          className="grid w-full grid-cols-2 gap-2"
          onValueChange={(value) => {
            if (value === 'local' || value === 'remote') {
              onRuntimeChange(value);
            }
          }}
          type="single"
          value={runtime}
        >
          {EXECUTION_MODES.map((mode) => (
            <ToggleGroupItem
              className="w-full text-xs font-semibold uppercase tracking-[0.18em]"
              data-button-style={buttonPreset}
              key={mode}
              value={mode}
            >
              {mode}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
        <div className="flex items-center justify-between gap-3">
          <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Starter model</p>
          <Shapes className="size-4 text-[var(--ui-text-muted)]" />
        </div>
        <p className="ui-studio-body">
          One main canvas is active in this revision, but the shell already carries multi-view-ready
          dataset bindings and coordination channels for later expansion.
        </p>
      </div>

      {children}
    </div>
  );
}
