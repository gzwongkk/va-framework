import { isTabularQueryResult, type ExecutionMode, type QueryResult, type QuerySpec } from '@va/contracts';
import type { ScatterPlotDatum } from '@va/vis-core';

export type CarsViewControls = {
  executionMode: ExecutionMode;
  limit: number;
  minHorsepower: number;
  originFilters: string[];
  selectedId?: string;
  weightCeiling: number;
};

export type CarRecord = {
  cylinders: number;
  horsepower: number;
  id: string;
  milesPerGallon: number;
  name: string;
  origin: string;
  weightInLbs: number;
  year: string;
};

export type CarsSummary = {
  averageHorsepower: number;
  averageMpg: number;
  averageWeight: number;
  count: number;
  dominantOrigin: string;
};

export const CARS_DATASET_ID = 'cars';
export const CARS_ORIGIN_OPTIONS = ['Europe', 'Japan', 'USA'] as const;
export const DEFAULT_CARS_CONTROLS: CarsViewControls = {
  executionMode: 'local',
  limit: 10,
  minHorsepower: 60,
  originFilters: [],
  weightCeiling: 3800,
};

export const CARS_ORIGIN_PALETTE: Record<string, string> = {
  Europe: '#3a7bd5',
  Japan: '#2aa876',
  USA: '#ef6f6c',
};

function toNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  return Number(value ?? 0);
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : String(value ?? '');
}

export function buildCarsQuery(controls: CarsViewControls): QuerySpec {
  return {
    datasetId: CARS_DATASET_ID,
    entity: 'rows',
    executionMode: controls.executionMode,
    limit: controls.limit,
    select: [
      'name',
      'origin',
      'horsepower',
      'miles_per_gallon',
      'weight_in_lbs',
      'year',
      'cylinders',
    ],
    filters: [
      {
        field: 'horsepower',
        operator: 'gte',
        value: controls.minHorsepower,
      },
      {
        field: 'weight_in_lbs',
        operator: 'lte',
        value: controls.weightCeiling,
      },
      ...(controls.originFilters.length > 0
        ? [
            {
              field: 'origin',
              operator: 'in' as const,
              value: controls.originFilters,
            },
          ]
        : []),
    ],
    sorts: [
      {
        field: 'horsepower',
        direction: 'desc',
      },
    ],
    groupBy: [],
    aggregates: [],
  };
}

export function normalizeCarsRows(result: QueryResult | undefined): CarRecord[] {
  if (!isTabularQueryResult(result)) {
    return [];
  }

  return result.rows.map((row) => {
    const name = toStringValue(row.name);
    const year = toStringValue(row.year);

    return {
      cylinders: toNumber(row.cylinders),
      horsepower: toNumber(row.horsepower),
      id: `${name}-${year}`,
      milesPerGallon: toNumber(row.miles_per_gallon),
      name,
      origin: toStringValue(row.origin),
      weightInLbs: toNumber(row.weight_in_lbs),
      year,
    };
  });
}

export function summarizeCarsRows(rows: CarRecord[]): CarsSummary {
  if (rows.length === 0) {
    return {
      averageHorsepower: 0,
      averageMpg: 0,
      averageWeight: 0,
      count: 0,
      dominantOrigin: 'None',
    };
  }

  let totalHorsepower = 0;
  let totalMpg = 0;
  let totalWeight = 0;
  const originCounts = new Map<string, number>();

  for (const row of rows) {
    totalHorsepower += row.horsepower;
    totalMpg += row.milesPerGallon;
    totalWeight += row.weightInLbs;
    originCounts.set(row.origin, (originCounts.get(row.origin) ?? 0) + 1);
  }

  let dominantOrigin = rows[0].origin;
  let dominantCount = originCounts.get(dominantOrigin) ?? 0;

  for (const [origin, count] of originCounts) {
    if (count > dominantCount) {
      dominantOrigin = origin;
      dominantCount = count;
    }
  }

  return {
    averageHorsepower: totalHorsepower / rows.length,
    averageMpg: totalMpg / rows.length,
    averageWeight: totalWeight / rows.length,
    count: rows.length,
    dominantOrigin,
  };
}

export function toScatterPlotData(rows: CarRecord[], selectedId?: string): ScatterPlotDatum[] {
  return rows.map((row) => ({
    color: CARS_ORIGIN_PALETTE[row.origin] ?? '#52606d',
    id: row.id,
    label: row.name,
    selected: row.id === selectedId,
    subtitle: `${row.origin} · ${row.horsepower} hp · ${row.milesPerGallon} mpg`,
    x: row.horsepower,
    y: row.milesPerGallon,
  }));
}

export function getAvailableOrigins(rows: CarRecord[]) {
  return Array.from(new Set(rows.map((row) => row.origin))).sort();
}

export function findSelectedCar(rows: CarRecord[], selectedId?: string) {
  return rows.find((row) => row.id === selectedId);
}
