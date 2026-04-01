import { scaleLinear } from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { D3ScatterPlotTheme } from './d3-scatter-plot';

export type AdjacencyMatrixNode = {
  degree: number;
  group: number;
  id: string;
  label: string;
};

export type AdjacencyMatrixCell = {
  columnIndex: number;
  rowIndex: number;
  sourceId: string;
  targetId: string;
  value: number;
  withinGroup: boolean;
};

export type AdjacencyMatrixBrushProps = {
  cells: AdjacencyMatrixCell[];
  emptyLabel?: string;
  nodes: AdjacencyMatrixNode[];
  onSelectIds?: (ids: string[]) => void;
  selectedIds?: string[];
  statusLabel?: string;
  statusTone?: 'accent' | 'neutral' | 'warning' | 'error';
  subtitle?: string;
  theme?: D3ScatterPlotTheme;
  title: string;
  truncated?: boolean;
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
  currentY: number;
  startX: number;
  startY: number;
} | null;

function getStatusStyle(
  tone: AdjacencyMatrixBrushProps['statusTone'],
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

export function AdjacencyMatrixBrush({
  cells,
  emptyLabel = 'No matrix data is available for the current graph query.',
  nodes,
  onSelectIds,
  selectedIds = [],
  statusLabel,
  statusTone = 'neutral',
  subtitle,
  theme = DEFAULT_THEME,
  title,
  truncated = false,
}: AdjacencyMatrixBrushProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(880);
  const [hoveredIndex, setHoveredIndex] = useState<number>();
  const [brush, setBrush] = useState<BrushState>(null);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = Math.max(Math.floor(entries[0]?.contentRect.width ?? 880), 360);
      setWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const layout = useMemo(() => {
    const margin = { top: 110, right: 24, bottom: 24, left: 132 };
    const cellSize = Math.max(10, Math.min(26, Math.floor((width - margin.left - margin.right) / Math.max(nodes.length, 1))));
    const matrixSize = cellSize * nodes.length;
    const height = margin.top + margin.bottom + matrixSize;
    const valueScale = scaleLinear<string>()
      .domain([0, Math.max(...cells.map((cell) => cell.value), 1)])
      .range(['rgba(222,231,238,0.45)', 'rgba(47,96,125,0.92)']);

    return {
      cellSize,
      height,
      margin,
      matrixSize,
      valueScale,
      width,
    };
  }, [cells, nodes.length, width]);

  const brushBounds = useMemo(() => {
    if (!brush) {
      return undefined;
    }

    const left = Math.min(brush.startX, brush.currentX);
    const right = Math.max(brush.startX, brush.currentX);
    const top = Math.min(brush.startY, brush.currentY);
    const bottom = Math.max(brush.startY, brush.currentY);

    return {
      bottom,
      left,
      right,
      top,
    };
  }, [brush]);

  const selectedBrushIndices = useMemo(() => {
    if (!brushBounds) {
      return new Set<number>();
    }

    const startRow = Math.max(0, Math.floor((brushBounds.top - layout.margin.top) / layout.cellSize));
    const endRow = Math.min(nodes.length - 1, Math.floor((brushBounds.bottom - layout.margin.top) / layout.cellSize));
    const startColumn = Math.max(0, Math.floor((brushBounds.left - layout.margin.left) / layout.cellSize));
    const endColumn = Math.min(nodes.length - 1, Math.floor((brushBounds.right - layout.margin.left) / layout.cellSize));
    const indices = new Set<number>();

    for (let index = startRow; index <= endRow; index += 1) {
      indices.add(index);
    }
    for (let index = startColumn; index <= endColumn; index += 1) {
      indices.add(index);
    }

    return indices;
  }, [brushBounds, layout.cellSize, layout.margin.left, layout.margin.top, nodes.length]);

  const selectedNodeIdsFromBrush = useMemo(
    () => [...selectedBrushIndices].map((index) => nodes[index]?.id).filter((value): value is string => Boolean(value)),
    [nodes, selectedBrushIndices],
  );

  function toSvgCoordinates(event: React.PointerEvent<SVGRectElement | SVGTextElement>) {
    const svgElement = event.currentTarget.ownerSVGElement;
    if (!svgElement) {
      return { x: 0, y: 0 };
    }

    const bounds = svgElement.getBoundingClientRect();
    const scaleX = layout.width / bounds.width;
    const scaleY = layout.height / bounds.height;

    return {
      x: (event.clientX - bounds.left) * scaleX,
      y: (event.clientY - bounds.top) * scaleY,
    };
  }

  if (nodes.length === 0) {
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
              Adjacency matrix
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem]" style={{ color: theme.textPrimary }}>
              {title}
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {subtitle ?? 'Brush rows and columns to select graph subsets, then compare ordered connectivity blocks.'}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1 text-xs font-medium"
            style={getStatusStyle(statusTone, theme)}
          >
            <span className="size-2 rounded-full bg-cyan-600" />
            {statusLabel ?? 'Matrix ready'}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: theme.textSecondary }}>
          <span className="font-semibold uppercase tracking-[0.2em]">Brush rows and columns</span>
          {truncated ? <span>Showing first {nodes.length} nodes from the active order.</span> : null}
          <span>{selectedIds.length > 0 ? `${selectedIds.length} selected` : 'No active brush selection'}</span>
        </div>
      </div>

      <div className="overflow-auto" style={{ background: theme.plotBackground }}>
        <svg aria-label={title} className="block min-w-full" role="img" viewBox={`0 0 ${layout.width} ${layout.height}`}>
          {cells.map((cell) => {
            const isSelected =
              selectedIdSet.has(cell.sourceId) &&
              selectedIdSet.has(cell.targetId) &&
              cell.value > 0;
            const isHovered = hoveredIndex === cell.rowIndex || hoveredIndex === cell.columnIndex;
            return (
              <rect
                key={`${cell.sourceId}:${cell.targetId}`}
                fill={cell.value > 0 ? layout.valueScale(cell.value) : 'rgba(239,245,248,0.8)'}
                height={layout.cellSize - 1}
                stroke={isSelected ? theme.selectionStroke : isHovered ? theme.axisTickColor : 'rgba(255,255,255,0.42)'}
                strokeWidth={isSelected ? 1.5 : isHovered ? 1 : 0.5}
                width={layout.cellSize - 1}
                x={layout.margin.left + cell.columnIndex * layout.cellSize}
                y={layout.margin.top + cell.rowIndex * layout.cellSize}
              />
            );
          })}

          {nodes.map((node, index) => {
            const isSelected = selectedIdSet.has(node.id) || selectedBrushIndices.has(index);
            const isHovered = hoveredIndex === index;
            const color = isSelected ? theme.textPrimary : isHovered ? theme.axisTickColor : theme.textSecondary;

            return (
              <g key={node.id}>
                <text
                  fill={color}
                  fontSize="10"
                  fontWeight={isSelected ? 700 : 500}
                  onClick={() => onSelectIds?.([node.id])}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex((current) => (current === index ? undefined : current))}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  textAnchor="end"
                  x={layout.margin.left - 8}
                  y={layout.margin.top + index * layout.cellSize + layout.cellSize * 0.72}
                >
                  {node.label}
                </text>
                <text
                  fill={color}
                  fontSize="10"
                  fontWeight={isSelected ? 700 : 500}
                  onClick={() => onSelectIds?.([node.id])}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex((current) => (current === index ? undefined : current))}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  textAnchor="start"
                  transform={`translate(${layout.margin.left + index * layout.cellSize + layout.cellSize * 0.35} ${layout.margin.top - 10}) rotate(-60)`}
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          <rect
            fill="transparent"
            height={layout.matrixSize}
            onPointerDown={(event) => {
              const point = toSvgCoordinates(event);
              setBrush({
                currentX: point.x,
                currentY: point.y,
                startX: point.x,
                startY: point.y,
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
                      currentY: point.y,
                    }
                  : current,
              );
            }}
            onPointerUp={() => {
              if (selectedNodeIdsFromBrush.length > 0) {
                onSelectIds?.(selectedNodeIdsFromBrush);
              }
              setBrush(null);
            }}
            width={layout.matrixSize}
            x={layout.margin.left}
            y={layout.margin.top}
          />

          {brushBounds ? (
            <rect
              fill="rgba(51,178,201,0.14)"
              height={brushBounds.bottom - brushBounds.top}
              pointerEvents="none"
              stroke="rgba(51,178,201,0.9)"
              strokeDasharray="4 4"
              width={brushBounds.right - brushBounds.left}
              x={brushBounds.left}
              y={brushBounds.top}
            />
          ) : null}
        </svg>
      </div>
    </div>
  );
}
