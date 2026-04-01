import { brush, extent, scaleLinear, select, type D3BrushEvent } from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { D3ScatterPlotTheme } from './d3-scatter-plot';

export type SplomDatum = {
  category: string;
  color: string;
  id: string;
  label: string;
  values: Record<string, number>;
};

export type BrushableScatterplotMatrixProps = {
  data: SplomDatum[];
  emptyLabel?: string;
  fields: string[];
  legend?: Array<{ color: string; label: string }>;
  onSelectIds?: (ids: string[]) => void;
  selectedIds?: string[];
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

function getStatusStyle(
  tone: BrushableScatterplotMatrixProps['statusTone'],
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

function getDomain(values: number[]) {
  const [minimum = 0, maximum = 1] = extent(values);
  if (minimum === maximum) {
    return [minimum - 1, maximum + 1] as const;
  }

  const padding = (maximum - minimum) * 0.08;
  return [minimum - padding, maximum + padding] as const;
}

function getNumericValue(record: SplomDatum['values'], field: string) {
  const rawValue = record[field];
  return typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : 0;
}

export function BrushableScatterplotMatrix({
  data,
  emptyLabel = 'No tabular rows are available for the current SPLOM controls.',
  fields,
  legend,
  onSelectIds,
  selectedIds = [],
  statusLabel,
  statusTone = 'neutral',
  subtitle,
  theme = DEFAULT_THEME,
  title,
}: BrushableScatterplotMatrixProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(920);
  const brushRefs = useRef<Record<string, SVGGElement | null>>({});
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

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

  const layout = useMemo(() => {
    const margin = { top: 92, right: 28, bottom: 28, left: 92 };
    const cellGap = 12;
    const cellCount = Math.max(fields.length, 1);
    const cellSize = Math.max(
      96,
      Math.floor((width - margin.left - margin.right - cellGap * (cellCount - 1)) / cellCount),
    );
    const matrixSize = cellCount * cellSize + (cellCount - 1) * cellGap;
    const height = margin.top + margin.bottom + matrixSize;
    return {
      cellGap,
      cellSize,
      height,
      margin,
      matrixSize,
      width,
    };
  }, [fields.length, width]);

  const scales = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [
          field,
          scaleLinear<number, number>()
            .domain(getDomain(data.map((row) => row.values[field] ?? 0)))
            .range([0, layout.cellSize]),
        ]),
      ) as Record<string, ReturnType<typeof scaleLinear<number, number>>>,
    [data, fields, layout.cellSize],
  );

  useEffect(() => {
    fields.forEach((xField) => {
      fields.forEach((yField) => {
        if (xField === yField) {
          return;
        }

        const key = `${xField}:${yField}`;
        const brushNode = brushRefs.current[key];
        if (!brushNode) {
          return;
        }

        const xScale = scales[xField];
        const yScale = scales[yField];

        const brushBehavior = brush()
          .extent([
            [0, 0],
            [layout.cellSize, layout.cellSize],
          ])
          .on('brush end', (event: D3BrushEvent<unknown>) => {
            const selection = event.selection as [[number, number], [number, number]] | null;
            if (!selection) {
              if (event.type === 'end') {
                onSelectIds?.([]);
              }
              return;
            }

            const [[x0, y0], [x1, y1]] = selection;
            const matchingIds = data
              .filter((row) => {
                const xValue = xScale(getNumericValue(row.values, xField));
                const yValue = layout.cellSize - yScale(getNumericValue(row.values, yField));
                return xValue >= x0 && xValue <= x1 && yValue >= y0 && yValue <= y1;
              })
              .map((row) => row.id);

            onSelectIds?.(matchingIds);
          });

        select(brushNode).call(brushBehavior as never);
      });
    });
  }, [data, fields, layout.cellSize, onSelectIds, scales]);

  if (data.length === 0 || fields.length === 0) {
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
              Multivariate stage
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem]" style={{ color: theme.textPrimary }}>
              {title}
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {subtitle ?? 'Brush any scatter cell to select cohorts and carry the selection through the detail rail.'}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1 text-xs font-medium"
            style={getStatusStyle(statusTone, theme)}
          >
            <span className="size-2 rounded-full bg-cyan-600" />
            {statusLabel ?? 'SPLOM ready'}
          </div>
        </div>
        {legend?.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: theme.textSecondary }}>
            <span className="font-semibold uppercase tracking-[0.2em]">Species</span>
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
        {fields.map((yField, rowIndex) =>
          fields.map((xField, columnIndex) => {
            const cellX = layout.margin.left + columnIndex * (layout.cellSize + layout.cellGap);
            const cellY = layout.margin.top + rowIndex * (layout.cellSize + layout.cellGap);
            const cellKey = `${xField}:${yField}`;
            const isDiagonal = xField === yField;

            return (
              <g key={cellKey} transform={`translate(${cellX} ${cellY})`}>
                <rect
                  fill="rgba(255,255,255,0.56)"
                  height={layout.cellSize}
                  rx={12}
                  ry={12}
                  stroke={theme.gridColor}
                  width={layout.cellSize}
                />

                {isDiagonal ? (
                  <>
                    <text
                      fill={theme.textPrimary}
                      fontSize="12"
                      fontWeight="600"
                      x={14}
                      y={24}
                    >
                      {xField.replaceAll('_', ' ')}
                    </text>
                    <text
                      fill={theme.textSecondary}
                      fontSize="10"
                      x={14}
                      y={42}
                    >
                      {data.length} points
                    </text>
                  </>
                ) : (
                  <>
                    {data.map((row) => {
                      const xScale = scales[xField];
                      const yScale = scales[yField];
                      const x = xScale(getNumericValue(row.values, xField));
                      const y = layout.cellSize - yScale(getNumericValue(row.values, yField));
                      const isSelected = selectedIdSet.size === 0 ? false : selectedIdSet.has(row.id);
                      return (
                        <circle
                          cx={x}
                          cy={y}
                          fill={row.color}
                          fillOpacity={selectedIdSet.size === 0 ? 0.72 : isSelected ? 0.92 : 0.16}
                          key={`${cellKey}:${row.id}`}
                          r={isSelected ? 3.9 : 3.1}
                          stroke={isSelected ? theme.selectionStroke : 'none'}
                          strokeWidth={isSelected ? 1.2 : 0}
                        >
                          <title>{row.label}</title>
                        </circle>
                      );
                    })}
                    <g ref={(node) => { brushRefs.current[cellKey] = node; }} />
                  </>
                )}

                {rowIndex === fields.length - 1 ? (
                  <text
                    fill={theme.textSecondary}
                    fontSize="11"
                    textAnchor="middle"
                    x={layout.cellSize / 2}
                    y={layout.cellSize + 18}
                  >
                    {xField.replaceAll('_', ' ')}
                  </text>
                ) : null}

                {columnIndex === 0 ? (
                  <text
                    fill={theme.textSecondary}
                    fontSize="11"
                    textAnchor="middle"
                    transform={`translate(${-24} ${layout.cellSize / 2}) rotate(-90)`}
                  >
                    {yField.replaceAll('_', ' ')}
                  </text>
                ) : null}
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
