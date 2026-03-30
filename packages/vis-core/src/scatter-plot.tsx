import type { KeyboardEvent } from 'react';

export type ScatterPlotDatum = {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
  subtitle?: string;
  selected?: boolean;
};

export type ScatterPlotProps = {
  data: ScatterPlotDatum[];
  width?: number;
  height?: number;
  title: string;
  xLabel: string;
  yLabel: string;
  emptyLabel?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
};

const DEFAULT_MARGIN = { top: 28, right: 20, bottom: 50, left: 58 };
const GRID_STEPS = 4;

function getExtent(values: number[]): [number, number] {
  if (values.length === 0) {
    return [0, 1];
  }

  let min = values[0];
  let max = values[0];

  for (const value of values) {
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  if (min === max) {
    return [min - 1, max + 1];
  }

  const padding = (max - min) * 0.08;
  return [min - padding, max + padding];
}

function scaleLinear(value: number, domain: [number, number], range: [number, number]) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;

  if (domainMax === domainMin) {
    return (rangeMin + rangeMax) / 2;
  }

  const ratio = (value - domainMin) / (domainMax - domainMin);
  return rangeMin + ratio * (rangeMax - rangeMin);
}

function formatTick(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ScatterPlot({
  data,
  emptyLabel = 'Adjust the filters to populate this view.',
  height = 360,
  onSelect,
  selectedId,
  title,
  width = 760,
  xLabel,
  yLabel,
}: ScatterPlotProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  const innerWidth = width - DEFAULT_MARGIN.left - DEFAULT_MARGIN.right;
  const innerHeight = height - DEFAULT_MARGIN.top - DEFAULT_MARGIN.bottom;
  const xDomain = getExtent(data.map((point) => point.x));
  const yDomain = getExtent(data.map((point) => point.y));
  const xTicks = Array.from({ length: GRID_STEPS + 1 }, (_, index) =>
    xDomain[0] + ((xDomain[1] - xDomain[0]) / GRID_STEPS) * index,
  );
  const yTicks = Array.from({ length: GRID_STEPS + 1 }, (_, index) =>
    yDomain[0] + ((yDomain[1] - yDomain[0]) / GRID_STEPS) * index,
  );

  const handleKeyDown = (event: KeyboardEvent<SVGCircleElement>, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{data.length} records in the active view</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">
          Single View
        </div>
      </div>
      <svg
        aria-label={title}
        className="block h-auto w-full bg-[linear-gradient(180deg,_rgba(244,248,251,0.95)_0%,_rgba(255,255,255,1)_100%)]"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <g transform={`translate(${DEFAULT_MARGIN.left}, ${DEFAULT_MARGIN.top})`}>
          {yTicks.map((tick) => {
            const y = scaleLinear(tick, yDomain, [innerHeight, 0]);
            return (
              <g key={`y-${tick}`}>
                <line x1={0} x2={innerWidth} y1={y} y2={y} stroke="#d9e4ea" strokeDasharray="4 8" />
                <text x={-12} y={y + 4} fill="#607080" fontSize={11} textAnchor="end">
                  {formatTick(tick)}
                </text>
              </g>
            );
          })}

          {xTicks.map((tick) => {
            const x = scaleLinear(tick, xDomain, [0, innerWidth]);
            return (
              <g key={`x-${tick}`}>
                <line x1={x} x2={x} y1={0} y2={innerHeight} stroke="#eef3f6" />
                <text x={x} y={innerHeight + 24} fill="#607080" fontSize={11} textAnchor="middle">
                  {formatTick(tick)}
                </text>
              </g>
            );
          })}

          <line x1={0} x2={innerWidth} y1={innerHeight} y2={innerHeight} stroke="#8ba1af" />
          <line x1={0} x2={0} y1={0} y2={innerHeight} stroke="#8ba1af" />

          {data.map((point) => {
            const x = scaleLinear(point.x, xDomain, [0, innerWidth]);
            const y = scaleLinear(point.y, yDomain, [innerHeight, 0]);
            const isSelected = selectedId === point.id || point.selected;

            return (
              <g key={point.id} transform={`translate(${x}, ${y})`}>
                {isSelected ? <circle cx={0} cy={0} fill={`${point.color}20`} r={18} /> : null}
                <circle
                  aria-label={point.label}
                  className="cursor-pointer"
                  cx={0}
                  cy={0}
                  fill={point.color}
                  onClick={() => onSelect?.(point.id)}
                  onKeyDown={(event) => handleKeyDown(event, point.id)}
                  r={isSelected ? 8 : 6}
                  stroke={isSelected ? '#07131c' : 'white'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  tabIndex={0}
                >
                  <title>{point.subtitle ? `${point.label} - ${point.subtitle}` : point.label}</title>
                </circle>
              </g>
            );
          })}

          <text
            fill="#607080"
            fontSize={12}
            textAnchor="middle"
            transform={`translate(${innerWidth / 2}, ${innerHeight + 42})`}
          >
            {xLabel}
          </text>
          <text
            fill="#607080"
            fontSize={12}
            textAnchor="middle"
            transform={`translate(${-42}, ${innerHeight / 2}) rotate(-90)`}
          >
            {yLabel}
          </text>
        </g>
      </svg>
    </div>
  );
}
