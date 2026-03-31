import { axisBottom, axisLeft, extent, scaleLinear, select, type Selection } from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ScatterPlotDatum } from './scatter-plot';

export type D3ScatterPlotTheme = {
  axisDomainColor: string;
  axisTickColor: string;
  borderColor: string;
  emptyBackground: string;
  frameBackground: string;
  gridColor: string;
  headerBackground: string;
  plotBackground: string;
  selectionStroke: string;
  shadow: string;
  textPrimary: string;
  textSecondary: string;
};

export type D3ScatterPlotProps = {
  data: ScatterPlotDatum[];
  emptyLabel?: string;
  height?: number;
  legend?: Array<{ color: string; label: string }>;
  onSelect?: (id: string) => void;
  selectedId?: string;
  statusLabel?: string;
  statusTone?: 'accent' | 'neutral' | 'warning' | 'error';
  subtitle?: string;
  theme?: D3ScatterPlotTheme;
  title: string;
  xLabel: string;
  yLabel: string;
};

const DEFAULT_WIDTH = 880;
const DEFAULT_HEIGHT = 520;
const DEFAULT_MARGIN = { top: 30, right: 28, bottom: 56, left: 64 };
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

function getDomain(values: number[]) {
  const [minimum = 0, maximum = 1] = extent(values);

  if (minimum === maximum) {
    return [minimum - 1, maximum + 1] as const;
  }

  const padding = (maximum - minimum) * 0.08;
  return [minimum - padding, maximum + padding] as const;
}

