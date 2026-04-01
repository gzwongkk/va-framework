'use client';

import type { GraphQueryResult } from '@va/contracts';
import {
  D3ForceGraph,
  MultivariateNetworkView,
  type D3ScatterPlotTheme,
  type MultivariateLayoutMode,
} from '@va/vis-core';

import {
  deriveMultivariateNodes,
  getMultivariateValue,
} from '@/lib/analytics/graph-workbench-analytics';
import { getGraphGroupColor } from '@/lib/analytics/graph-analytics';
import type { MultivariateEncodingConfig } from '@/lib/graph-workbench-store';

type GraphWorkbenchMultivariatePanelProps = {
  config: MultivariateEncodingConfig;
  datasetLabel: string;
  onSelect: (id: string) => void;
  result: GraphQueryResult | undefined;
  selectedId?: string;
  statusLabel: string;
  statusTone: 'accent' | 'neutral' | 'warning' | 'error';
  theme: D3ScatterPlotTheme;
};

const DEFAULT_FALLBACK_COLOR = '#2f607d';

function buildNumericScale(values: number[], range: [number, number]) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum === maximum) {
    return () => (range[0] + range[1]) / 2;
  }

  const [start, end] = range;
  const span = maximum - minimum;
  return (value: number) => start + ((value - minimum) / span) * (end - start);
}

function buildEdgeColorScale(values: number[]) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum === maximum) {
    return () => '#2f607d';
  }

  const start = { blue: 228, green: 212, red: 182 };
  const end = { blue: 125, green: 96, red: 47 };
  const span = maximum - minimum;

  return (value: number) => {
    const ratio = Math.max(0, Math.min(1, (value - minimum) / span));
    const red = Math.round(start.red + (end.red - start.red) * ratio);
    const green = Math.round(start.green + (end.green - start.green) * ratio);
    const blue = Math.round(start.blue + (end.blue - start.blue) * ratio);
    return `rgb(${red}, ${green}, ${blue})`;
  };
}

