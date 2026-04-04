import { describe, expect, it } from 'vitest';

import { starterDatasets } from './data/starter-datasets';
import {
  getStarterDatasets,
  getStarterSchemaGuidance,
  getStarterVisualizationId,
  resolveStarterDataset,
  resolveStarterVariant,
} from './starter-workbench';

describe('starter workbench registry', () => {
  it('exposes primary and reference datasets for tabular and graph starters', () => {
    expect(getStarterDatasets(starterDatasets, 'tabular').map((dataset) => dataset.id)).toEqual([
      'cars',
      'penguins',
      'stocks',
    ]);

    expect(getStarterDatasets(starterDatasets, 'graph').map((dataset) => dataset.id)).toEqual([
      'miserables',
      'energy',
      'flare',
    ]);
  });

  it('resolves default starter datasets and variants from metadata', () => {
    expect(resolveStarterDataset(starterDatasets, 'tabular')?.id).toBe('cars');
    expect(resolveStarterDataset(starterDatasets, 'graph')?.id).toBe('miserables');
    expect(resolveStarterVariant(resolveStarterDataset(starterDatasets, 'tabular'))?.id).toBe('scatter');
    expect(resolveStarterVariant(resolveStarterDataset(starterDatasets, 'graph'))?.id).toBe('force');
  });

  it('produces starter guidance derived from the active dataset schema', () => {
    const guidance = getStarterSchemaGuidance(resolveStarterDataset(starterDatasets, 'graph'));
    expect(guidance.some((line) => line.includes('Link entity ready'))).toBe(true);
  });

  it('maps starter presets to shared example ids when available', () => {
    expect(getStarterVisualizationId('tabular', 'cars', 'scatter')).toBe('cars-scatter');
    expect(getStarterVisualizationId('graph', 'miserables', 'force')).toBe('graph-force');
    expect(getStarterVisualizationId('graph', 'flare', 'hierarchy')).toBe('hierarchy-suite');
  });
});
