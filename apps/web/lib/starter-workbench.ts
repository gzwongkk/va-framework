import type { DatasetDescriptor, DataKindAdapterId, DatasetStarterMetadata } from '@va/contracts';
import type { StarterVariantDefinition, StarterWorkbenchDefinition } from '@va/view-system';

export type SupportedStarterKind = 'tabular' | 'graph';
export type StarterVariantId =
  | 'scatter'
  | 'splom'
  | 'time-series'
  | 'table'
  | 'force'
  | 'matrix'
  | 'hierarchy'
  | 'flow';

export type DataKindAdapter = StarterWorkbenchDefinition & {
  iconLabel: string;
};

export type StarterExampleId =
  | 'cars-scatter'
  | 'penguins-splom'
  | 'stocks-focus-context'
  | 'graph-force'
  | 'graph-matrix'
  | 'hierarchy-suite'
  | 'energy-sankey';

const variantCatalog: Record<StarterVariantId, StarterVariantDefinition> = {
  scatter: {
    id: 'scatter',
    label: 'Scatter',
    summary: 'Start from two quantitative measures plus one categorical split.',
  },
  splom: {
    id: 'splom',
    label: 'SPLOM',
    summary: 'Inspect several quantitative measures together with brushable cohorts.',
  },
  'time-series': {
    id: 'time-series',
    label: 'Time Series',
    summary: 'Use timestamp-driven focus and context analysis for temporal data.',
  },
  table: {
    id: 'table',
    label: 'Table',
    summary: 'Start from a detailed record view when field inspection is primary.',
  },
  force: {
    id: 'force',
    label: 'Force',
    summary: 'Begin graph analysis from a topology-first node-link layout.',
  },
  matrix: {
    id: 'matrix',
    label: 'Matrix',
    summary: 'Use adjacency ordering and brushing for dense graph comparison.',
  },
  hierarchy: {
    id: 'hierarchy',
    label: 'Hierarchy',
    summary: 'Switch into explicit and implicit tree techniques for hierarchical graphs.',
  },
  flow: {
    id: 'flow',
    label: 'Flow',
    summary: 'Trace source-target movement through a staged graph layout.',
  },
};

export const starterAdapters: Record<SupportedStarterKind, DataKindAdapter> = {
  graph: {
    defaultDatasetId: 'miserables',
    defaultVariantId: 'force',
    iconLabel: 'Graph',
    id: 'starter-graph',
    kindAdapterId: 'graph',
    label: 'Graph starter',
    summary: 'Topology-first starter for networks, hierarchies, and flow graphs.',
  },
  tabular: {
    defaultDatasetId: 'cars',
    defaultVariantId: 'scatter',
    iconLabel: 'Tabular',
    id: 'starter-tabular',
    kindAdapterId: 'tabular',
    label: 'Tabular starter',
    summary: 'Starter for analytical tables, multivariate comparisons, and time-based tabular views.',
  },
};

export const starterKindOptions = [
  { description: starterAdapters.tabular.summary, label: 'Tabular', value: 'tabular' },
  { description: starterAdapters.graph.summary, label: 'Graph', value: 'graph' },
] as const;

export function isSupportedStarterKind(value: string | null | undefined): value is SupportedStarterKind {
  return value === 'tabular' || value === 'graph';
}

export function getStarterMetadata(dataset: DatasetDescriptor | undefined): DatasetStarterMetadata | undefined {
  return dataset?.starter;
}

export function getStarterDatasets(
  datasets: DatasetDescriptor[] | undefined,
  kind: SupportedStarterKind,
): DatasetDescriptor[] {
  return (datasets ?? [])
    .filter((dataset) => dataset.starter?.kindAdapterId === kind && dataset.starter.priority !== 'seed')
    .sort((left, right) => {
      const leftPriority = left.starter?.priority === 'primary' ? 0 : 1;
      const rightPriority = right.starter?.priority === 'primary' ? 0 : 1;
      return leftPriority - rightPriority || left.title.localeCompare(right.title);
    });
}

export function resolveStarterDataset(
  datasets: DatasetDescriptor[] | undefined,
  kind: SupportedStarterKind,
  requestedDatasetId?: string,
): DatasetDescriptor | undefined {
  const visibleDatasets = getStarterDatasets(datasets, kind);
  if (requestedDatasetId) {
    const requestedDataset = visibleDatasets.find((dataset) => dataset.id === requestedDatasetId);
    if (requestedDataset) {
      return requestedDataset;
    }
  }

  return visibleDatasets.find((dataset) => dataset.starter?.priority === 'primary') ?? visibleDatasets[0];
}

