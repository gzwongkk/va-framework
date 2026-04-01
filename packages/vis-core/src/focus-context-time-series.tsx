import { extent, line, scaleLinear, scaleTime } from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { D3ScatterPlotTheme } from './d3-scatter-plot';

export type TimeSeriesPoint = {
  color: string;
  date: Date;
  id: string;
  symbol: string;
  value: number;
};

export type FocusContextTimeSeriesProps = {
  data: TimeSeriesPoint[];
  domain?: [number, number];
  emptyLabel?: string;
  legend?: Array<{ color: string; label: string }>;
  onDomainChange?: (domain?: [number, number]) => void;
  statusLabel?: string;
  statusTone?: 'accent' | 'neutral' | 'warning' | 'error';
  subtitle?: string;
  theme?: D3ScatterPlotTheme;
  title: string;
};

const DEFAULT_THEME: D3ScatterPlotTheme = {
  axisDomainColor: '#8fa3b4',
  axisTickColor: '#526172',
  borderColor: 'rgba(146, 164, 180, 0.46)',
  emptyBackground: 'rgba(243, 247, 250, 0.9)',
  frameBackground: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(246,250,252,0.98) 100%)',
  gridColor: '#d7e0e7',
  headerBackground: 'linear-gradient(180deg, rgba(249,251,252,0.98) 0%, rgba(244,248,250,0.95) 100%)',
  plotBackground: 'linear-gradient(180deg, rgba(251,253,254,0.98) 0%, rgba(246,250,252,0.98) 100%)',
  selectionStroke: '#102331',
  shadow: '0 20px 60px -42px rgba(15,23,42,0.45)',
  textPrimary: '#0f172a',
  textSecondary: '#526172',
};

type BrushState = {
  currentX: number;
  startX: number;
} | null;

function getStatusStyle(
  tone: FocusContextTimeSeriesProps['statusTone'],
  theme: D3ScatterPlotTheme,
) {
  switch (tone) {
    case 'accent':
      return {
        background: 'color-mix(in srgb, white 55%, var(--ui-accent-soft) 45%)',
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
        background: 'color-mix(in srgb, white 82%, var(--chart-border-color, rgba(146, 164, 180, 0.46)) 18%)',
        borderColor: theme.borderColor,
        color: theme.textSecondary,
      };
  }
}

function getNumericDomain(values: number[]) {
  const [minimum = 0, maximum = 1] = extent(values);
  if (minimum === maximum) {
    return [minimum - 1, maximum + 1] as const;
  }

  const padding = (maximum - minimum) * 0.08;
  return [minimum - padding, maximum + padding] as const;
}

function getTimeDomain(values: Date[]) {
  const [minimum, maximum] = extent(values);
  const start = minimum ?? new Date();
  const end = maximum ?? new Date(start.getTime() + 86_400_000);
  return [start, end] as const;
}

