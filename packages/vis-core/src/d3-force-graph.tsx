import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  zoom,
  zoomIdentity,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
  type ZoomTransform,
} from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { D3ScatterPlotTheme } from './d3-scatter-plot';

export type ForceGraphNodeDatum = {
  color: string;
  degree: number;
  group: number;
  id: string;
  label: string;
  radius: number;
  selected?: boolean;
  weightedDegree: number;
};

export type ForceGraphEdgeDatum = {
  id: string;
  source: string;
  target: string;
  value: number;
};

type ForceGraphSimulationNode = ForceGraphNodeDatum & SimulationNodeDatum;
type ForceGraphSimulationEdge = ForceGraphEdgeDatum & SimulationLinkDatum<ForceGraphSimulationNode>;

export type D3ForceGraphProps = {
  edges: ForceGraphEdgeDatum[];
  emptyLabel?: string;
  height?: number;
  legend?: Array<{ color: string; label: string }>;
  nodes: ForceGraphNodeDatum[];
  onHover?: (id?: string) => void;
  onSelect?: (id: string) => void;
  selectedId?: string;
  statusLabel?: string;
  statusTone?: 'accent' | 'neutral' | 'warning' | 'error';
  subtitle?: string;
  theme?: D3ScatterPlotTheme;
  title: string;
};

const DEFAULT_WIDTH = 880;
const DEFAULT_HEIGHT = 520;
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
  tone: D3ForceGraphProps['statusTone'],
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

function toScreenCoordinates(
  event: PointerEvent | React.PointerEvent<SVGCircleElement>,
  element: SVGSVGElement,
  width: number,
  height: number,
) {
  const bounds = element.getBoundingClientRect();
  const scaleX = width / bounds.width;
  const scaleY = height / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY,
  };
}

