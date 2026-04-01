import { isTabularQueryResult, type ExecutionMode, type QueryResult, type QuerySpec } from '@va/contracts';

export type PenguinNumericField =
  | 'beak_length_mm'
  | 'beak_depth_mm'
  | 'body_mass_g'
  | 'flipper_length_mm';

export type PenguinFieldPresetId = 'body-structure' | 'full-morphology' | 'beak-focus';

export type PenguinRow = {
  beak_depth_mm: number;
  beak_length_mm: number;
  body_mass_g: number;
  flipper_length_mm: number;
  id: string;
  island: string;
  sex?: string | null;
  species: string;
};

export type PenguinSummary = {
  averageBeakDepth: number;
  averageBeakLength: number;
  averageBodyMass: number;
  averageFlipperLength: number;
  count: number;
  islandBreakdown: Array<{ count: number; island: string }>;
  speciesBreakdown: Array<{ count: number; species: string }>;
};

export const PENGUINS_DATASET_ID = 'penguins';

export const PENGUIN_NUMERIC_FIELDS: PenguinNumericField[] = [
  'beak_length_mm',
  'beak_depth_mm',
  'flipper_length_mm',
  'body_mass_g',
];

export const PENGUIN_FIELD_LABELS: Record<PenguinNumericField, string> = {
  beak_depth_mm: 'Beak depth (mm)',
  beak_length_mm: 'Beak length (mm)',
  body_mass_g: 'Body mass (g)',
  flipper_length_mm: 'Flipper length (mm)',
};

export const PENGUIN_SPECIES_ORDER = ['Adelie', 'Chinstrap', 'Gentoo'] as const;

export const PENGUIN_SPECIES_PALETTE: Record<string, string> = {
  Adelie: '#2f607d',
  Chinstrap: '#d97745',
  Gentoo: '#2aa876',
};

export const PENGUIN_FIELD_PRESETS: Array<{
  description: string;
  fields: PenguinNumericField[];
  id: PenguinFieldPresetId;
  label: string;
}> = [
  {
    id: 'full-morphology',
    label: 'Full morphology',
    description: 'Compare the four canonical body and beak measures together.',
    fields: ['beak_length_mm', 'beak_depth_mm', 'flipper_length_mm', 'body_mass_g'],
  },
  {
    id: 'body-structure',
    label: 'Body structure',
    description: 'Emphasize flipper size and body mass against the two beak measures.',
    fields: ['flipper_length_mm', 'body_mass_g', 'beak_length_mm', 'beak_depth_mm'],
  },
  {
    id: 'beak-focus',
    label: 'Beak focus',
    description: 'Keep both beak measures first to compare species morphology more directly.',
    fields: ['beak_length_mm', 'beak_depth_mm', 'body_mass_g', 'flipper_length_mm'],
  },
];

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(2));
}

function countBy<T extends string>(values: T[]) {
  return [...values.reduce((accumulator, value) => {
    accumulator.set(value, (accumulator.get(value) ?? 0) + 1);
    return accumulator;
  }, new Map<T, number>()).entries()]
    .map(([key, count]) => ({ count, key }))
    .sort((left, right) => right.count - left.count || String(left.key).localeCompare(String(right.key)));
}

function isPenguinNumericField(value: string): value is PenguinNumericField {
  return PENGUIN_NUMERIC_FIELDS.includes(value as PenguinNumericField);
}

export function getPenguinPreset(presetId: PenguinFieldPresetId) {
  return PENGUIN_FIELD_PRESETS.find((preset) => preset.id === presetId) ?? PENGUIN_FIELD_PRESETS[0];
}

export function buildPenguinsQuery({
  executionMode,
  selectedSpecies,
}: {
  executionMode: ExecutionMode;
  selectedSpecies: string[];
}): QuerySpec {
  return {
    aggregates: [],
    datasetId: PENGUINS_DATASET_ID,
    executionMode,
    filters:
      selectedSpecies.length > 0
        ? [
            {
              field: 'species',
              operator: 'in',
              value: selectedSpecies,
            },
          ]
        : [],
    groupBy: [],
    limit: 400,
    select: ['id', 'species', 'island', 'sex', ...PENGUIN_NUMERIC_FIELDS],
    sorts: [{ field: 'species', direction: 'asc' }],
  };
}

export function normalizePenguinRows(result: QueryResult | undefined): PenguinRow[] {
  if (!isTabularQueryResult(result)) {
    return [];
  }

  return result.rows
    .map((row) => {
      if (!row.id || !row.species) {
        return undefined;
      }

      const normalizedRow: PenguinRow = {
        beak_depth_mm: Number(row.beak_depth_mm ?? 0),
        beak_length_mm: Number(row.beak_length_mm ?? 0),
        body_mass_g: Number(row.body_mass_g ?? 0),
        flipper_length_mm: Number(row.flipper_length_mm ?? 0),
        id: String(row.id),
        island: String(row.island ?? 'Unknown'),
        sex: row.sex ? String(row.sex) : null,
        species: String(row.species),
      };

      if (PENGUIN_NUMERIC_FIELDS.some((field) => !Number.isFinite(normalizedRow[field]))) {
        return undefined;
      }

      return normalizedRow;
    })
    .filter((row): row is PenguinRow => Boolean(row));
}

export function summarizePenguins(rows: PenguinRow[]): PenguinSummary {
  return {
    averageBeakDepth: average(rows.map((row) => row.beak_depth_mm)),
    averageBeakLength: average(rows.map((row) => row.beak_length_mm)),
    averageBodyMass: average(rows.map((row) => row.body_mass_g)),
    averageFlipperLength: average(rows.map((row) => row.flipper_length_mm)),
    count: rows.length,
    islandBreakdown: countBy(rows.map((row) => row.island)).map(({ count, key }) => ({ count, island: key })),
    speciesBreakdown: countBy(rows.map((row) => row.species)).map(({ count, key }) => ({ count, species: key })),
  };
}

export function getPenguinColor(species: string) {
  return PENGUIN_SPECIES_PALETTE[species] ?? '#7b6bb7';
}

export function toPenguinLegend(rows: PenguinRow[]) {
  const species = Array.from(new Set(rows.map((row) => row.species))).sort(
    (left, right) => PENGUIN_SPECIES_ORDER.indexOf(left as (typeof PENGUIN_SPECIES_ORDER)[number]) - PENGUIN_SPECIES_ORDER.indexOf(right as (typeof PENGUIN_SPECIES_ORDER)[number]),
  );

  return species.map((value) => ({
    color: getPenguinColor(value),
    label: value,
  }));
}

export function getSelectedPenguins(rows: PenguinRow[], selectedIds: string[]) {
  const selectedIdSet = new Set(selectedIds);
  return rows.filter((row) => selectedIdSet.has(row.id));
}

export function getAvailablePenguinSpecies(rows: PenguinRow[]) {
  return Array.from(new Set(rows.map((row) => row.species))).sort(
    (left, right) => left.localeCompare(right),
  );
}

export function getFieldPresetLabel(presetId: PenguinFieldPresetId) {
  return getPenguinPreset(presetId).label;
}

export function parsePenguinFieldPreset(value: string | null | undefined): PenguinFieldPresetId {
  return PENGUIN_FIELD_PRESETS.some((preset) => preset.id === value)
    ? (value as PenguinFieldPresetId)
    : 'full-morphology';
}

export function formatPenguinFieldLabel(field: string) {
  return isPenguinNumericField(field)
    ? PENGUIN_FIELD_LABELS[field]
    : field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}