export function FocusContextTimeSeries({
  data,
  domain,
  emptyLabel = 'No time-series rows are available for the current controls.',
  legend,
  onDomainChange,
  statusLabel,
  statusTone = 'neutral',
  subtitle,
  theme = DEFAULT_THEME,
  title,
}: FocusContextTimeSeriesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(920);
  const [brush, setBrush] = useState<BrushState>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = Math.max(Math.floor(entries[0]?.contentRect.width ?? 920), 420);
      setWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const groupedSeries = useMemo(() => {
    const grouped = new Map<string, TimeSeriesPoint[]>();
    for (const point of data) {
      const current = grouped.get(point.symbol) ?? [];
      current.push(point);
      grouped.set(point.symbol, current);
    }

    return [...grouped.entries()].map(([symbol, points]) => ({
      points: [...points].sort((left, right) => left.date.getTime() - right.date.getTime()),
      symbol,
    }));
  }, [data]);

  const layout = useMemo(() => {
    const focusMargin = { top: 28, right: 28, bottom: 28, left: 64 };
    const contextMargin = { top: 500, right: 28, bottom: 34, left: 64 };
    return {
      contextHeight: 96,
      contextMargin,
      focusHeight: 412,
      focusMargin,
      height: 640,
      width,
    };
  }, [width]);

  const fullTimeDomain = useMemo(
    () => getTimeDomain(data.map((point) => point.date)),
    [data],
  );
  const focusDomain = useMemo(() => {
    if (!domain) {
      return fullTimeDomain;
    }

    return [new Date(domain[0]), new Date(domain[1])] as const;
  }, [domain, fullTimeDomain]);

  const visibleData = useMemo(() => {
    if (!domain) {
      return data;
    }

    return data.filter((point) => {
      const time = point.date.getTime();
      return time >= domain[0] && time <= domain[1];
    });
  }, [data, domain]);

  const focusYDomain = useMemo(
    () => getNumericDomain(visibleData.map((point) => point.value)),
    [visibleData],
  );
  const contextYDomain = useMemo(
    () => getNumericDomain(data.map((point) => point.value)),
    [data],
  );
  const focusXScale = useMemo(
    () =>
      scaleTime()
        .domain(focusDomain)
        .range([layout.focusMargin.left, layout.width - layout.focusMargin.right]),
    [focusDomain, layout.focusMargin.left, layout.focusMargin.right, layout.width],
  );
  const contextXScale = useMemo(
    () =>
      scaleTime()
        .domain(fullTimeDomain)
        .range([layout.contextMargin.left, layout.width - layout.contextMargin.right]),
    [fullTimeDomain, layout.contextMargin.left, layout.contextMargin.right, layout.width],
  );
  const focusYScale = useMemo(
    () =>
      scaleLinear()
        .domain(focusYDomain)
        .range([layout.focusMargin.top + layout.focusHeight, layout.focusMargin.top]),
    [focusYDomain, layout.focusHeight, layout.focusMargin.top],
  );
  const contextYScale = useMemo(
    () =>
      scaleLinear()
        .domain(contextYDomain)
        .range([layout.contextMargin.top + layout.contextHeight, layout.contextMargin.top]),
    [contextYDomain, layout.contextHeight, layout.contextMargin.top],
  );

  const focusLine = useMemo(
    () =>
      line<TimeSeriesPoint>()
        .defined((point) => Number.isFinite(point.value))
        .x((point) => focusXScale(point.date))
        .y((point) => focusYScale(point.value)),
    [focusXScale, focusYScale],
  );
  const contextLine = useMemo(
    () =>
      line<TimeSeriesPoint>()
        .defined((point) => Number.isFinite(point.value))
        .x((point) => contextXScale(point.date))
        .y((point) => contextYScale(point.value)),
    [contextXScale, contextYScale],
  );

  const activeBrushBounds = useMemo(() => {
    if (!brush) {
      return undefined;
    }

    return {
      left: Math.min(brush.startX, brush.currentX),
      right: Math.max(brush.startX, brush.currentX),
    };
  }, [brush]);

  function toSvgCoordinates(event: React.PointerEvent<SVGRectElement>) {
    const svgElement = event.currentTarget.ownerSVGElement;
    if (!svgElement) {
      return { x: 0 };
    }

    const bounds = svgElement.getBoundingClientRect();
    const scaleX = layout.width / bounds.width;
    return {
      x: (event.clientX - bounds.left) * scaleX,
    };
  }

  if (data.length === 0) {
    return (
      <div
        className="flex h-[640px] items-center justify-center rounded-[var(--ui-radius-panel)] border px-6 text-sm"
        style={{ background: theme.emptyBackground, borderColor: theme.borderColor, color: theme.textSecondary }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-[var(--ui-radius-panel)] border"
      style={{ background: theme.frameBackground, borderColor: theme.borderColor, boxShadow: theme.shadow }}
    >
      <div
        className="border-b px-[var(--ui-panel-padding)] py-[var(--ui-stage-padding)]"
        style={{ background: theme.headerBackground, borderColor: theme.borderColor }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="ui-studio-label font-semibold uppercase tracking-[0.26em]" style={{ color: theme.textSecondary }}>
              Time series
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem]" style={{ color: theme.textPrimary }}>
              {title}
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {subtitle ?? 'Brush the context band to update the focus window without leaving the single-canvas workbench.'}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1 text-xs font-medium"
            style={getStatusStyle(statusTone, theme)}
          >
            <span className="size-2 rounded-full bg-cyan-600" />
            {statusLabel ?? 'Time series ready'}
          </div>
        </div>
        {legend?.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: theme.textSecondary }}>
            <span className="font-semibold uppercase tracking-[0.2em]">Symbols</span>
            {legend.map((entry) => (
              <span key={entry.label} className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <svg aria-label={title} className="block w-full" role="img" style={{ background: theme.plotBackground }} viewBox={`0 0 ${layout.width} ${layout.height}`}>
        {[0.25, 0.5, 0.75].map((fraction) => {
          const y = layout.focusMargin.top + layout.focusHeight * fraction;
          return (
            <line
              key={fraction}
              stroke={theme.gridColor}
              strokeDasharray="4 4"
              strokeWidth={0.85}
              x1={layout.focusMargin.left}
              x2={layout.width - layout.focusMargin.right}
              y1={y}
              y2={y}
            />
          );
        })}

        <line
          stroke={theme.axisDomainColor}
          strokeWidth={1}
          x1={layout.focusMargin.left}
          x2={layout.width - layout.focusMargin.right}
          y1={layout.focusMargin.top + layout.focusHeight}
          y2={layout.focusMargin.top + layout.focusHeight}
        />
        <line
          stroke={theme.axisDomainColor}
          strokeWidth={1}
          x1={layout.focusMargin.left}
          x2={layout.focusMargin.left}
          y1={layout.focusMargin.top}
          y2={layout.focusMargin.top + layout.focusHeight}
        />

        {groupedSeries.map((series) => {
          const visibleSeries = series.points.filter((point) => visibleData.some((candidate) => candidate.id === point.id));
          return (
            <g key={series.symbol}>
              <path
                d={focusLine(visibleSeries) ?? undefined}
                fill="none"
                stroke={series.points[0]?.color ?? '#64748b'}
                strokeWidth={2}
              />
              <path
                d={contextLine(series.points) ?? undefined}
                fill="none"
                opacity={0.75}
                stroke={series.points[0]?.color ?? '#64748b'}
                strokeWidth={1.4}
              />
            </g>
          );
        })}

        {domain ? (
          <rect
            fill="rgba(51,178,201,0.12)"
            height={layout.contextHeight}
            stroke="rgba(51,178,201,0.85)"
            strokeWidth={1.1}
            width={Math.max(0, contextXScale(new Date(domain[1])) - contextXScale(new Date(domain[0])))}
            x={contextXScale(new Date(domain[0]))}
            y={layout.contextMargin.top}
          />
        ) : null}

        <rect
          fill="transparent"
          height={layout.contextHeight}
          onPointerDown={(event) => {
            const point = toSvgCoordinates(event);
            setBrush({
              currentX: point.x,
              startX: point.x,
            });
          }}
          onPointerMove={(event) => {
            if (!brush) {
              return;
            }

            const point = toSvgCoordinates(event);
            setBrush((current) =>
              current
                ? {
                    ...current,
                    currentX: point.x,
                  }
                : current,
            );
          }}
          onPointerUp={() => {
            if (!activeBrushBounds) {
              return;
            }

            const span = activeBrushBounds.right - activeBrushBounds.left;
            if (span < 8) {
              onDomainChange?.(undefined);
              setBrush(null);
              return;
            }

            const start = contextXScale.invert(activeBrushBounds.left).getTime();
            const end = contextXScale.invert(activeBrushBounds.right).getTime();
            onDomainChange?.([Math.min(start, end), Math.max(start, end)]);
            setBrush(null);
          }}
          width={layout.width - layout.contextMargin.left - layout.contextMargin.right}
          x={layout.contextMargin.left}
          y={layout.contextMargin.top}
        />

        {activeBrushBounds ? (
          <rect
            fill="rgba(51,178,201,0.14)"
            height={layout.contextHeight}
            pointerEvents="none"
            stroke="rgba(51,178,201,0.9)"
            strokeDasharray="4 4"
            width={Math.max(0, activeBrushBounds.right - activeBrushBounds.left)}
            x={activeBrushBounds.left}
            y={layout.contextMargin.top}
          />
        ) : null}
      </svg>
    </div>
  );
}
