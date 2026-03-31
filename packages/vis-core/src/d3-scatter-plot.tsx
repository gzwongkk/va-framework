import { axisBottom, axisLeft, extent, scaleLinear, select, type Selection } from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ScatterPlotDatum } from './scatter-plot';

export type D3ScatterPlotProps = {
  data: ScatterPlotDatum[];
  emptyLabel?: string;
  height?: number;
  onSelect?: (id: string) => void;
  selectedId?: string;
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

export function D3ScatterPlot({
  data,
  emptyLabel = 'No rows match the current controls.',
  height = DEFAULT_HEIGHT,
  onSelect,
  selectedId,
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
        axisGroup.select('.domain').attr('stroke', '#94a3b8');
        axisGroup.selectAll('line').attr('stroke', '#cbd5e1');
        axisGroup.selectAll('text').attr('fill', '#64748b').attr('font-size', 11);
      });

    select(yAxisRef.current)
      .attr('transform', `translate(${DEFAULT_MARGIN.left}, 0)`)
      .call(yAxis)
      .call((axisGroup: Selection<SVGGElement, unknown, null, undefined>) => {
        axisGroup.select('.domain').attr('stroke', '#94a3b8');
        axisGroup.selectAll('line').attr('stroke', '#e2e8f0');
        axisGroup.selectAll('text').attr('fill', '#64748b').attr('font-size', 11);
      });
  }, [data.length, innerHeight, xScale, yScale]);

  const yTicks = yScale.ticks(6);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-950/5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl text-slate-950">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle ?? `${data.length} records in the current result set`}</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">
          D3 Scatterplot
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[420px] items-center justify-center bg-slate-50 px-6 text-sm text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <svg
          aria-label={title}
          className="block w-full bg-[linear-gradient(180deg,_rgba(244,248,251,0.95)_0%,_rgba(255,255,255,1)_100%)]"
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
                  stroke="#e2e8f0"
                  strokeDasharray="4 8"
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
                      fill={`${point.color}22`}
                      r={18}
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
                    r={isSelected ? 8 : 6}
                    stroke={isSelected ? '#0f172a' : 'white'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  >
                    <title>{point.subtitle ? `${point.label} - ${point.subtitle}` : point.label}</title>
                  </circle>
                </g>
              );
            })}
          </g>

          <text
            fill="#64748b"
            fontSize="12"
            textAnchor="middle"
            x={DEFAULT_MARGIN.left + innerWidth / 2}
            y={height - 14}
          >
            {xLabel}
          </text>
          <text
            fill="#64748b"
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
