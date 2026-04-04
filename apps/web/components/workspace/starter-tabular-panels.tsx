'use client';

import type { DatasetDescriptor, QuerySpec } from '@va/contracts';
import type { StarterVariantDefinition } from '@va/view-system';
import {
  Badge,
  Input,
  Separator,
  ToggleGroup,
  ToggleGroupItem,
} from '@va/ui';
import {
  BrushableScatterplotMatrix,
  D3ScatterPlot,
  FocusContextTimeSeries,
  type D3ScatterPlotTheme,
} from '@va/vis-core';
import { Database, Filter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  CARS_DATASET_ID,
  CARS_ORIGIN_OPTIONS,
  CARS_ORIGIN_PALETTE,
  buildCarsQuery,
  normalizeCarsRows,
  summarizeCarsRows,
} from '@/lib/analytics/cars-analytics';
import {
  PENGUIN_FIELD_PRESETS,
  PENGUIN_FIELD_LABELS,
  PENGUIN_NUMERIC_FIELDS,
  PENGUIN_SPECIES_PALETTE,
  buildPenguinsQuery,
  getAvailablePenguinSpecies,
  getPenguinPreset,
  normalizePenguinRows,
  summarizePenguins,
  toPenguinLegend,
  type PenguinFieldPresetId,
} from '@/lib/analytics/penguins-analytics';
import {
  STOCKS_DATASET_ID,
  buildStocksQuery,
  filterStocksByDomain,
  getAvailableStockSymbols,
  getStockColor,
  getStocksFullDomain,
  normalizeStocksRows,
  summarizeStocks,
  toStocksLegend,
} from '@/lib/analytics/stocks-analytics';
import {
  MetricReadout,
  RangeField,
  SectionHeader,
  StatusPill,
} from '@/components/workspace/cars-shell-primitives';
import { StarterRecordsTable } from '@/components/workspace/starter-records-table';
import { StarterWorkbenchControls } from '@/components/workspace/starter-workbench-controls';
import { VisualizationProvenancePanel } from '@/components/workspace/visualization-provenance-panel';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import {
  getStarterHelpText,
  getStarterSchemaGuidance,
  getStarterVariantLabel,
  type SupportedStarterKind,
} from '@/lib/starter-workbench';

const VIEW_ID = 'starter-tabular';

type TabularVariantId = 'scatter' | 'splom' | 'time-series' | 'table';

type Props = {
  availableDatasets: DatasetDescriptor[];
  availableVariants: StarterVariantDefinition[];
  buttonPreset: string;
  chartTheme: D3ScatterPlotTheme;
  dataset: DatasetDescriptor;
  onDatasetChange: (datasetId: string) => void;
  onKindChange: (kind: SupportedStarterKind) => void;
  onVariantChange: (variantId: string) => void;
  variantId: TabularVariantId;
  visualizationId: string;
};

const SCATTER_FIELDS = {
  cars: [
    { label: 'Horsepower', value: 'horsepower' },
    { label: 'Miles per gallon', value: 'milesPerGallon' },
    { label: 'Weight', value: 'weightInLbs' },
    { label: 'Cylinders', value: 'cylinders' },
  ],
  penguins: PENGUIN_NUMERIC_FIELDS.map((field) => ({
    label: PENGUIN_FIELD_LABELS[field],
    value: field,
  })),
} as const;

function asNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toRowRecords(datasetId: string, rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  if (datasetId === CARS_DATASET_ID) {
    return rows.map((row) => ({
      id: `${row.name}-${row.year}`,
      name: row.name,
      origin: row.origin,
      horsepower: row.horsepower,
      milesPerGallon: row.miles_per_gallon,
      weightInLbs: row.weight_in_lbs,
      year: row.year,
      cylinders: row.cylinders,
    }));
  }
  if (datasetId === STOCKS_DATASET_ID) {
    return rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      date: new Date(String(row.date)),
      price: row.price,
    }));
  }
  return rows.map((row) => ({
    id: row.id,
    species: row.species,
    island: row.island,
    sex: row.sex ?? 'Unknown',
    beak_length_mm: row.beak_length_mm,
    beak_depth_mm: row.beak_depth_mm,
    flipper_length_mm: row.flipper_length_mm,
    body_mass_g: row.body_mass_g,
  }));
}

