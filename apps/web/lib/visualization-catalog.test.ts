import { describe, expect, it } from 'vitest';

import { starterDatasets } from './data/starter-datasets';
import {
  getVisualizationExample,
  getVisualizationExamplesByCategory,
  visualizationCatalog,
} from './visualization-catalog';

describe('visualization catalog', () => {
  it('maps every registered example to valid datasets', () => {
    const datasetIds = new Set(starterDatasets.map((dataset) => dataset.id));

    expect(visualizationCatalog.length).toBeGreaterThan(0);
    for (const example of visualizationCatalog) {
      expect(example.routePath.startsWith('/examples/')).toBe(true);
      expect(example.datasetIds.length).toBeGreaterThan(0);
      expect(datasetIds.has(example.defaultDatasetId)).toBe(true);
      expect(example.datasetIds.every((datasetId) => datasetIds.has(datasetId))).toBe(true);
      expect(example.provenanceUrl.startsWith('http')).toBe(true);
    }
  });

  it('exposes the time-series example through grouped gallery categories', () => {
    const groupedExamples = getVisualizationExamplesByCategory();
    const timeSeriesGroup = groupedExamples.find((group) => group.category === 'time-series');

    expect(timeSeriesGroup?.examples.map((example) => example.id)).toContain('stocks-focus-context');
    expect(getVisualizationExample('stocks-focus-context')?.defaultDatasetId).toBe('stocks');
  });
});
