import {
  sankey,
  sankeyJustify,
  sankeyLinkHorizontal,
  type SankeyGraph,
} from 'd3-sankey';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { D3ScatterPlotTheme } from './d3-scatter-plot';

export type SankeyFlowNode = {
  color: string;
  id: string;
  label: string;
  stage: number;
};

export type SankeyFlowLink = {
  color: string;
  id: string;
  source: string;
  sourceStage: number;
  target: string;
  targetStage: number;
  value: number;
};

export type SankeyFlowDiagramProps = {
  emptyLabel?: string;
  legend?: Array<{ color: string; label: string }>;
  links: SankeyFlowLink[];
  nodes: SankeyFlowNode[];
  onHoverLink?: (linkId?: string) => void;
  onHoverNode?: (nodeId?: string) => void;
  onSelectLink?: (linkId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  selectedLinkId?: string;
  selectedNodeId?: string;
  statusLabel?: string;
  statusTone?: 'accent' | 'neutral' | 'warning' | 'error';
  subtitle?: string;
  theme?: D3ScatterPlotTheme;
  title: string;
};

type InternalNode = SankeyFlowNode & {
  value?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
};

type InternalLink = {
  color: string;
  id: string;
  source: string | InternalNode;
  sourceStage: number;
  target: string | InternalNode;
  targetStage: number;
  value: number;
  width?: number;
};

const DEFAULT_THEME: D3ScatterPlotTheme = {
  axisDomainColor: '#8fa3b4',
  axisTickColor: '#526172',
  borderColor: 'rgba(146, 164, 180, 0.46)',
  emptyBackground: 'rgba(243, 247, 250, 0.9)',
  frameBackground:
    'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(246,250,252,0.98) 100%)',
  gridColor: '#d7e0e7',
  headerBackground:
    'linear-gradient(180deg, rgba(249,251,252,0.98) 0%, rgba(244,248,250,0.95) 100%)',
  plotBackground:
    'linear-gradient(180deg, rgba(251,253,254,0.98) 0%, rgba(246,250,252,0.98) 100%)',
  selectionStroke: '#102331',
  shadow: '0 20px 60px -42px rgba(15,23,42,0.45)',
  textPrimary: '#0f172a',
  textSecondary: '#526172',
};

function getStatusStyle(
  tone: SankeyFlowDiagramProps['statusTone'],
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
        background:
          'color-mix(in srgb, white 82%, var(--chart-border-color, rgba(146, 164, 180, 0.46)) 18%)',
        borderColor: theme.borderColor,
        color: theme.textSecondary,
      };
  }
}

function getLinkEndpointId(endpoint: InternalLink['source']) {
  return typeof endpoint === 'string' ? endpoint : endpoint.id;
}

function getLinkEndpointLabel(endpoint: InternalLink['source']) {
  return typeof endpoint === 'string' ? endpoint : endpoint.label;
}

export function SankeyFlowDiagram({
  emptyLabel = 'No flow links are available for the current Sankey controls.',
  legend,
  links,
  nodes,
  onHoverLink,
  onHoverNode,
  onSelectLink,
  onSelectNode,
  selectedLinkId,
  selectedNodeId,
  statusLabel,
  statusTone = 'neutral',
  subtitle,
  theme = DEFAULT_THEME,
  title,
}: SankeyFlowDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(960);
  const height = 640;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = Math.max(Math.floor(entries[0]?.contentRect.width ?? 960), 420);
      setWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      );
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const sankeyGraph = useMemo(() => {
    const sankeyLayout = sankey<InternalNode, InternalLink>()
      .nodeId((node) => node.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(18)
      .nodePadding(14)
      .extent([
        [28, 28],
        [width - 28, height - 32],
      ]);

    return sankeyLayout({
      links: links.map((link) => ({ ...link })),
      nodes: nodes.map((node) => ({ ...node })),
    }) as SankeyGraph<InternalNode, InternalLink>;
  }, [height, links, nodes, width]);

  const linkPath = useMemo(
    () => sankeyLinkHorizontal<InternalNode, InternalLink>(),
    [],
  );

  if (nodes.length === 0 || links.length === 0) {
    return (
      <div
        className="flex h-[640px] items-center justify-center rounded-[var(--ui-radius-panel)] border px-6 text-sm"
        style={{
          background: theme.emptyBackground,
          borderColor: theme.borderColor,
          color: theme.textSecondary,
        }}
      >
        {emptyLabel}
      </div>
    );
  }

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
            <p
              className="ui-studio-label font-semibold uppercase tracking-[0.26em]"
              style={{ color: theme.textSecondary }}
            >
              Flow stage
            </p>
            <p
              className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem]"
              style={{ color: theme.textPrimary }}
            >
              {title}
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {subtitle ??
                'Trace upstream and downstream energy movement through a single Sankey stage.'}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1 text-xs font-medium"
            style={getStatusStyle(statusTone, theme)}
          >
            <span className="size-2 rounded-full bg-cyan-600" />
            {statusLabel ?? 'Sankey ready'}
          </div>
        </div>
        {legend?.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: theme.textSecondary }}>
            <span className="font-semibold uppercase tracking-[0.2em]">Stages</span>
            {legend.map((entry) => (
              <span key={entry.label} className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <svg
        aria-label={title}
        className="block w-full"
        role="img"
        style={{ background: theme.plotBackground }}
        viewBox={`0 0 ${width} ${height}`}
      >
        <g>
          {sankeyGraph.links.map((link: InternalLink) => {
            const isSelected = link.id === selectedLinkId;
            const sourceId = getLinkEndpointId(link.source);
            const targetId = getLinkEndpointId(link.target);
            const nodeSelected =
              sourceId === selectedNodeId || targetId === selectedNodeId;

            return (
              <path
                d={linkPath(link) ?? undefined}
                fill="none"
                key={link.id}
                onClick={() => onSelectLink?.(link.id)}
                onMouseEnter={() => onHoverLink?.(link.id)}
                onMouseLeave={() => onHoverLink?.(undefined)}
                stroke={link.color}
                strokeOpacity={isSelected ? 0.82 : nodeSelected ? 0.56 : 0.34}
                strokeWidth={Math.max(1, link.width ?? 1)}
                style={{ cursor: 'pointer' }}
              >
                <title>
                  {getLinkEndpointLabel(link.source)} to {getLinkEndpointLabel(link.target)} · {link.value}
                </title>
              </path>
            );
          })}
        </g>

        <g>
          {sankeyGraph.nodes.map((node: InternalNode) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <g key={node.id}>
                <rect
                  fill={node.color}
                  height={Math.max(1, (node.y1 ?? 0) - (node.y0 ?? 0))}
                  onClick={() => onSelectNode?.(node.id)}
                  onMouseEnter={() => onHoverNode?.(node.id)}
                  onMouseLeave={() => onHoverNode?.(undefined)}
                  rx={8}
                  ry={8}
                  stroke={isSelected ? theme.selectionStroke : 'rgba(255,255,255,0.92)'}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ cursor: 'pointer' }}
                  width={Math.max(1, (node.x1 ?? 0) - (node.x0 ?? 0))}
                  x={node.x0}
                  y={node.y0}
                />
                <text
                  fill={theme.textPrimary}
                  fontSize="11"
                  fontWeight={isSelected ? 700 : 500}
                  textAnchor={(node.x0 ?? 0) < width / 2 ? 'start' : 'end'}
                  x={(node.x0 ?? 0) < width / 2 ? (node.x1 ?? 0) + 10 : (node.x0 ?? 0) - 10}
                  y={((node.y0 ?? 0) + (node.y1 ?? 0)) / 2}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
