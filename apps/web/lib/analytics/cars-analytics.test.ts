import { describe, expect, it } from 'vitest';

import {
  buildCarsQuery,
  CARS_DATASET_ID,
  normalizeCarsRows,
  summarizeCarsRows,
  toScatterPlotData,
} from './cars-analytics';

describe('cars analytics helpers', () => {
  it('builds a cars query from the single-view controls', () => {
    const query = buildCarsQuery({
      executionMode: 'remote',
      limit: 8,
      minHorsepower: 90,
      originFilters: ['Japan', 'USA'],
      weightCeiling: 3200,
    });

    expect(query).toEqual({
      aggregates: [],
      datasetId: CARS_DATASET_ID,
      entity: 'rows',
      executionMode: 'remote',
      filters: [
        { field: 'horsepower', operator: 'gte', value: 90 },
        { field: 'weight_in_lbs', operator: 'lte', value: 3200 },
        { field: 'origin', operator: 'in', value: ['Japan', 'USA'] },
      ],
      groupBy: [],
      limit: 8,
      select: [
        'name',
        'origin',
        'horsepower',
        'miles_per_gallon',
        'weight_in_lbs',
        'year',
        'cylinders',
      ],
      sorts: [{ direction: 'desc', field: 'horsepower' }],
    });
  });

  it('normalizes query rows into chart-ready records and summarizes them', () => {
    const rows = normalizeCarsRows({
      columns: [
        'name',
        'origin',
        'horsepower',
        'miles_per_gallon',
        'weight_in_lbs',
        'year',
        'cylinders',
      ],
      datasetId: CARS_DATASET_ID,
      durationMs: 8,
      executionMode: 'local',
      queryKey: 'sample',
      resultKind: 'table',
      rowCount: 2,
      rows: [
        {
          cylinders: 4,
          horsepower: 95,
          miles_per_gallon: 24,
          name: 'toyota corona mark ii',
          origin: 'Japan',
          weight_in_lbs: 2372,
          year: '1970-01-01',
        },
        {
          cylinders: 8,
          horsepower: 150,
          miles_per_gallon: 18,
          name: 'plymouth satellite',
          origin: 'USA',
          weight_in_lbs: 3436,
          year: '1970-01-01',
        },
      ],
      source: 'duckdb-worker',
    });

    expect(rows[0]).toMatchObject({
      horsepower: 95,
      id: 'toyota corona mark ii-1970-01-01',
      milesPerGallon: 24,
      origin: 'Japan',
    });

    expect(summarizeCarsRows(rows)).toEqual({
      averageHorsepower: 122.5,
      averageMpg: 21,
      averageWeight: 2904,
      count: 2,
      dominantOrigin: 'Japan',
    });
  });

  it('maps rows into scatterplot data and preserves selection', () => {
    const rows = normalizeCarsRows({
      columns: [],
      datasetId: CARS_DATASET_ID,
      durationMs: 5,
      executionMode: 'local',
      queryKey: 'sample',
      resultKind: 'table',
      rowCount: 1,
      rows: [
        {
          cylinders: 4,
          horsepower: 88,
          miles_per_gallon: 27,
          name: 'datsun pl510',
          origin: 'Japan',
          weight_in_lbs: 2130,
          year: '1971-01-01',
        },
      ],
      source: 'duckdb-worker',
    });

    expect(toScatterPlotData(rows, rows[0].id)).toEqual([
      {
        color: '#2aa876',
        id: 'datsun pl510-1971-01-01',
        label: 'datsun pl510',
        selected: true,
        subtitle: 'Japan · 88 hp · 27 mpg',
        x: 88,
        y: 27,
      },
    ]);
  });
});
