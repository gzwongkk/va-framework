import { describe, expect, it } from 'vitest';

import {
  buildPenguinsQuery,
  getPenguinPreset,
  normalizePenguinRows,
  summarizePenguins,
} from './penguins-analytics';

describe('penguins analytics', () => {
  it('builds a species-aware query', () => {
    const query = buildPenguinsQuery({
      executionMode: 'local',
      selectedSpecies: ['Adelie', 'Gentoo'],
    });

    expect(query.datasetId).toBe('penguins');
    expect(query.filters[0]).toMatchObject({
      field: 'species',
      operator: 'in',
      value: ['Adelie', 'Gentoo'],
    });
  });

  it('normalizes rows and summarizes metrics', () => {
    const rows = normalizePenguinRows({
      columns: ['id', 'species', 'island', 'sex', 'beak_length_mm', 'beak_depth_mm', 'flipper_length_mm', 'body_mass_g'],
      datasetId: 'penguins',
      durationMs: 2,
      executionMode: 'local',
      queryKey: 'test',
      resultKind: 'table',
      rowCount: 2,
      rows: [
        {
          beak_depth_mm: 18.7,
          beak_length_mm: 39.1,
          body_mass_g: 3750,
          flipper_length_mm: 181,
          id: 'penguin-1',
          island: 'Torgersen',
          sex: 'Male',
          species: 'Adelie',
        },
        {
          beak_depth_mm: 17.4,
          beak_length_mm: 39.5,
          body_mass_g: 3800,
          flipper_length_mm: 186,
          id: 'penguin-2',
          island: 'Torgersen',
          sex: 'Female',
          species: 'Adelie',
        },
      ],
      source: 'browser-runtime',
    });

    const summary = summarizePenguins(rows);

    expect(rows).toHaveLength(2);
    expect(summary.count).toBe(2);
    expect(summary.averageBodyMass).toBe(3775);
    expect(getPenguinPreset('full-morphology').fields).toHaveLength(4);
  });
});
