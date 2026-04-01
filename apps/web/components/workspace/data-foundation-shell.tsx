'use client';

import type {
  DatasetDescriptor,
  ExecutionMode,
  JobRequest,
  QueryResult,
  QuerySpec,
} from '@va/contracts';
import { isGraphQueryResult, isTabularQueryResult } from '@va/contracts';
import { useCreateJobMutation, useDatasetCatalog, useJobStatus, useLocalPreviewQuery, useRemotePreviewQuery } from '@/lib/data/query-hooks';
import { useCoordinationStore } from '@/lib/coordination-store';
import { planExecution } from '@/lib/data/execution-planner';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@va/ui';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Database, Radar, Server, Workflow } from 'lucide-react';
import { useEffect, useTransition } from 'react';

function toTitleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildPreviewQuery(dataset: DatasetDescriptor, executionMode: ExecutionMode): QuerySpec {
  const fields = dataset.schema.fields;
  const defaultFields = [
    fields.find((field) => field.role === 'identifier'),
    fields.find((field) => field.role === 'measure'),
    fields.find((field) => field.role === 'category'),
    fields.find((field) => field.role === 'timestamp'),
  ]
    .filter((field): field is NonNullable<typeof field> => Boolean(field))
    .slice(0, 4);

  const sortField =
    fields.find((field) => field.role === 'measure') ??
    fields.find((field) => field.role === 'timestamp');

  return {
    datasetId: dataset.id,
    entity: dataset.schema.entity,
    executionMode,
    limit: dataset.execution.preferredPreviewLimit,
    select: defaultFields.map((field) => field.name),
    sorts: sortField
      ? [
          {
            direction: 'desc',
            field: sortField.name,
          },
        ]
      : [],
    filters: [],
    groupBy: [],
    aggregates: [],
  };
}

const fallbackQuery: QuerySpec = {
  datasetId: 'cars',
  select: [],
  filters: [],
  sorts: [],
  groupBy: [],
  aggregates: [],
};

function buildJobRequest(dataset: DatasetDescriptor): JobRequest {
  const categoryField =
    dataset.schema.fields.find((field) => field.role === 'category') ??
    dataset.schema.fields.find((field) => field.role === 'identifier');
  const measureField = dataset.schema.fields.find((field) => field.role === 'measure');

  return {
    description: `Background summary for ${dataset.title}`,
    query: {
      datasetId: dataset.id,
      entity: dataset.schema.entity,
      executionMode: 'remote',
      filters: [],
      groupBy: categoryField ? [categoryField.name] : [],
      aggregates: [
        ...(measureField
          ? [
              {
                operation: 'avg' as const,
                field: measureField.name,
                as: `avg_${measureField.name}`,
              },
            ]
          : []),
        {
          operation: 'count' as const,
          as: 'sample_count',
        },
      ],
      select: [],
      sorts: measureField
        ? [
            {
              direction: 'desc' as const,
              field: `avg_${measureField.name}`,
            },
          ]
        : [
            {
              direction: 'desc' as const,
              field: 'sample_count',
            },
          ],
    },
  };
}

