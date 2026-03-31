import { axisBottom, axisLeft, extent, scaleLinear, select, type Selection } from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ScatterPlotDatum } from './scatter-plot';

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
  title: string;
  xLabel: string;
  yLabel: string;
};

const DEFAULT_WIDTH = 880;
const DEFAULT_HEIGHT = 520;
const DEFAULT_MARGIN = { top: 30, right: 28, bottom: 56, left: 64 };

function getDomain(values: number[]) {
  const [minimum = 0, maximum = 1] = extent(values);

  if (minimum === maximum) {
    return [minimum - 1, maximum + 1] as const;
  }

  const padding = (maximum - minimum) * 0.08;
  return [minimum - padding, maximum + padding] as const;
}

function getStatusClasses(tone: D3ScatterPlotProps['statusTone']) {
  switch (tone) {
    case 'accent':
      return 'border-cyan-200/80 bg-cyan-50 text-cyan-800';
    case 'warning':
      return 'border-amber-200/80 bg-amber-50 text-amber-800';
    case 'error':
      return 'border-rose-200/80 bg-rose-50 text-rose-800';
    default:
      return 'border-slate-300/80 bg-white/85 text-slate-700';
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
        axisGroup.select('.domain').attr('stroke', '#8fa3b4');
        axisGroup.selectAll('line').attr('stroke', '#c7d3dd');
        axisGroup.selectAll('text').attr('fill', '#526172').attr('font-size', 11);
      });

    select(yAxisRef.current)
      .attr('transform', `translate(${DEFAULT_MARGIN.left}, 0)`)
      .call(yAxis)
      .call((axisGroup: Selection<SVGGElement, unknown, null, undefined>) => {
        axisGroup.select('.domain').attr('stroke', '#8fa3b4');
        axisGroup.selectAll('line').attr('stroke', '#d7e0e7');
        axisGroup.selectAll('text').attr('fill', '#526172').attr('font-size', 11);
      });
  }, [data.length, innerHeight, xScale, yScale]);

  const yTicks = yScale.ticks(6);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-[26px] border border-slate-300/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(246,250,252,0.98)_100%)] shadow-[0_20px_60px_-42px_rgba(15,23,42,0.45)]"
    >
      <div className="border-b border-slate-300/75 bg-[linear-gradient(180deg,_rgba(249,251,252,0.98)_0%,_rgba(244,248,250,0.95)_100%)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-slate-500">Analysis stage</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem] text-slate-950">{title}</p>
            <p className="mt-2 text-sm text-slate-600">
              {subtitle ?? `${data.length} records in the current result set`}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(statusTone)}`}
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
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-[0.2em] text-slate-500">D3 scatterplot</span>
          {legend?.map((entry) => (
            <span key={entry.label} className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.label}
            </span>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[420px] items-center justify-center bg-slate-50/80 px-6 text-sm text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <svg
          aria-label={title}
          className="block w-full bg-[linear-gradient(180deg,_rgba(251,253,254,0.98)_0%,_rgba(246,250,252,0.98)_100%)]"
          role="img"
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
                  stroke="#d7e0e7"
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
                    stroke={isSelected ? '#102331' : 'rgba(255,255,255,0.96)'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  >
                    <title>{point.subtitle ? `${point.label} - ${point.subtitle}` : point.label}</title>
                  </circle>
                </g>
              );
            })}
          </g>

          <text
            fill="#526172"
            fontSize="12"
            textAnchor="middle"
            x={DEFAULT_MARGIN.left + innerWidth / 2}
            y={height - 14}
          >
            {xLabel}
          </text>
          <text
            fill="#526172"
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
