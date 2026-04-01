'use client';

import type { VisualizationControlSpec, VisualizationControlValue } from '@va/view-system';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
} from '@va/ui';

type VisualizationControlStripProps = {
  buttonPreset: string;
  onValueChange: (controlId: string, value: VisualizationControlValue) => void;
  specs: VisualizationControlSpec[];
  values: Record<string, VisualizationControlValue>;
};

function asStringArray(value: VisualizationControlValue): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function asStringValue(value: VisualizationControlValue): string {
  return typeof value === 'string' ? value : '';
}

export function VisualizationControlStrip({
  buttonPreset,
  onValueChange,
  specs,
  values,
}: VisualizationControlStripProps) {
  if (specs.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {specs.map((spec) => (
        <div className="grid gap-2" key={spec.id}>
          <div className="flex items-center justify-between gap-3">
            <p className="ui-studio-label font-semibold uppercase tracking-[0.18em]">{spec.label}</p>
            {spec.description ? <span className="text-[10px] text-[var(--ui-text-muted)]">{spec.description}</span> : null}
          </div>

          {spec.type === 'select' ? (
            <Select onValueChange={(value) => onValueChange(spec.id, value)} value={asStringValue(values[spec.id])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={spec.label} />
              </SelectTrigger>
              <SelectContent>
                {spec.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : spec.type === 'toggle-group' ? (
            <ToggleGroup
              className="flex flex-wrap gap-2"
              onValueChange={(value) => onValueChange(spec.id, value)}
              type="multiple"
              value={asStringArray(values[spec.id])}
            >
              {spec.options?.map((option) => (
                <ToggleGroupItem
                  className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                  data-button-style={buttonPreset}
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : (
            <ToggleGroup
              className="flex flex-wrap gap-2"
              onValueChange={(value) => {
                if (value) {
                  onValueChange(spec.id, value);
                }
              }}
              type="single"
              value={asStringValue(values[spec.id])}
            >
              {spec.options?.map((option) => (
                <ToggleGroupItem
                  className="px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                  data-button-style={buttonPreset}
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>
      ))}
    </div>
  );
}
