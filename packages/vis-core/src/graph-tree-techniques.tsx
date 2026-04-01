import { arc, cluster, hierarchy, partition, tree } from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { D3ScatterPlotTheme } from './d3-scatter-plot';

export type TechniqueHierarchyNode = {
  children: TechniqueHierarchyNode[];
  depth: number;
  group: number;
  id: string;
  label: string;
  value: number;
};

export type TreeTechniqueMode = 'node-link' | 'icicle' | 'sunburst';
export type TreeAlignment = 'axis-parallel' | 'radial';

export type GraphTreeTechniquesProps = {
  alignment: TreeAlignment;
  emptyLabel?: string;
  onSelect?: (id: string) => void;
  root: TechniqueHierarchyNode | undefined;
  selectedPathIds?: string[];
  selectedId?: string;
  statusLabel?: string;
  statusTone?: 'accent' | 'neutral' | 'warning' | 'error';
  subtitle?: string;
  theme?: D3ScatterPlotTheme;
  title: string;
  mode: TreeTechniqueMode;
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
  tone: GraphTreeTechniquesProps['statusTone'],
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

function colorForGroup(group: number) {
  const palette = ['#2f607d', '#2aa876', '#d97745', '#7b6bb7', '#bc5b7d', '#4d8bc6', '#8a9b3f'];
  const index = Math.max(0, Math.round(group)) % palette.length;
  return palette[index] ?? palette[0];
}

export function GraphTreeTechniques({
  alignment,
  emptyLabel = 'No hierarchy is available for the current dataset.',
  mode,
  onSelect,
  root,
  selectedId,
  selectedPathIds = [],
  statusLabel,
  statusTone = 'neutral',
  subtitle,
  theme = DEFAULT_THEME,
  title,
}: GraphTreeTechniquesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(880);
  const height = 640;

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

  const hierarchyRoot = useMemo(
    () => (root ? hierarchy(root).sum((node) => Math.max(node.value, 1)) : undefined),
    [root],
  );

  const arcGenerator = useMemo(
    () =>
      arc<any>()
        .startAngle((node) => node.x0)
        .endAngle((node) => node.x1)
        .innerRadius((node) => node.y0)
        .outerRadius((node) => node.y1 - 1),
    [],
  );

  const layoutData = useMemo(() => {
    if (!hierarchyRoot) {
      return undefined;
    }

    const radius = Math.min(width, height) / 2 - 48;
    const margin = { top: 40, right: 36, bottom: 32, left: 48 };

    if (mode === 'node-link' && alignment === 'axis-parallel') {
      const rootNode = hierarchyRoot.copy() as any;
      tree<TechniqueHierarchyNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right])(
        rootNode,
      );
      return { margin, radius, rootNode };
    }

    if (mode === 'node-link' && alignment === 'radial') {
      const rootNode = hierarchyRoot.copy() as any;
      cluster<TechniqueHierarchyNode>().size([Math.PI * 2, radius])(rootNode);
      return { margin, radius, rootNode };
    }

    if (mode === 'icicle') {
      const rootNode = hierarchyRoot.copy() as any;
      partition<TechniqueHierarchyNode>().size([width - margin.left - margin.right, height - margin.top - margin.bottom])(
        rootNode,
      );
      return { margin, radius, rootNode };
    }

    const rootNode = hierarchyRoot.copy() as any;
    partition<TechniqueHierarchyNode>().size([Math.PI * 2, radius])(rootNode);
    return { margin, radius, rootNode };
  }, [alignment, height, hierarchyRoot, mode, width]);

  if (!layoutData || !root) {
    return (
      <div
        className="flex h-[640px] items-center justify-center rounded-[var(--ui-radius-panel)] border px-6 text-sm"
        style={{ background: theme.emptyBackground, borderColor: theme.borderColor, color: theme.textSecondary }}
      >
        {emptyLabel}
      </div>
    );
  }

  const isRadialNodeLink = mode === 'node-link' && alignment === 'radial';
  const isIcicle = mode === 'icicle';
  const isSunburst = mode === 'sunburst';
  const selectedPathIdSet = useMemo(() => new Set(selectedPathIds), [selectedPathIds]);

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
              Tree techniques
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[1.45rem]" style={{ color: theme.textPrimary }}>
              {title}
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {subtitle ?? 'Switch between explicit and implicit hierarchy layouts while keeping the same dataset and selection state.'}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] border px-3 py-1 text-xs font-medium"
            style={getStatusStyle(statusTone, theme)}
          >
            <span className="size-2 rounded-full bg-cyan-600" />
            {statusLabel ?? 'Tree view ready'}
          </div>
        </div>
      </div>

      <svg aria-label={title} className="block w-full" role="img" viewBox={`0 0 ${width} ${height}`} style={{ background: theme.plotBackground }}>
        {isRadialNodeLink ? (
          <g transform={`translate(${width / 2}, ${height / 2 + 24})`}>
            {layoutData.rootNode.links().map((link: any) => {
              const sourceAngle = (link.source.x ?? 0) - Math.PI / 2;
              const targetAngle = (link.target.x ?? 0) - Math.PI / 2;
              const sourceX = Math.cos(sourceAngle) * (link.source.y ?? 0);
              const sourceY = Math.sin(sourceAngle) * (link.source.y ?? 0);
              const targetX = Math.cos(targetAngle) * (link.target.y ?? 0);
              const targetY = Math.sin(targetAngle) * (link.target.y ?? 0);
              const isSelectedPath =
                selectedPathIdSet.has(link.source.data.id) && selectedPathIdSet.has(link.target.data.id);
              return (
                <line
                  key={`${link.source.data.id}:${link.target.data.id}`}
                  stroke={isSelectedPath ? theme.selectionStroke : theme.gridColor}
                  strokeWidth={isSelectedPath ? 2.2 : 1}
                  x1={sourceX}
                  x2={targetX}
                  y1={sourceY}
                  y2={targetY}
                />
              );
            })}
            {layoutData.rootNode.descendants().map((node: any) => {
              const angle = (node.x ?? 0) - Math.PI / 2;
              const x = Math.cos(angle) * (node.y ?? 0);
              const y = Math.sin(angle) * (node.y ?? 0);
              const isSelected = node.data.id === selectedId;
              const isPathNode = selectedPathIdSet.has(node.data.id);
              return (
                <g key={node.data.id} transform={`translate(${x} ${y})`}>
                  <circle
                    fill={colorForGroup(node.data.group)}
                    onClick={() => onSelect?.(node.data.id)}
                    r={isSelected ? 6.5 : isPathNode ? 5.5 : 4.6}
                    stroke={isSelected || isPathNode ? theme.selectionStroke : 'rgba(255,255,255,0.92)'}
                    strokeWidth={isSelected ? 2.2 : isPathNode ? 1.4 : 1}
                    style={{ cursor: 'pointer' }}
                  />
                  {(node.depth < 2 || isSelected || isPathNode) ? (
                    <text
                      fill={theme.textSecondary}
                      fontSize="10"
                      textAnchor={x >= 0 ? 'start' : 'end'}
                      x={x >= 0 ? 8 : -8}
                      y={3}
                    >
                      {node.data.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        ) : null}

        {mode === 'node-link' && alignment === 'axis-parallel' ? (
          <g transform={`translate(${layoutData.margin.left}, ${layoutData.margin.top})`}>
            {layoutData.rootNode.links().map((link: any) => {
              const isSelectedPath =
                selectedPathIdSet.has(link.source.data.id) && selectedPathIdSet.has(link.target.data.id);
              return (
                <path
                  key={`${link.source.data.id}:${link.target.data.id}`}
                  d={`M${link.source.y ?? 0},${link.source.x ?? 0}C${((link.source.y ?? 0) + (link.target.y ?? 0)) / 2},${link.source.x ?? 0} ${((link.source.y ?? 0) + (link.target.y ?? 0)) / 2},${link.target.x ?? 0} ${link.target.y ?? 0},${link.target.x ?? 0}`}
                  fill="none"
                  stroke={isSelectedPath ? theme.selectionStroke : theme.gridColor}
                  strokeWidth={isSelectedPath ? 2.1 : 1.1}
                />
              );
            })}
            {layoutData.rootNode.descendants().map((node: any) => {
              const isSelected = node.data.id === selectedId;
              const isPathNode = selectedPathIdSet.has(node.data.id);
              return (
                <g key={node.data.id} transform={`translate(${node.y ?? 0} ${node.x ?? 0})`}>
                  <circle
                    fill={colorForGroup(node.data.group)}
                    onClick={() => onSelect?.(node.data.id)}
                    r={isSelected ? 6.4 : isPathNode ? 5.6 : 4.6}
                    stroke={isSelected || isPathNode ? theme.selectionStroke : 'rgba(255,255,255,0.92)'}
                    strokeWidth={isSelected ? 2.2 : isPathNode ? 1.4 : 1}
                    style={{ cursor: 'pointer' }}
                  />
                  {node.depth < 3 || isPathNode ? (
                    <text fill={theme.textSecondary} fontSize="10" x={8} y={4}>
                      {node.data.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        ) : null}

        {isIcicle ? (
          <g transform={`translate(${layoutData.margin.left}, ${layoutData.margin.top})`}>
            {layoutData.rootNode.descendants().map((node: any) => {
              const isSelected = node.data.id === selectedId;
              const isPathNode = selectedPathIdSet.has(node.data.id);
              return (
                <g key={node.data.id}>
                  <rect
                    fill={colorForGroup(node.data.group)}
                    fillOpacity={isSelected ? 1 : isPathNode ? 0.94 : 0.82}
                    height={Math.max(0, node.y1 - node.y0 - 1)}
                    onClick={() => onSelect?.(node.data.id)}
                    stroke={isSelected || isPathNode ? theme.selectionStroke : 'rgba(255,255,255,0.65)'}
                    strokeWidth={isSelected ? 1.6 : isPathNode ? 1.1 : 0.8}
                    style={{ cursor: 'pointer' }}
                    width={Math.max(0, node.x1 - node.x0 - 1)}
                    x={node.x0}
                    y={node.y0}
                  />
                  {node.depth < 2 ? (
                    <text fill={theme.textPrimary} fontSize="10" x={node.x0 + 6} y={node.y0 + 14}>
                      {node.data.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        ) : null}

        {isSunburst ? (
          <g transform={`translate(${width / 2}, ${height / 2 + 24})`}>
            {layoutData.rootNode.descendants().map((node: any) => {
              const isSelected = node.data.id === selectedId;
              const isPathNode = selectedPathIdSet.has(node.data.id);
              return (
                <path
                  key={node.data.id}
                  d={arcGenerator(node) ?? undefined}
                  fill={colorForGroup(node.data.group)}
                  fillOpacity={isSelected ? 1 : isPathNode ? 0.96 : 0.84}
                  onClick={() => onSelect?.(node.data.id)}
                  stroke={isSelected || isPathNode ? theme.selectionStroke : 'rgba(255,255,255,0.55)'}
                  strokeWidth={isSelected ? 1.5 : isPathNode ? 1.1 : 0.8}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </g>
        ) : null}
      </svg>
    </div>
  );
}