export function GraphWorkbenchMultivariatePanel({
  config,
  datasetLabel,
  onSelect,
  result,
  selectedId,
  statusLabel,
  statusTone,
  theme,
}: GraphWorkbenchMultivariatePanelProps) {
  const enrichedNodes = deriveMultivariateNodes(result, selectedId);
  const colorFieldValues = enrichedNodes
    .map((node) => getMultivariateValue(node, config.colorField))
    .filter((value): value is number => typeof value === 'number');
  const sizeFieldValues = enrichedNodes
    .map((node) => getMultivariateValue(node, config.sizeField))
    .filter((value): value is number => typeof value === 'number');
  const xFieldValues = enrichedNodes
    .map((node) => getMultivariateValue(node, config.xField))
    .filter((value): value is number => typeof value === 'number');
  const yFieldValues = enrichedNodes
    .map((node) => getMultivariateValue(node, config.yField))
    .filter((value): value is number => typeof value === 'number');

  const nodeSizeScale = buildNumericScale(sizeFieldValues, [7.5, 18]);
  const numericColorScale = buildEdgeColorScale(colorFieldValues);
  const xScale = buildNumericScale(xFieldValues, [0, 1]);
  const yScale = buildNumericScale(yFieldValues, [0, 1]);

  const categoricalValues = Array.from(
    new Set(
      enrichedNodes
        .map((node) => getMultivariateValue(node, config.colorField))
        .filter((value): value is string => typeof value === 'string'),
    ),
  );
  const categoryColorMap = new Map(
    categoricalValues.map((value, index) => [value, getGraphGroupColor(index + 1)]),
  );

  const viewNodes = enrichedNodes.map((node) => {
    const rawColorValue = getMultivariateValue(node, config.colorField);
    const rawSizeValue = getMultivariateValue(node, config.sizeField);
    const xValue = getMultivariateValue(node, config.xField);
    const yValue = getMultivariateValue(node, config.yField);
    const facetValue = config.facetField ? getMultivariateValue(node, config.facetField) : undefined;

    return {
      color:
        typeof rawColorValue === 'number'
          ? numericColorScale(rawColorValue)
          : typeof rawColorValue === 'string'
            ? categoryColorMap.get(rawColorValue) ?? DEFAULT_FALLBACK_COLOR
            : '#9aa9b5',
      facet:
        typeof facetValue === 'string' || typeof facetValue === 'number'
          ? String(facetValue)
          : config.facetField
            ? 'Missing'
            : undefined,
      group: node.group,
      id: node.id,
      label: node.label,
      radius:
        typeof rawSizeValue === 'number'
          ? Number(nodeSizeScale(rawSizeValue).toFixed(2))
          : 7.5,
      xValue: typeof xValue === 'number' ? Number(xScale(xValue).toFixed(3)) : 0.5,
      yValue: typeof yValue === 'number' ? Number(yScale(yValue).toFixed(3)) : 0.5,
    };
  });

  const nodeById = new Map(viewNodes.map((node) => [node.id, node]));
  const edgeWeightValues = (result?.edges ?? []).map((edge) => edge.value);
  const edgeWidthScale = buildNumericScale(edgeWeightValues, [0.9, 4.5]);
  const edgeColorScale = buildEdgeColorScale(edgeWeightValues);
  const viewEdges = (result?.edges ?? []).map((edge) => {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    const sameGroup = sourceNode && targetNode ? sourceNode.group === targetNode.group : false;

    const color =
      config.edgeColorField === 'value'
        ? edgeColorScale(edge.value)
        : sameGroup
          ? sourceNode?.color ?? DEFAULT_FALLBACK_COLOR
          : '#8aa5b5';

    const width =
      config.edgeWidthField === 'value'
        ? edgeWidthScale(edge.value)
        : sameGroup
          ? 2.6
          : 1.2;

    return {
      color,
      id: edge.id,
      source: edge.source,
      target: edge.target,
      value: edge.value,
      width: Number(width.toFixed(2)),
    };
  });

  if (config.layoutMode === 'encoded-force') {
    return (
      <D3ForceGraph
        edges={viewEdges.map((edge) => ({
          color: edge.color,
          id: edge.id,
          source: edge.source,
          strokeOpacity: 0.48,
          target: edge.target,
          value: edge.value,
          width: edge.width,
        }))}
        emptyLabel="No multivariate nodes are available for the active graph state."
        height={640}
        legend={Array.from(categoryColorMap.entries()).slice(0, 6).map(([label, color]) => ({ color, label }))}
        nodes={viewNodes.map((node) => ({
          color: node.color,
          degree: enrichedNodes.find((candidate) => candidate.id === node.id)?.degree ?? 0,
          group: node.group,
          id: node.id,
          label: node.label,
          radius: node.radius,
          selected: node.id === selectedId,
          weightedDegree: enrichedNodes.find((candidate) => candidate.id === node.id)?.weightedDegree ?? 0,
        }))}
        onSelect={onSelect}
        selectedId={selectedId}
        statusLabel={statusLabel}
        statusTone={statusTone}
        subtitle={`Topology-first multivariate encoding for ${datasetLabel}. Size, color, and links are driven by analytics fields.`}
        theme={theme}
        title={`${datasetLabel} encoded force graph`}
      />
    );
  }

  return (
    <MultivariateNetworkView
      edges={viewEdges}
      emptyLabel="No multivariate nodes are available for the active graph state."
      layoutMode={config.layoutMode as Extract<MultivariateLayoutMode, 'attribute-position' | 'faceted'>}
      nodes={viewNodes}
      onSelect={onSelect}
      selectedId={selectedId}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle={`Analytical positioning for ${datasetLabel} using ${config.xField} and ${config.yField}.`}
      theme={theme}
      title={`${datasetLabel} multivariate network`}
      xLabel={config.xField}
      yLabel={config.yField}
    />
  );
}