function ResultTable({
  emptyLabel,
  icon: Icon,
  result,
  title,
}: {
  emptyLabel: string;
  icon: typeof Database;
  result: QueryResult | undefined;
  title: string;
}) {
  const previewResult = isTabularQueryResult(result)
    ? {
        columns: result.columns,
        rows: result.rows,
        summaryLabel: `${result.rowCount} rows in ${result.durationMs.toFixed(1)} ms`,
      }
    : isGraphQueryResult(result)
      ? {
          columns: ['id', 'group', 'degree', 'weightedDegree'],
          rows: result.summary.topNodes.map((node) => ({
            degree: node.degree,
            group: node.group,
            id: node.id,
            weightedDegree: node.weightedDegree,
          })),
          summaryLabel: `${result.nodeCount} nodes / ${result.edgeCount} edges in ${result.durationMs.toFixed(1)} ms`,
        }
      : undefined;

  const columns =
    previewResult?.columns.map((column) => ({
      accessorKey: column,
      header: toTitleCase(column),
    })) ?? [];

  // TanStack Table manages stable table internals outside React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: previewResult?.rows ?? [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-950/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2">
              <Icon className="size-4 text-slate-700" />
            </div>
            <div>
              <CardTitle className="font-[family-name:var(--font-display)] text-xl">{title}</CardTitle>
              <CardDescription className="text-slate-600">
                {previewResult ? previewResult.summaryLabel : emptyLabel}
              </CardDescription>
            </div>
          </div>
          {result ? <Badge>{result.source}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        {previewResult ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2 align-top text-slate-700">
                          {String(cell.getValue() ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            {emptyLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DataFoundationShell() {
  const [isPending, startTransition] = useTransition();
  const {
    activeDatasetId,
    lastJobId,
    preferredExecutionMode,
    setActiveDatasetId,
    setLastJobId,
    setLastQuery,
    setPreferredExecutionMode,
  } = useCoordinationStore();

  const datasetsQuery = useDatasetCatalog();
  const datasets = datasetsQuery.data;
  const datasetList = datasets ?? [];
  const selectedDataset =
    datasetList.find((dataset) => dataset.id === activeDatasetId) ?? datasetList[0];
  const previewQuery = selectedDataset
    ? buildPreviewQuery(selectedDataset, preferredExecutionMode)
    : undefined;
  const executionPlan = selectedDataset && previewQuery ? planExecution(selectedDataset, previewQuery) : undefined;
  const remotePreview = useRemotePreviewQuery(previewQuery ?? fallbackQuery, Boolean(previewQuery));
  const localPreview = useLocalPreviewQuery(
    selectedDataset,
    previewQuery ?? fallbackQuery,
    Boolean(previewQuery && executionPlan?.mode === 'local'),
  );
  const createJobMutation = useCreateJobMutation();
  const jobStatus = useJobStatus(lastJobId);

  useEffect(() => {
    if (!activeDatasetId && datasets && datasets.length > 0) {
      setActiveDatasetId(datasets[0].id);
    }
  }, [activeDatasetId, datasets, setActiveDatasetId]);

  useEffect(() => {
    if (previewQuery) {
      setLastQuery(previewQuery);
    }
  }, [previewQuery, setLastQuery]);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5">
        <CardHeader className="gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
              <Workflow className="size-5" />
            </div>
            <div>
              <CardTitle className="font-[family-name:var(--font-display)] text-2xl">
                v2.1.0 data foundation
              </CardTitle>
              <CardDescription className="text-slate-600">
                React Query owns the incoming async data path, Zustand persists coordination state, and
                DuckDB-Wasm mirrors preview-friendly datasets for local transforms.
              </CardDescription>
            </div>
          </div>
            <div className="flex flex-wrap gap-3">
            {datasetList.map((dataset) => (
              <Button
                key={dataset.id}
                className="justify-start"
                variant={selectedDataset?.id === dataset.id ? 'default' : 'outline'}
                onClick={() =>
                  startTransition(() => {
                    setActiveDatasetId(dataset.id);
                    setLastJobId(undefined);
                  })
                }
              >
                {dataset.title}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Execution planning</CardTitle>
                <CardDescription>Select the preferred mode; the planner can still route the query.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {(['local', 'remote'] as ExecutionMode[]).map((mode) => (
                    <Button
                      key={mode}
                      variant={preferredExecutionMode === mode ? 'default' : 'outline'}
                      onClick={() => startTransition(() => setPreferredExecutionMode(mode))}
                    >
                      {toTitleCase(mode)}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    Resolved mode:{' '}
                    <span className="font-medium text-slate-900">{executionPlan?.mode ?? 'pending'}</span>
                  </p>
                  {executionPlan?.reasons.map((reason) => (
                    <p key={reason}>{reason}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Dataset registry</CardTitle>
                <CardDescription>Normalized metadata with provenance, schema, and execution hints.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{selectedDataset?.title ?? 'Loading dataset catalog...'}</p>
                <p>{selectedDataset?.description}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDataset?.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
                </div>
                <p>
                  Provenance:{' '}
                  <a
                    className="text-cyan-700 underline underline-offset-4"
                    href={selectedDataset?.provenance.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {selectedDataset?.provenance.name}
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ResultTable
              emptyLabel={remotePreview.isLoading ? 'Loading remote preview...' : 'Remote preview unavailable.'}
              icon={Server}
              result={remotePreview.data}
              title="Remote source of truth"
            />
            <ResultTable
              emptyLabel={
                executionPlan?.mode === 'local'
                  ? localPreview.isLoading
                    ? 'Initializing the local DuckDB mirror...'
                    : localPreview.error
                      ? localPreview.error.message
                      : 'Local preview unavailable.'
                  : 'Planner kept this preview on the API side.'
              }
              icon={Database}
              result={localPreview.data}
              title="DuckDB local mirror"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Radar className="size-5" />
              </div>
              <div>
                <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Coordination store</CardTitle>
                <CardDescription>Persisted client state for later multi-view linking and spatial layouts.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Active dataset: <span className="font-medium text-slate-900">{selectedDataset?.id ?? 'none'}</span>
            </p>
            <p>
              Preferred execution: <span className="font-medium text-slate-900">{preferredExecutionMode}</span>
            </p>
            <p>
              Registered layout slots:{' '}
              <span className="font-medium text-slate-900">{useCoordinationStore.getState().layout.slots.length}</span>
            </p>
            <p>
              Persisted job id: <span className="font-medium text-slate-900">{lastJobId ?? 'none'}</span>
            </p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700">
              {previewQuery ? JSON.stringify(previewQuery, null, 2) : 'Waiting for dataset catalog...'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Server className="size-5" />
              </div>
              <div>
                <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Background jobs</CardTitle>
                <CardDescription>Heavy transforms can move to the API and stream back status.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full justify-center"
              onClick={() => {
                if (!selectedDataset) {
                  return;
                }

                createJobMutation.mutate(buildJobRequest(selectedDataset), {
                  onSuccess: (record) => {
                    setLastJobId(record.id);
                  },
                });
              }}
            >
              Submit remote summary job
            </Button>
            <div className="space-y-2 text-sm text-slate-600">
              <p>
                Status:{' '}
                <span className="font-medium text-slate-900">
                  {createJobMutation.isPending ? 'submitting' : jobStatus.data?.status ?? 'idle'}
                </span>
              </p>
              {jobStatus.data?.result ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">Latest job result</p>
                  <p className="mt-2">
                    {isTabularQueryResult(jobStatus.data.result)
                      ? `${jobStatus.data.result.rowCount} rows from a grouped remote transform`
                      : `${jobStatus.data.result.nodeCount} nodes and ${jobStatus.data.result.edgeCount} edges from a remote graph transform`}{' '}
                    in {jobStatus.data.result.durationMs.toFixed(1)} ms.
                  </p>
                </div>
              ) : (
                <p>Run one job to seed the async path that later multi-view coordination will invalidate and refetch.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-5 text-sm text-slate-300 shadow-2xl shadow-cyan-950/20">
          <p className="flex items-center gap-3 font-[family-name:var(--font-display)] text-lg text-white">
            <Workflow className="size-5 text-cyan-300" />
            What lands next
          </p>
          <p className="mt-3 leading-7">
            v2.2.0 will build one polished single-view analytic surface on top of these contracts. The graph,
            spatio-temporal, multi-view, and spatial-ready releases can now extend the same registry, planner,
            and coordination model instead of re-inventing state management.
          </p>
          <div className="mt-4 flex items-center gap-3 text-cyan-200">
            <Database className="size-4" />
            <span>React Query + Zustand + DuckDB-Wasm + jobs are now the shared data substrate.</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-cyan-200">
            <Server className="size-4" />
            <span>Remote and local execution are both visible from the same workspace shell.</span>
          </div>
        </div>
      </div>
      {isPending ? (
        <div className="lg:col-span-2">
          <p className="text-sm text-slate-300">Switching datasets...</p>
        </div>
      ) : null}
    </section>
  );
}
