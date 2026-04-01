'use client';

import { useMemo } from 'react';

import type { GraphQueryResult } from '@va/contracts';
import {
  D3ForceGraph,
  MultivariateNetworkView,
  type D3ScatterPlotTheme,
  type MultivariateLayoutMode,
} from '@va/vis-core';

import {
  deriveMultivariateNodes,
  getMultivariateFieldProfiles,
  getMultivariateValue,
  summarizeMultivariateFacets,
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

function formatFieldLabel(field: string) {
  return field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatProfileRange(minimum?: number, maximum?: number) {
  if (minimum === undefined || maximum === undefined) {
    return 'No range';
  }

  return `${minimum.toFixed(2)} to ${maximum.toFixed(2)}`;
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
  const enrichedNodes = useMemo(
    () => deriveMultivariateNodes(result, selectedId),
    [result, selectedId],
  );
  const enrichedNodeById = useMemo(
    () => new Map(enrichedNodes.map((node) => [node.id, node])),
    [enrichedNodes],
  );
  const fieldProfiles = useMemo(
    () => getMultivariateFieldProfiles(enrichedNodes),
    [enrichedNodes],
  );
  const profileByField = useMemo(
    () => new Map(fieldProfiles.map((profile) => [profile.field, profile])),
    [fieldProfiles],
  );

  const colorFieldValues = useMemo(
    () =>
      enrichedNodes
        .map((node) => getMultivariateValue(node, config.colorField))
        .filter((value): value is number => typeof value === 'number'),
    [config.colorField, enrichedNodes],
  );
  const sizeFieldValues = useMemo(
    () =>
      enrichedNodes
        .map((node) => getMultivariateValue(node, config.sizeField))
        .filter((value): value is number => typeof value === 'number'),
    [config.sizeField, enrichedNodes],
  );
  const xFieldValues = useMemo(
    () =>
      enrichedNodes
        .map((node) => getMultivariateValue(node, config.xField))
        .filter((value): value is number => typeof value === 'number'),
    [config.xField, enrichedNodes],
  );
  const yFieldValues = useMemo(
    () =>
      enrichedNodes
        .map((node) => getMultivariateValue(node, config.yField))
        .filter((value): value is number => typeof value === 'number'),
    [config.yField, enrichedNodes],
  );

  const nodeSizeScale = useMemo(
    () => buildNumericScale(sizeFieldValues, [7.5, 18]),
    [sizeFieldValues],
  );
  const numericColorScale = useMemo(
    () => buildEdgeColorScale(colorFieldValues),
    [colorFieldValues],
  );
  const xScale = useMemo(() => buildNumericScale(xFieldValues, [0, 1]), [xFieldValues]);
  const yScale = useMemo(() => buildNumericScale(yFieldValues, [0, 1]), [yFieldValues]);

  const categoricalValues = useMemo(
    () =>
      Array.from(
        new Set(
          enrichedNodes
            .map((node) => getMultivariateValue(node, config.colorField))
            .filter((value): value is string => typeof value === 'string'),
        ),
      ),
    [config.colorField, enrichedNodes],
  );
  const categoryColorMap = useMemo(
    () =>
      new Map(
        categoricalValues.map((value, index) => [value, getGraphGroupColor(index + 1)]),
      ),
    [categoricalValues],
  );

  const viewNodes = useMemo(
    () =>
      enrichedNodes.map((node) => {
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
      }),
    [
      categoryColorMap,
      config.colorField,
      config.facetField,
      config.sizeField,
      config.xField,
      config.yField,
      enrichedNodes,
      nodeSizeScale,
      numericColorScale,
      xScale,
      yScale,
    ],
  );
  const nodeById = useMemo(
    () => new Map(viewNodes.map((node) => [node.id, node])),
    [viewNodes],
  );

  const edgeWeightValues = useMemo(
    () => (result?.edges ?? []).map((edge) => edge.value),
    [result?.edges],
  );
  const edgeWidthScale = useMemo(
    () => buildNumericScale(edgeWeightValues, [0.9, 4.5]),
    [edgeWeightValues],
  );
  const edgeColorScale = useMemo(
    () => buildEdgeColorScale(edgeWeightValues),
    [edgeWeightValues],
  );

  const viewEdges = useMemo(
    () =>
      (result?.edges ?? []).map((edge) => {
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
      }),
    [
      config.edgeColorField,
      config.edgeWidthField,
      edgeColorScale,
      edgeWidthScale,
      nodeById,
      result?.edges,
    ],
  );

  const legend = useMemo(() => {
    if (categoricalValues.length > 0) {
      return Array.from(categoryColorMap.entries())
        .slice(0, 6)
        .map(([label, color]) => ({ color, label }));
    }

    const numericProfile = profileByField.get(config.colorField);
    if (numericProfile?.kind !== 'numeric') {
      return [];
    }

    return [
      {
        color: numericColorScale(numericProfile.min ?? 0),
        label: `Low ${numericProfile.min?.toFixed(2) ?? '0.00'}`,
      },
      {
        color: numericColorScale(numericProfile.max ?? 1),
        label: `High ${numericProfile.max?.toFixed(2) ?? '1.00'}`,
      },
    ];
  }, [
    categoryColorMap,
    categoricalValues.length,
    config.colorField,
    numericColorScale,
    profileByField,
  ]);

  const facetSummary = useMemo(
    () => summarizeMultivariateFacets(enrichedNodes, config.facetField),
    [config.facetField, enrichedNodes],
  );

  const encodingSummary = useMemo(() => {
    const sizeProfile = profileByField.get(config.sizeField);
    const colorProfile = profileByField.get(config.colorField);

    return [
      {
        label: 'Size',
        value:
          sizeProfile?.kind === 'numeric'
            ? `${formatFieldLabel(config.sizeField)} · ${formatProfileRange(sizeProfile.min, sizeProfile.max)}`
            : formatFieldLabel(config.sizeField),
      },
      {
        label: 'Color',
        value:
          colorProfile?.kind === 'numeric'
            ? `${formatFieldLabel(config.colorField)} · ${formatProfileRange(colorProfile.min, colorProfile.max)}`
            : `${formatFieldLabel(config.colorField)} · ${colorProfile?.categoryCount ?? categoricalValues.length} categories`,
      },
      {
        label: 'Edges',
        value: `Width ${formatFieldLabel(config.edgeWidthField)} · Color ${formatFieldLabel(config.edgeColorField)}`,
      },
    ];
  }, [
    categoricalValues.length,
    config.colorField,
    config.edgeColorField,
    config.edgeWidthField,
    config.sizeField,
    profileByField,
  ]);

  const layoutLabel = useMemo(() => {
    switch (config.layoutMode) {
      case 'attribute-position':
        return 'Attribute position';
      case 'faceted':
        return config.facetField
          ? `Faceted by ${formatFieldLabel(config.facetField)}`
          : 'Faceted';
      default:
        return 'Encoded force';
    }
  }, [config.facetField, config.layoutMode]);

  const legendTitle = useMemo(
    () => `Color by ${formatFieldLabel(config.colorField)}`,
    [config.colorField],
  );

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
        legend={legend}
        legendTitle={legendTitle}
        nodes={viewNodes.map((node) => ({
          color: node.color,
          degree: enrichedNodeById.get(node.id)?.degree ?? 0,
          group: node.group,
          id: node.id,
          label: node.label,
          radius: node.radius,
          selected: node.id === selectedId,
          weightedDegree: enrichedNodeById.get(node.id)?.weightedDegree ?? 0,
        }))}
        onSelect={onSelect}
        selectedId={selectedId}
        statusLabel={statusLabel}
        statusTone={statusTone}
        subtitle={`Topology-first multivariate encoding for ${datasetLabel}. Size, color, and links are driven by analytics fields.`}
        summaryItems={encodingSummary}
        theme={theme}
        title={`${datasetLabel} encoded force graph`}
      />
    );
  }

  return (
    <MultivariateNetworkView
      edges={viewEdges}
      encodingSummary={encodingSummary}
      emptyLabel="No multivariate nodes are available for the active graph state."
      facetSummary={config.layoutMode === 'faceted' ? facetSummary : []}
      layoutLabel={layoutLabel}
      layoutMode={config.layoutMode as Extract<MultivariateLayoutMode, 'attribute-position' | 'faceted'>}
      legend={legend}
      legendTitle={legendTitle}
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