export function getStarterVariants(dataset: DatasetDescriptor | undefined): StarterVariantDefinition[] {
  if (!dataset?.starter) {
    return [];
  }

  return dataset.starter.supportedVariants
    .map((variantId) => variantCatalog[variantId as StarterVariantId])
    .filter((variant): variant is StarterVariantDefinition => Boolean(variant));
}

export function getStarterVariantLabel(variantId: string) {
  const variant = variantCatalog[variantId as StarterVariantId];
  return variant?.label ?? variantId;
}

export function resolveStarterVariant(
  dataset: DatasetDescriptor | undefined,
  requestedVariantId?: string,
): StarterVariantDefinition | undefined {
  const variants = getStarterVariants(dataset);
  if (variants.length === 0) {
    return undefined;
  }

  const requestedVariant = requestedVariantId
    ? variants.find((variant) => variant.id === requestedVariantId)
    : undefined;

  return requestedVariant ?? variants.find((variant) => variant.id === dataset?.starter?.defaultVariant) ?? variants[0];
}

export function getStarterSchemaGuidance(dataset: DatasetDescriptor | undefined): string[] {
  if (!dataset) {
    return [];
  }

  const numericFieldCount = dataset.schema.fields.filter((field) => field.dataType === 'number').length;
  const guidance = [
    `Primary entity: ${dataset.schema.entity}`,
    `Detected fields: ${dataset.schema.fields.length}`,
    `Starter priority: ${dataset.starter?.priority ?? 'unassigned'}`,
  ];

  if (dataset.kind === 'tabular') {
    guidance.push(`${numericFieldCount} quantitative fields detected for starter variants.`);
    if (dataset.schema.timeField) {
      guidance.push(`Time field available: ${dataset.schema.timeField}.`);
    }
  }

  if (dataset.kind === 'graph') {
    guidance.push(`Node entity ready: ${dataset.schema.entities?.nodes?.rowCount ?? dataset.schema.rowCount ?? 0} nodes.`);
    if (dataset.schema.entities?.links?.rowCount) {
      guidance.push(`Link entity ready: ${dataset.schema.entities.links.rowCount} links.`);
    }
    if (dataset.schema.hierarchy) {
      guidance.push(`Hierarchy metadata available via ${dataset.schema.hierarchy.parentField}.`);
    }
  }

  return guidance;
}

export function getStarterHelpText(kind: SupportedStarterKind, variantId: string) {
  if (kind === 'graph') {
    switch (variantId) {
      case 'matrix':
        return 'Adjacency matrices are useful when density, ordering, and group blocks matter more than path tracing.';
      case 'hierarchy':
        return 'Hierarchy starters expose explicit and implicit tree techniques from the same normalized graph dataset.';
      case 'flow':
        return 'Flow starters are best when edges represent staged movement and users need source-to-target tracing.';
      default:
        return 'Force layouts are the fastest way to start graph exploration and then branch into more specialized techniques.';
    }
  }

  switch (variantId) {
    case 'splom':
      return 'Scatterplot matrices work best when a dataset has several numeric measures and users need cohort brushing.';
    case 'time-series':
      return 'Time-series starters emphasize temporal focus, context, and trend comparison rather than row inspection.';
    case 'table':
      return 'Table starters are the best baseline when schema familiarity and record inspection come before visual encoding.';
    default:
      return 'Scatter starters give a fast first read on quantitative relationships while keeping the rest of the workbench available.';
  }
}

export function getStarterVisualizationId(
  kind: SupportedStarterKind,
  datasetId: string,
  variantId: string,
): StarterExampleId | undefined {
  if (kind === 'tabular') {
    if (datasetId === 'cars' && variantId === 'scatter') {
      return 'cars-scatter';
    }
    if (datasetId === 'penguins' && variantId === 'splom') {
      return 'penguins-splom';
    }
    if (datasetId === 'stocks' && variantId === 'time-series') {
      return 'stocks-focus-context';
    }
    return undefined;
  }

  if (datasetId === 'miserables' && variantId === 'force') {
    return 'graph-force';
  }
  if (datasetId === 'miserables' && variantId === 'matrix') {
    return 'graph-matrix';
  }
  if (datasetId === 'flare' && variantId === 'hierarchy') {
    return 'hierarchy-suite';
  }
  if (datasetId === 'energy' && variantId === 'flow') {
    return 'energy-sankey';
  }

  return undefined;
}

export function buildStarterSearchParams(kind: SupportedStarterKind, datasetId: string, variantId: string) {
  const params = new URLSearchParams();
  params.set('kind', kind);
  params.set('dataset', datasetId);
  params.set('variant', variantId);
  return params.toString();
}
