import { normalizeQuerySpec, type DatasetDescriptor, type ExecutionMode, type QuerySpec } from '@va/contracts';

export type ExecutionPlan = {
  mode: ExecutionMode;
  fallbackMode?: ExecutionMode;
  reasons: string[];
};

export function planExecution(dataset: DatasetDescriptor, query: QuerySpec): ExecutionPlan {
  const normalized = normalizeQuerySpec(query);
  const requestedMode = normalized.executionMode ?? dataset.execution.defaultMode;
  const supportsLocal = dataset.execution.supportedModes.includes('local');
  const supportsRemote = dataset.execution.supportedModes.includes('remote');
  const reasons: string[] = [];

  if (normalized.aggregates.length > 0 || normalized.groupBy.length > 0) {
    reasons.push('Aggregations and grouped transforms are routed through the API job layer.');
    return {
      mode: 'remote',
      fallbackMode: supportsLocal ? 'local' : undefined,
      reasons,
    };
  }

  if (dataset.kind === 'graph') {
    reasons.push('Graph-local execution stays remote until the dedicated v2.3 graph runtime lands.');
    return {
      mode: 'remote',
      fallbackMode: supportsLocal ? 'local' : undefined,
      reasons,
    };
  }

  if (requestedMode === 'local' && supportsLocal) {
    reasons.push('This dataset ships with a browser loader and can be mirrored into DuckDB-Wasm.');
    if ((normalized.limit ?? dataset.execution.preferredPreviewLimit) > dataset.execution.preferredPreviewLimit) {
      reasons.push('The requested preview window is larger than the preferred local preview size.');
    }
    return {
      mode: 'local',
      fallbackMode: supportsRemote ? 'remote' : undefined,
      reasons,
    };
  }

  reasons.push('The current query is resolved through the API as the authoritative execution path.');
  return {
    mode: supportsRemote ? 'remote' : dataset.execution.defaultMode,
    fallbackMode: supportsLocal ? 'local' : undefined,
    reasons,
  };
}