export function D3ForceGraph({
  edges,
  emptyLabel = 'No nodes match the current filters.',
  height = DEFAULT_HEIGHT,
  legend,
  nodes,
  onHover,
  onSelect,
  selectedId,
  statusLabel,
  statusTone = 'neutral',
  subtitle,
  theme = DEFAULT_THEME,
  title,
}: D3ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodeMapRef = useRef<Map<string, ForceGraphSimulationNode>>(new Map());
  const simulationRef = useRef<ReturnType<typeof forceSimulation<ForceGraphSimulationNode>> | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hoveredId, setHoveredId] = useState<string>();
  const [, setRenderVersion] = useState(0);

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

  useEffect(() => {
    const svgNode = svgRef.current;
    if (!svgNode) {
      return;
    }

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3.5])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    const selection = select(svgNode);
    selection.call(behavior);

    return () => {
      selection.on('.zoom', null);
    };
  }, []);

  const simulationNodes = useMemo(() => {
    return nodes.map((node) => {
      const previousNode = nodeMapRef.current.get(node.id);
      return {
        ...node,
        fx: previousNode?.fx ?? null,
        fy: previousNode?.fy ?? null,
        x: previousNode?.x ?? width / 2 + (Math.random() - 0.5) * 80,
        y: previousNode?.y ?? height / 2 + (Math.random() - 0.5) * 80,
      } satisfies ForceGraphSimulationNode;
    });
  }, [height, nodes, width]);

  const simulationEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      source: edge.source,
      target: edge.target,
    })) satisfies ForceGraphSimulationEdge[];
  }, [edges]);

  useEffect(() => {
    nodeMapRef.current = new Map(simulationNodes.map((node) => [node.id, node]));

    const linkForce = forceLink<ForceGraphSimulationNode, ForceGraphSimulationEdge>(simulationEdges)
      .id((node) => node.id)
      .distance((edge) => 48 + edge.value * 5)
      .strength(0.28);

    const simulation =
      simulationRef.current ??
      forceSimulation<ForceGraphSimulationNode>()
        .force('charge', forceManyBody().strength(-165))
        .force('collide', forceCollide<ForceGraphSimulationNode>().radius((node) => node.radius + 4).strength(0.7))
        .force('center', forceCenter(width / 2, height / 2));

    simulationRef.current = simulation;
    simulation.nodes(simulationNodes);
    simulation.force('link', linkForce);
    simulation.force('collide', forceCollide<ForceGraphSimulationNode>().radius((node) => node.radius + 4).strength(0.7));
    simulation.force('center', forceCenter(width / 2, height / 2));
    simulation.alpha(0.85).restart();
    simulation.on('tick', () => {
      setRenderVersion((renderVersion) => renderVersion + 1);
    });

    return () => {
      simulation.on('tick', null);
    };
  }, [height, simulationEdges, simulationNodes, width]);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
      simulationRef.current?.stop();
    };
  }, []);

  const renderedEdges = simulationEdges
    .map((edge) => {
      const sourceNode =
        typeof edge.source === 'string' ? nodeMapRef.current.get(edge.source) : edge.source;
      const targetNode =
        typeof edge.target === 'string' ? nodeMapRef.current.get(edge.target) : edge.target;

      if (!sourceNode || !targetNode) {
        return undefined;
      }

      return {
        ...edge,
        sourceNode,
        targetNode,
      };
    })
    .filter((edge): edge is NonNullable<typeof edge> => Boolean(edge));

  const startNodeDrag = (nodeId: string, event: React.PointerEvent<SVGCircleElement>) => {
    const svgNode = svgRef.current;
    const draggingNode = nodeMapRef.current.get(nodeId);
    const simulation = simulationRef.current;

    if (!svgNode || !draggingNode || !simulation) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    draggingNode.fx = draggingNode.x ?? width / 2;
    draggingNode.fy = draggingNode.y ?? height / 2;
    simulation.alphaTarget(0.25).restart();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const point = toScreenCoordinates(moveEvent, svgNode, width, height);
      draggingNode.fx = transform.invertX(point.x);
      draggingNode.fy = transform.invertY(point.y);
      setRenderVersion((renderVersion) => renderVersion + 1);
    };

    const handlePointerUp = () => {
      draggingNode.fx = null;
      draggingNode.fy = null;
      simulation.alphaTarget(0);
      svgNode.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dragCleanupRef.current = null;
    };

    svgNode.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dragCleanupRef.current = handlePointerUp;
  };

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
              Graph canvas
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem]" style={{ color: theme.textPrimary }}>
              {title}
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {subtitle ?? `${nodes.length} nodes and ${edges.length} edges in the active subgraph`}
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
            {statusLabel ?? 'Graph ready'}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: theme.textSecondary }}>
          <span className="font-semibold uppercase tracking-[0.2em]">D3 force graph</span>
          {legend?.map((entry) => (
            <span key={entry.label} className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.label}
            </span>
          ))}
        </div>
      </div>

      {nodes.length === 0 ? (
        <div
          className="flex h-[420px] items-center justify-center px-6 text-sm"
          style={{ background: theme.emptyBackground, color: theme.textSecondary }}
        >
          {emptyLabel}
        </div>
      ) : (
        <svg
          ref={svgRef}
          aria-label={title}
          className="block w-full cursor-grab active:cursor-grabbing"
          role="img"
          style={{ background: theme.plotBackground }}
          viewBox={`0 0 ${width} ${height}`}
        >
          <g transform={transform.toString()}>
            {renderedEdges.map((edge) => (
              <line
                key={edge.id}
                stroke={theme.gridColor}
                strokeLinecap="round"
                strokeOpacity={0.74}
                strokeWidth={1 + edge.value * 0.45}
                x1={edge.sourceNode.x ?? width / 2}
                x2={edge.targetNode.x ?? width / 2}
                y1={edge.sourceNode.y ?? height / 2}
                y2={edge.targetNode.y ?? height / 2}
              />
            ))}

            {simulationNodes.map((node) => {
              const isSelected = node.id === selectedId || node.selected;
              const isHovered = node.id === hoveredId;

              return (
                <g key={node.id} transform={`translate(${node.x ?? width / 2} ${node.y ?? height / 2})`}>
                  {(isSelected || isHovered) ? (
                    <circle
                      fill={`${node.color}24`}
                      r={node.radius + (isSelected ? 8 : 6)}
                    />
                  ) : null}
                  <circle
                    aria-label={node.label}
                    className="cursor-pointer touch-none select-none"
                    fill={node.color}
                    onClick={() => onSelect?.(node.id)}
                    onMouseEnter={() => {
                      setHoveredId(node.id);
                      onHover?.(node.id);
                    }}
                    onMouseLeave={() => {
                      setHoveredId((currentId) => (currentId === node.id ? undefined : currentId));
                      onHover?.(undefined);
                    }}
                    onPointerDown={(event) => startNodeDrag(node.id, event)}
                    r={isSelected ? node.radius + 1.5 : node.radius}
                    stroke={isSelected ? theme.selectionStroke : 'rgba(255,255,255,0.92)'}
                    strokeWidth={isSelected ? 2.6 : 1.6}
                  >
                    <title>{`${node.label} · group ${node.group} · degree ${node.degree}`}</title>
                  </circle>
                  {(isSelected || isHovered) ? (
                    <text
                      fill={theme.textPrimary}
                      fontSize="11"
                      fontWeight="600"
                      stroke="rgba(255,255,255,0.96)"
                      strokeWidth="3"
                      paintOrder="stroke"
                      textAnchor="middle"
                      y={-(node.radius + 12)}
                    >
                      {node.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
}