export function StarterTabularPanels({
  availableDatasets,
  availableVariants,
  buttonPreset,
  chartTheme,
  dataset,
  onDatasetChange,
  onKindChange,
  onVariantChange,
  variantId,
  visualizationId,
}: Props) {
  const preferredExecutionMode = useCoordinationStore((state) => state.preferredExecutionMode);
  const selectedIds = useCoordinationStore((state) => state.selections[VIEW_ID]?.ids ?? []);
  const selectedId = selectedIds[0];
  const setActiveDatasetId = useCoordinationStore((state) => state.setActiveDatasetId);
  const setActiveViewId = useCoordinationStore((state) => state.setActiveViewId);
  const setFilters = useCoordinationStore((state) => state.setFilters);
  const setLastQuery = useCoordinationStore((state) => state.setLastQuery);
  const setPreferredExecutionMode = useCoordinationStore((state) => state.setPreferredExecutionMode);
  const setSelection = useCoordinationStore((state) => state.setSelection);
  const setVisualizationControlValues = useCoordinationStore((state) => state.setVisualizationControlValues);

  const [originFilters, setOriginFilters] = useState<string[]>([]);
  const [minHorsepower, setMinHorsepower] = useState(50);
  const [weightCeiling, setWeightCeiling] = useState(4200);
  const [limit, setLimit] = useState(120);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [fieldPresetId, setFieldPresetId] = useState<PenguinFieldPresetId>('full-morphology');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [timeDomain, setTimeDomain] = useState<[number, number] | undefined>();
  const [scatterXField, setScatterXField] = useState(dataset.id === CARS_DATASET_ID ? 'horsepower' : 'beak_length_mm');
  const [scatterYField, setScatterYField] = useState(dataset.id === CARS_DATASET_ID ? 'milesPerGallon' : 'flipper_length_mm');

  useEffect(() => {
    setActiveDatasetId(dataset.id);
    setActiveViewId(VIEW_ID);
    setVisualizationControlValues(visualizationId, {
      dataset: dataset.id,
      execution: preferredExecutionMode,
      kind: 'tabular',
      variant: variantId,
    });
  }, [
    dataset.id,
    preferredExecutionMode,
    setActiveDatasetId,
    setActiveViewId,
    setVisualizationControlValues,
    variantId,
    visualizationId,
  ]);

  useEffect(() => {
    setSelection(VIEW_ID, { entity: 'rows', ids: [], sourceViewId: VIEW_ID });
  }, [dataset.id, setSelection]);

  const query = useMemo<QuerySpec>(() => {
    if (dataset.id === CARS_DATASET_ID) {
      return buildCarsQuery({
        executionMode: preferredExecutionMode,
        limit,
        minHorsepower,
        originFilters,
        weightCeiling,
      });
    }
    if (dataset.id === STOCKS_DATASET_ID) {
      return buildStocksQuery({ executionMode: preferredExecutionMode, selectedSymbols });
    }
    return buildPenguinsQuery({ executionMode: preferredExecutionMode, selectedSpecies });
  }, [
    dataset.id,
    limit,
    minHorsepower,
    originFilters,
    preferredExecutionMode,
    selectedSpecies,
    selectedSymbols,
    weightCeiling,
  ]);

  const executionPlan = useMemo(() => planExecution(dataset, query), [dataset, query]);
  const resolvedExecutionMode = executionPlan.mode;
  const localQuery = resolvedExecutionMode === 'local' ? { ...query, executionMode: 'local' as const } : query;
  const remoteQuery = resolvedExecutionMode === 'remote' ? { ...query, executionMode: 'remote' as const } : query;
  const localPreview = useLocalPreviewQuery(dataset, localQuery, resolvedExecutionMode === 'local');
  const remotePreview = useRemotePreviewQuery(remoteQuery, resolvedExecutionMode === 'remote');
  const activePreview = resolvedExecutionMode === 'local' ? localPreview : remotePreview;

  useEffect(() => {
    setFilters(query.filters);
    setLastQuery({ ...query, executionMode: resolvedExecutionMode });
  }, [query, resolvedExecutionMode, setFilters, setLastQuery]);

  const rawRows = useMemo(() => {
    if (activePreview.data?.resultKind !== 'table') {
      return [];
    }
    return activePreview.data.rows;
  }, [activePreview.data]);
  const rows = useMemo(() => toRowRecords(dataset.id, rawRows), [dataset.id, rawRows]);
  const carsSummary = useMemo(() => summarizeCarsRows(normalizeCarsRows(activePreview.data)), [activePreview.data]);
  const penguinRows = useMemo(() => normalizePenguinRows(activePreview.data), [activePreview.data]);
  const penguinSummary = useMemo(() => summarizePenguins(penguinRows), [penguinRows]);
  const stocksRows = useMemo(() => normalizeStocksRows(activePreview.data), [activePreview.data]);
  const visibleStocksRows = useMemo(() => filterStocksByDomain(stocksRows, timeDomain), [stocksRows, timeDomain]);
  const stocksSummary = useMemo(() => summarizeStocks(visibleStocksRows), [visibleStocksRows]);
  const selectedRecord = useMemo(() => rows.find((row) => String(row.id ?? '') === selectedId) ?? rows[0], [rows, selectedId]);
  const scatterFields = useMemo(() => (dataset.id === CARS_DATASET_ID ? [...SCATTER_FIELDS.cars] : [...SCATTER_FIELDS.penguins]), [dataset.id]);
  const statusTone = activePreview.error ? 'error' : activePreview.isFetching && activePreview.data ? 'warning' : 'accent';
  const statusLabel = activePreview.error
    ? 'Query unavailable'
    : activePreview.isFetching && activePreview.data
      ? 'Refreshing preview'
      : resolvedExecutionMode === 'local'
        ? 'Browser runtime active'
        : 'API runtime active';

  const metricReadouts = dataset.id === CARS_DATASET_ID
    ? [
        { label: 'Average MPG', value: `${carsSummary.averageMpg.toFixed(1)} mpg` },
        { label: 'Average horsepower', value: `${carsSummary.averageHorsepower.toFixed(1)} hp` },
        { label: 'Rows', value: `${carsSummary.count}` },
      ]
    : dataset.id === STOCKS_DATASET_ID
      ? [
          { label: 'Points', value: `${stocksSummary.pointCount}` },
          { label: 'Symbols', value: `${stocksSummary.symbolSummaries.length}` },
          { label: 'Range', value: `${stocksSummary.minPrice.toFixed(2)}-${stocksSummary.maxPrice.toFixed(2)}` },
        ]
      : [
          { label: 'Rows', value: `${penguinSummary.count}` },
          { label: 'Avg body mass', value: `${Math.round(penguinSummary.averageBodyMass)} g` },
          { label: 'Avg flipper', value: `${penguinSummary.averageFlipperLength.toFixed(1)} mm` },
        ];

  const stage = variantId === 'splom' && dataset.id === 'penguins' ? (
    <BrushableScatterplotMatrix
      data={penguinRows.map((row) => ({
        category: row.species,
        color: PENGUIN_SPECIES_PALETTE[row.species] ?? '#64748b',
        id: row.id,
        label: `${row.species} · ${row.island}`,
        values: {
          beak_depth_mm: row.beak_depth_mm,
          beak_length_mm: row.beak_length_mm,
          body_mass_g: row.body_mass_g,
          flipper_length_mm: row.flipper_length_mm,
        },
      }))}
      fields={getPenguinPreset(fieldPresetId).fields}
      legend={toPenguinLegend(penguinRows)}
      onSelectIds={(ids) => setSelection(VIEW_ID, { entity: 'rows', ids, sourceViewId: VIEW_ID })}
      selectedIds={selectedIds}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle={getPenguinPreset(fieldPresetId).description}
      theme={chartTheme}
      title={`${dataset.title} / ${getStarterVariantLabel(variantId)}`}
    />
  ) : variantId === 'time-series' && dataset.id === STOCKS_DATASET_ID ? (
    <FocusContextTimeSeries
      data={visibleStocksRows.map((row) => ({
        color: getStockColor(row.symbol),
        date: row.date,
        id: row.id,
        symbol: row.symbol,
        value: row.price,
      }))}
      domain={timeDomain}
      legend={toStocksLegend(stocksRows)}
      onDomainChange={setTimeDomain}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle="Brush the context band to update the active time window."
      theme={chartTheme}
      title={`${dataset.title} / ${getStarterVariantLabel(variantId)}`}
    />
  ) : variantId === 'table' ? (
    <div className="ui-studio-surface grid min-h-[620px] gap-4 border p-[var(--ui-panel-padding)] shadow-sm shadow-slate-950/5">
      <div>
        <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Starter table</p>
        <p className="ui-studio-body mt-2">Record-first inspection for adapting the framework to a new tabular dataset.</p>
      </div>
      <div className="min-h-0">
        <StarterRecordsTable
          onSelectId={(id) => setSelection(VIEW_ID, { entity: 'rows', ids: [id], sourceViewId: VIEW_ID })}
          rows={rows}
          selectedId={selectedId}
        />
      </div>
    </div>
  ) : (
    <D3ScatterPlot
      data={rows.map((row) => {
        const category = dataset.id === CARS_DATASET_ID ? String(row.origin ?? 'Unknown') : String(row.species ?? 'Unknown');
        const color = dataset.id === CARS_DATASET_ID
          ? (CARS_ORIGIN_PALETTE[category] ?? '#64748b')
          : (PENGUIN_SPECIES_PALETTE[category] ?? '#64748b');
        return {
          color,
          id: String(row.id ?? category),
          label: String(row.name ?? row.species ?? row.symbol ?? row.id ?? 'Row'),
          selected: String(row.id ?? '') === selectedId,
          subtitle: category,
          x: asNumber(row[scatterXField]),
          y: asNumber(row[scatterYField]),
        };
      })}
      emptyLabel={activePreview.error?.message ?? 'No rows match the current starter controls.'}
      legend={dataset.id === CARS_DATASET_ID ? CARS_ORIGIN_OPTIONS.map((origin) => ({ color: CARS_ORIGIN_PALETTE[origin], label: origin })) : toPenguinLegend(penguinRows)}
      onSelect={(id) => setSelection(VIEW_ID, { entity: 'rows', ids: [id], sourceViewId: VIEW_ID })}
      selectedId={selectedId}
      statusLabel={statusLabel}
      statusTone={statusTone}
      subtitle="The unified starter shell keeps the same control and detail model while the canvas changes."
      theme={chartTheme}
      title={`${dataset.title} / ${getStarterVariantLabel(variantId)}`}
      xLabel={scatterFields.find((field) => field.value === scatterXField)?.label ?? scatterXField}
      yLabel={scatterFields.find((field) => field.value === scatterYField)?.label ?? scatterYField}
    />
  );

  return (
    <>
      <aside className="ui-studio-rail border-t xl:min-h-0 xl:border-t-0 xl:border-r">
        <StarterWorkbenchControls
          activeDatasetId={dataset.id}
          activeKind="tabular"
          activeVariantId={variantId}
          availableDatasets={availableDatasets}
          availableVariants={availableVariants}
          buttonPreset={buttonPreset}
          onDatasetChange={onDatasetChange}
          onKindChange={onKindChange}
          onRuntimeChange={setPreferredExecutionMode}
          onVariantChange={onVariantChange}
          runtime={preferredExecutionMode}
        >
          <div className="ui-studio-metric-stack grid">
            {metricReadouts.map((metric, index) => (
              <MetricReadout key={metric.label} label={metric.label} tone={index === 0 ? 'accent' : 'neutral'} value={metric.value} />
            ))}
          </div>

          <Separator className="ui-studio-divider" />

          {dataset.id === CARS_DATASET_ID ? (
            <div className="grid gap-4">
              <SectionHeader detail="Cars is the primary tabular starter for quantitative comparison and field-driven prototyping." icon={Filter} title="Dataset controls" />
              <ToggleGroup className="flex flex-wrap gap-2" onValueChange={setOriginFilters} type="multiple" value={originFilters}>
                {CARS_ORIGIN_OPTIONS.map((origin) => (
                  <ToggleGroupItem className="px-3 text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} key={origin} value={origin}>
                    {origin}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <RangeField label="Minimum horsepower" max={220} min={40} onChange={setMinHorsepower} value={minHorsepower} valueLabel={`${minHorsepower} hp`} />
              <RangeField label="Weight ceiling" max={5000} min={1600} onChange={setWeightCeiling} step={50} value={weightCeiling} valueLabel={`${weightCeiling} lbs`} />
              <RangeField label="Row limit" max={200} min={20} onChange={setLimit} step={10} value={limit} valueLabel={`${limit}`} />
            </div>
          ) : null}

          {dataset.id === 'penguins' ? (
            <div className="grid gap-4">
              <SectionHeader detail="Penguins gives the starter a richer multivariate tabular reference set." icon={Filter} title="Dataset controls" />
              <ToggleGroup className="flex flex-wrap gap-2" onValueChange={setSelectedSpecies} type="multiple" value={selectedSpecies}>
                {getAvailablePenguinSpecies(penguinRows).map((species) => (
                  <ToggleGroupItem className="px-3 text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} key={species} value={species}>
                    {species}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {variantId === 'splom' ? (
                <ToggleGroup className="flex flex-wrap gap-2" onValueChange={(value) => value && setFieldPresetId(value as PenguinFieldPresetId)} type="single" value={fieldPresetId}>
                  {PENGUIN_FIELD_PRESETS.map((preset) => (
                    <ToggleGroupItem className="px-3 text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} key={preset.id} value={preset.id}>
                      {preset.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : null}
            </div>
          ) : null}

          {dataset.id === STOCKS_DATASET_ID ? (
            <div className="grid gap-4">
              <SectionHeader detail="Stocks demonstrates a temporal starter without changing the overall shell." icon={Filter} title="Dataset controls" />
              <ToggleGroup className="flex flex-wrap gap-2" onValueChange={setSelectedSymbols} type="multiple" value={selectedSymbols}>
                {getAvailableStockSymbols(stocksRows).map((symbol) => (
                  <ToggleGroupItem className="px-3 text-xs font-semibold uppercase tracking-[0.16em]" data-button-style={buttonPreset} key={symbol} value={symbol}>
                    {symbol}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="ui-studio-surface grid gap-2 border p-4 shadow-sm shadow-slate-950/5">
                <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Time window</p>
                <p className="ui-studio-body">
                  {timeDomain
                    ? `${new Date(timeDomain[0]).toISOString().slice(0, 10)} to ${new Date(timeDomain[1]).toISOString().slice(0, 10)}`
                    : (() => {
                        const domain = getStocksFullDomain(stocksRows);
                        return domain
                          ? `${new Date(domain[0]).toISOString().slice(0, 10)} to ${new Date(domain[1]).toISOString().slice(0, 10)}`
                          : 'No domain available';
                      })()}
                </p>
              </div>
            </div>
          ) : null}

          {variantId === 'scatter' && dataset.id !== STOCKS_DATASET_ID ? (
            <div className="grid gap-3">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Scatter fields</p>
              <Input list="starter-scatter-x" onChange={(event) => setScatterXField(event.target.value)} value={scatterXField} />
              <datalist id="starter-scatter-x">
                {scatterFields.map((field) => (
                  <option key={field.value} value={field.value}>{field.label}</option>
                ))}
              </datalist>
              <Input list="starter-scatter-y" onChange={(event) => setScatterYField(event.target.value)} value={scatterYField} />
              <datalist id="starter-scatter-y">
                {scatterFields.map((field) => (
                  <option key={field.value} value={field.value}>{field.label}</option>
                ))}
              </datalist>
            </div>
          ) : null}
        </StarterWorkbenchControls>
      </aside>

      <section className="ui-studio-stage grid border-t xl:min-h-0 xl:border-t-0 xl:border-r">
        <div className="ui-studio-stage-panel min-h-0">{stage}</div>
      </section>

      <aside className="ui-studio-detail border-t xl:min-h-0 xl:border-t-0">
        <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-rows-[auto_1fr]">
          <SectionHeader detail="The starter detail rail stays consistent while datasets and variants change underneath it." icon={Database} title="Starter details" />
          <div className="grid gap-5 xl:min-h-0 xl:content-start xl:overflow-auto xl:pr-1">
            <div className="ui-studio-surface border p-4 shadow-sm shadow-slate-950/5">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Focused record</p>
              {selectedRecord ? (
                <div className="mt-3 grid gap-3">
                  <p className="font-[family-name:var(--font-display)] text-[1.6rem] leading-tight text-[var(--ui-text-primary)]">
                    {String(selectedRecord.name ?? selectedRecord.species ?? selectedRecord.symbol ?? selectedRecord.id)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{dataset.id}</Badge>
                    <Badge variant="secondary">{variantId}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                    {Object.entries(selectedRecord).filter(([key]) => key !== 'id').slice(0, 6).map(([key, value]) => (
                      <div className="flex items-start justify-between gap-4" key={key}>
                        <span className="text-[var(--ui-text-muted)]">{formatLabel(key)}</span>
                        <span className="text-right font-medium text-[var(--ui-text-primary)]">
                          {value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '—')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="ui-studio-body mt-3">Select a point, brush, or table row to inspect it here.</p>
              )}
            </div>

            <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Starter guidance</p>
              <p className="ui-studio-body">{getStarterHelpText('tabular', variantId)}</p>
              <div className="grid gap-2 text-sm text-[var(--ui-text-secondary)]">
                {getStarterSchemaGuidance(dataset).map((line) => (
                  <div className="flex items-start gap-2" key={line}>
                    <span className="mt-1 size-1.5 rounded-full bg-[var(--ui-accent-text)]" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Query envelope</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{dataset.title}</Badge>
                <Badge>{resolvedExecutionMode}</Badge>
                <Badge>{getStarterVariantLabel(variantId)}</Badge>
                <StatusPill label={statusLabel} tone={statusTone} />
              </div>
              <p className="ui-studio-body">{executionPlan.reasons[0]}</p>
            </div>

            <div className="ui-studio-surface grid gap-3 border p-4 shadow-sm shadow-slate-950/5">
              <p className="ui-studio-label font-semibold uppercase tracking-[0.24em]">Preview records</p>
              <div className="max-h-72 min-h-0">
                <StarterRecordsTable
                  onSelectId={(id) => setSelection(VIEW_ID, { entity: 'rows', ids: [id], sourceViewId: VIEW_ID })}
                  rows={rows.slice(0, 12)}
                  selectedId={selectedId}
                />
              </div>
            </div>

            <VisualizationProvenancePanel activeDatasetId={dataset.id} exampleId={visualizationId} />
          </div>
        </div>
      </aside>
    </>
  );
}
