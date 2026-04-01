import { describe, expect, it } from 'vitest';

import {
  DEFAULT_GRAPH_DATASET,
  DEFAULT_GRAPH_TECHNIQUE,
  parseGraphDatasetParam,
  parseGraphTechniqueParam,
} from './graph-workbench';

describe('graph workbench helpers', () => {
  it('parses supported dataset params and falls back for unknown values', () => {
    expect(parseGraphDatasetParam('miserables')).toBe('miserables');
    expect(parseGraphDatasetParam('flare')).toBe('flare');
    expect(parseGraphDatasetParam('unknown')).toBe(DEFAULT_GRAPH_DATASET);
    expect(parseGraphDatasetParam(undefined)).toBe(DEFAULT_GRAPH_DATASET);
  });

  it('parses supported technique params and falls back for unknown values', () => {
    expect(parseGraphTechniqueParam('force')).toBe('force');
    expect(parseGraphTechniqueParam('matrix')).toBe('matrix');
    expect(parseGraphTechniqueParam('tree')).toBe('tree');
    expect(parseGraphTechniqueParam('multivariate')).toBe('multivariate');
    expect(parseGraphTechniqueParam('unknown')).toBe(DEFAULT_GRAPH_TECHNIQUE);
    expect(parseGraphTechniqueParam(null)).toBe(DEFAULT_GRAPH_TECHNIQUE);
  });
});
