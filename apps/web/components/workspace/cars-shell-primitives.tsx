'use client';

import { Button, cn } from '@va/ui';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, KeyboardEvent } from 'react';

export type ConsoleStatusTone = 'accent' | 'neutral' | 'warning' | 'error';

type SectionHeaderProps = {
  detail: string;
  icon: LucideIcon;
  title: string;
};

type MetricReadoutProps = {
  label: string;
  tone?: 'accent' | 'neutral';
  value: string;
};

type RangeFieldProps = {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
  valueLabel: string;
};

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  notation: 'compact',
});

export function formatMetric(value: number, suffix: string) {
  if (!Number.isFinite(value) || value === 0) {
    return `0 ${suffix}`;
  }

  return `${value.toFixed(1)} ${suffix}`;
}

export function formatCompactNumber(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return '0';
  }

  if (Math.abs(value) >= 1_000) {
    return COMPACT_NUMBER_FORMATTER.format(value);
  }

  return value.toFixed(0);
}

export function getStatusStyle(tone: ConsoleStatusTone): CSSProperties {
  switch (tone) {
    case 'accent':
      return {
        background: 'color-mix(in srgb, white 54%, var(--ui-accent-soft) 46%)',
        borderColor: 'var(--ui-accent-border)',
        color: 'var(--ui-accent-text)',
      };
    case 'warning':
      return {
        background: '#fff7db',
        borderColor: '#f2d489',
        color: '#8a5b12',
      };
    case 'error':
      return {
        background: '#ffe7eb',
        borderColor: '#f3b4c1',
        color: '#a43352',
      };
    default:
      return {
        background: 'color-mix(in srgb, white 78%, var(--ui-panel-background) 22%)',
        borderColor: 'var(--ui-border)',
        color: 'var(--ui-text-secondary)',
      };
  }
}

export function handleSelectableRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  onSelect: () => void,
) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onSelect();
  }
}

export function SectionHeader({ detail, icon: Icon, title }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">{title}</p>
        <p className="ui-studio-body mt-2">{detail}</p>
      </div>
      <div className="ui-studio-icon-chip rounded-xl border p-2.5 shadow-sm shadow-slate-950/5">
        <Icon className="size-4" />
      </div>
    </div>
  );
}

export function MetricReadout({ label, tone = 'neutral', value }: MetricReadoutProps) {
  return (
    <div
      className={cn(
        'grid gap-1 border px-3 py-3',
        tone === 'accent' ? 'ui-studio-surface-muted' : 'ui-studio-surface',
      )}
    >
      <p className="ui-studio-label font-semibold uppercase tracking-[0.22em]">{label}</p>
      <p className="ui-studio-metric-value font-[family-name:var(--font-display)] leading-none">{value}</p>
    </div>
  );
}

export function RangeField({
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}: RangeFieldProps) {
  return (
    <label className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="ui-studio-label font-semibold uppercase tracking-[0.2em]">{label}</span>
        <span className="text-sm font-medium text-[var(--ui-text-primary)]">{valueLabel}</span>
      </div>
      <input
        className="w-full"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

type StatusPillProps = {
  label: string;
  tone: ConsoleStatusTone;
};

export function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <div
      aria-live="polite"
      className="ui-studio-status inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1 font-medium"
      style={getStatusStyle(tone)}
    >
      <span
        className={cn(
          'size-2 rounded-full',
          tone === 'warning'
            ? 'animate-pulse bg-amber-500'
            : tone === 'error'
              ? 'bg-rose-500'
              : tone === 'accent'
                ? 'bg-cyan-600'
                : 'bg-slate-400',
        )}
      />
      {label}
    </div>
  );
}