function getStatusStyle(
  tone: D3ScatterPlotProps['statusTone'],
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

export function D3ScatterPlot({
  data,
  emptyLabel = 'No rows match the current controls.',
  height = DEFAULT_HEIGHT,
  legend,
  onSelect,
  selectedId,
  statusLabel,
  statusTone = 'neutral',
  subtitle,
  theme = DEFAULT_THEME,
  title,
  xLabel,
  yLabel,
}: D3ScatterPlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const xAxisRef = useRef<SVGGElement | null>(null);
  const yAxisRef = useRef<SVGGElement | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = Math.max(Math.floor(entries[0]?.contentRect.width ?? DEFAULT_WIDTH), 320);
      setWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const innerWidth = Math.max(width - DEFAULT_MARGIN.left - DEFAULT_MARGIN.right, 10);
  const innerHeight = Math.max(height - DEFAULT_MARGIN.top - DEFAULT_MARGIN.bottom, 10);

  const xScale = useMemo(() => {
    return scaleLinear()
      .domain(getDomain(data.map((point) => point.x)))
      .range([DEFAULT_MARGIN.left, DEFAULT_MARGIN.left + innerWidth]);
  }, [data, innerWidth]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain(getDomain(data.map((point) => point.y)))
      .range([DEFAULT_MARGIN.top + innerHeight, DEFAULT_MARGIN.top]);
  }, [data, innerHeight]);

  useEffect(() => {
    if (!xAxisRef.current || !yAxisRef.current || data.length === 0) {
      return;
    }

    const xAxis = axisBottom(xScale).ticks(6).tickSizeOuter(0);
    const yAxis = axisLeft(yScale).ticks(6).tickSizeOuter(0);

    select(xAxisRef.current)
      .attr('transform', `translate(0, ${DEFAULT_MARGIN.top + innerHeight})`)
      .call(xAxis)
      .call((axisGroup: Selection<SVGGElement, unknown, null, undefined>) => {
        axisGroup.select('.domain').attr('stroke', theme.axisDomainColor);
        axisGroup.selectAll('line').attr('stroke', theme.gridColor);
        axisGroup.selectAll('text').attr('fill', theme.axisTickColor).attr('font-size', 11);
      });

    select(yAxisRef.current)
      .attr('transform', `translate(${DEFAULT_MARGIN.left}, 0)`)
      .call(yAxis)
      .call((axisGroup: Selection<SVGGElement, unknown, null, undefined>) => {
        axisGroup.select('.domain').attr('stroke', theme.axisDomainColor);
        axisGroup.selectAll('line').attr('stroke', theme.gridColor);
        axisGroup.selectAll('text').attr('fill', theme.axisTickColor).attr('font-size', 11);
      });
  }, [data.length, innerHeight, theme.axisDomainColor, theme.axisTickColor, theme.gridColor, xScale, yScale]);

  const yTicks = yScale.ticks(6);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-[var(--ui-radius-panel)] border"
      style={{
        background: theme.frameBackground,
        borderColor: theme.borderColor,
        boxShadow: theme.shadow,
      }}
    >
      <div
        className="border-b px-[var(--ui-panel-padding)] py-[var(--ui-stage-padding)]"
        style={{ background: theme.headerBackground, borderColor: theme.borderColor }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="ui-studio-label font-semibold uppercase tracking-[0.26em]" style={{ color: theme.textSecondary }}>
              Analysis stage
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem]" style={{ color: theme.textPrimary }}>
              {title}
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {subtitle ?? `${data.length} records in the current result set`}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1 text-xs font-medium"
            style={getStatusStyle(statusTone, theme)}
          >
            <span
              className={`size-2 rounded-full ${
                statusTone === 'warning'
                  ? 'animate-pulse bg-amber-500'
                  : statusTone === 'error'
                    ? 'bg-rose-500'
                    : statusTone === 'accent'
                      ? 'bg-cyan-600'
                      : 'bg-slate-400'
              }`}
            />
            {statusLabel ?? 'Preview ready'}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: theme.textSecondary }}>
          <span className="font-semibold uppercase tracking-[0.2em]">D3 scatterplot</span>
          {legend?.map((entry) => (
            <span key={entry.label} className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.label}
            </span>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div
          className="flex h-[420px] items-center justify-center px-6 text-sm"
          style={{ background: theme.emptyBackground, color: theme.textSecondary }}
        >
          {emptyLabel}
        </div>
      ) : (
        <svg
          aria-label={title}
          className="block w-full"
          role="img"
          style={{ background: theme.plotBackground }}
          viewBox={`0 0 ${width} ${height}`}
        >
          <g>
            {yTicks.map((tick: number) => {
              const yPosition = yScale(tick);
              return (
                <line
                  key={`grid-${tick}`}
                  x1={DEFAULT_MARGIN.left}
                  x2={DEFAULT_MARGIN.left + innerWidth}
                  y1={yPosition}
                  y2={yPosition}
                  stroke={theme.gridColor}
                  strokeDasharray="5 8"
                />
              );
            })}
          </g>

          <g ref={xAxisRef} />
          <g ref={yAxisRef} />

          <g>
            {data.map((point) => {
              const isSelected = point.id === selectedId || point.selected;
              return (
                <g key={point.id}>
                  {isSelected ? (
                    <circle
                      cx={xScale(point.x)}
                      cy={yScale(point.y)}
                      fill={`${point.color}20`}
                      r={20}
                    />
                  ) : null}
                  <circle
                    aria-label={point.label}
                    className="cursor-pointer select-none touch-none transition-[r] duration-150"
                    cx={xScale(point.x)}
                    cy={yScale(point.y)}
                    fill={point.color}
                    onClick={() => onSelect?.(point.id)}
                    onMouseDown={(event) => event.preventDefault()}
                    r={isSelected ? 8 : 6.2}
                    stroke={isSelected ? theme.selectionStroke : 'rgba(255,255,255,0.96)'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  >
                    <title>{point.subtitle ? `${point.label} - ${point.subtitle}` : point.label}</title>
                  </circle>
                </g>
              );
            })}
          </g>

          <text
            fill={theme.textSecondary}
            fontSize="12"
            textAnchor="middle"
            x={DEFAULT_MARGIN.left + innerWidth / 2}
            y={height - 14}
          >
            {xLabel}
          </text>
          <text
            fill={theme.textSecondary}
            fontSize="12"
            textAnchor="middle"
            transform={`translate(18 ${DEFAULT_MARGIN.top + innerHeight / 2}) rotate(-90)`}
          >
            {yLabel}
          </text>
        </svg>
      )}
    </div>
  );
}
