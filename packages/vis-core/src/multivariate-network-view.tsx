import { extent, scaleLinear } from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { D3ScatterPlotTheme } from './d3-scatter-plot';

export type MultivariateViewNode = {
  color: string;
  facet?: string;
  id: string;
  label: string;
  radius: number;
  xValue: number;
  yValue: number;
};

export type MultivariateViewEdge = {
  color: string;
  id: string;
  source: string;
  target: string;
  width: number;
};

export type MultivariateLayoutMode = 'attribute-position' | 'faceted';

export type MultivariateNetworkViewProps = {
  encodingSummary?: Array<{ label: string; value: string }>;
  edges: MultivariateViewEdge[];
  emptyLabel?: string;
  facetSummary?: Array<{ count: number; label: string; share: number }>;
  layoutMode: MultivariateLayoutMode;
  legend?: Array<{ color: string; label: string }>;
  legendTitle?: string;
  layoutLabel?: string;
  nodes: MultivariateViewNode[];
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
  tone: MultivariateNetworkViewProps['statusTone'],
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

export function MultivariateNetworkView({
  encodingSummary,
  edges,
  emptyLabel = 'No multivariate nodes are available for the current graph state.',
  facetSummary,
  layoutMode,
  legend,
  legendTitle,
  layoutLabel,
  nodes,
  onSelect,
  selectedId,
  statusLabel,
  statusTone = 'neutral',
  subtitle,
  theme = DEFAULT_THEME,
  title,
  xLabel,
  yLabel,
}: MultivariateNetworkViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(880);
  const height = 640;
  const margin = { top: 36, right: 28, bottom: 64, left: 72 };

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

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const facets = useMemo(() => {
    const values = Array.from(new Set(nodes.map((node) => node.facet ?? 'All')));
    return values.length > 0 ? values : ['All'];
  }, [nodes]);

  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain(getDomain(nodes.map((node) => node.xValue)))
        .range([margin.left, width - margin.right]),
    [nodes, width],
  );
  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain(getDomain(nodes.map((node) => node.yValue)))
        .range([height - margin.bottom, margin.top]),
    [nodes],
  );

  const facetedPositions = useMemo(() => {
    const facetWidth = (width - margin.left - margin.right) / facets.length;
    const facetNodes = new Map<string, MultivariateViewNode[]>();

    for (const node of nodes) {
      const facetKey = node.facet ?? 'All';
      const currentFacetNodes = facetNodes.get(facetKey) ?? [];
      currentFacetNodes.push(node);
      facetNodes.set(facetKey, currentFacetNodes);
    }

    return new Map(
      facets.flatMap((facet, index) => {
        const nodesInFacet = facetNodes.get(facet) ?? [];
        const localXScale = scaleLinear()
          .domain(getDomain(nodesInFacet.map((node) => node.xValue)))
          .range([margin.left + facetWidth * index + 22, margin.left + facetWidth * (index + 1) - 22]);

        return nodesInFacet.map((node) => [
          node.id,
          {
            x: localXScale(node.xValue),
            y: yScale(node.yValue),
          },
        ] as const);
      }),
    );
  }, [facets, nodes, width, yScale]);

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
              Multivariate network
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem]" style={{ color: theme.textPrimary }}>
              {title}
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {subtitle ?? 'Map nodes into analytical space and compare attribute-driven patterns across the graph.'}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1 text-xs font-medium"
            style={getStatusStyle(statusTone, theme)}
          >
            <span className="size-2 rounded-full bg-cyan-600" />
            {statusLabel ?? 'Multivariate view ready'}
          </div>
        </div>
        {encodingSummary?.length ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs" style={{ color: theme.textSecondary }}>
            {(layoutLabel ? [{ label: 'Layout', value: layoutLabel }, ...encodingSummary] : encodingSummary).map((item) => (
              <span
                key={`${item.label}:${item.value}`}
                className="inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1"
                style={{ borderColor: theme.borderColor }}
              >
                <span className="font-semibold uppercase tracking-[0.18em]">{item.label}</span>
                <span style={{ color: theme.textPrimary }}>{item.value}</span>
              </span>
            ))}
          </div>
        ) : null}
        {legend?.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs" style={{ color: theme.textSecondary }}>
            <span className="font-semibold uppercase tracking-[0.2em]">
              {legendTitle ?? 'Color legend'}
            </span>
            {legend.map((entry) => (
              <span key={entry.label} className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <svg aria-label={title} className="block w-full" role="img" viewBox={`0 0 ${width} ${height}`} style={{ background: theme.plotBackground }}>
        {layoutMode === 'attribute-position' ? (
          <>
            {[0.25, 0.5, 0.75].map((fraction) => {
              const x = margin.left + (width - margin.left - margin.right) * fraction;
              const y = margin.top + (height - margin.top - margin.bottom) * fraction;

              return (
                <g key={`grid-${fraction}`}>
                  <line
                    stroke={theme.gridColor}
                    strokeDasharray="4 4"
                    strokeWidth={0.85}
                    x1={x}
                    x2={x}
                    y1={margin.top}
                    y2={height - margin.bottom}
                  />
                  <line
                    stroke={theme.gridColor}
                    strokeDasharray="4 4"
                    strokeWidth={0.85}
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={y}
                    y2={y}
                  />
                </g>
              );
            })}
            <line stroke={theme.axisDomainColor} strokeWidth={1} x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} />
            <line stroke={theme.axisDomainColor} strokeWidth={1} x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} />
            <text fill={theme.textSecondary} fontSize="11" textAnchor="middle" x={(margin.left + width - margin.right) / 2} y={height - 18}>
              {xLabel}
            </text>
            <text
              fill={theme.textSecondary}
              fontSize="11"
              textAnchor="middle"
              transform={`translate(18 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`}
            >
              {yLabel}
            </text>
          </>
        ) : (
          facets.map((facet, index) => {
            const facetWidth = (width - margin.left - margin.right) / facets.length;
            const x = margin.left + facetWidth * index;
            return (
              <g key={facet}>
                <rect
                  fill="none"
                  height={height - margin.top - margin.bottom}
                  stroke={theme.gridColor}
                  strokeDasharray="4 4"
                  strokeWidth={0.8}
                  width={Math.max(0, facetWidth - 16)}
                  x={x + 8}
                  y={margin.top}
                />
                <text fill={theme.textSecondary} fontSize="11" fontWeight="600" textAnchor="middle" x={x + facetWidth / 2} y={margin.top - 10}>
                  {facet}
                </text>
              </g>
            );
          })
        )}

        {edges.map((edge) => {
          const source = nodeById.get(edge.source);
          const target = nodeById.get(edge.target);
          if (!source || !target) {
            return null;
          }

          const sourcePosition =
            layoutMode === 'attribute-position'
              ? { x: xScale(source.xValue), y: yScale(source.yValue) }
              : facetedPositions.get(source.id);
          const targetPosition =
            layoutMode === 'attribute-position'
              ? { x: xScale(target.xValue), y: yScale(target.yValue) }
              : facetedPositions.get(target.id);

          if (!sourcePosition || !targetPosition) {
            return null;
          }

          if (layoutMode === 'faceted' && source.facet !== target.facet) {
            return null;
          }

          return (
            <line
              key={edge.id}
              stroke={edge.color}
              strokeOpacity={0.45}
              strokeWidth={edge.width}
              x1={sourcePosition.x}
              x2={targetPosition.x}
              y1={sourcePosition.y}
              y2={targetPosition.y}
            />
          );
        })}

        {nodes.map((node) => {
          const position =
            layoutMode === 'attribute-position'
              ? { x: xScale(node.xValue), y: yScale(node.yValue) }
              : facetedPositions.get(node.id);
          if (!position) {
            return null;
          }

          const isSelected = node.id === selectedId;
          return (
            <g key={node.id} transform={`translate(${position.x} ${position.y})`}>
              <circle
                fill={node.color}
                onClick={() => onSelect?.(node.id)}
                r={isSelected ? node.radius + 1.5 : node.radius}
                stroke={isSelected ? theme.selectionStroke : 'rgba(255,255,255,0.92)'}
                strokeWidth={isSelected ? 2.2 : 1.2}
                style={{ cursor: 'pointer' }}
              />
              {isSelected ? (
                <text
                  fill={theme.textPrimary}
                  fontSize="11"
                  fontWeight="600"
                  stroke="rgba(255,255,255,0.96)"
                  strokeWidth="3"
                  paintOrder="stroke"
                  textAnchor="middle"
                  y={-(node.radius + 10)}
                >
                  {node.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {layoutMode === 'faceted' && facetSummary?.length ? (
        <div
          className="border-t px-[var(--ui-panel-padding)] py-3"
          style={{ background: theme.headerBackground, borderColor: theme.borderColor }}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: theme.textSecondary }}>
            <span className="font-semibold uppercase tracking-[0.2em]">Facet summary</span>
            {facetSummary.map((facet) => (
              <span
                key={facet.label}
                className="inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1"
                style={{ borderColor: theme.borderColor }}
              >
                <span style={{ color: theme.textPrimary }}>{facet.label}</span>
                <span>{facet.count} nodes</span>
                <span>{Math.round(facet.share * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
