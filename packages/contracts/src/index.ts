import { z } from 'zod';

export const datasetKindSchema = z.enum(['tabular', 'graph', 'spatio-temporal']);
export type DatasetKind = z.infer<typeof datasetKindSchema>;

export const executionModeSchema = z.enum(['local', 'remote']);
export type ExecutionMode = z.infer<typeof executionModeSchema>;

export const fieldDataTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'date',
  'json',
  'latitude',
  'longitude',
]);
export type FieldDataType = z.infer<typeof fieldDataTypeSchema>;

export const fieldRoleSchema = z.enum([
  'dimension',
  'measure',
  'identifier',
  'timestamp',
  'location',
  'category',
]);
export type FieldRole = z.infer<typeof fieldRoleSchema>;

export const fieldSpecSchema = z.object({
  name: z.string(),
  title: z.string(),
  dataType: fieldDataTypeSchema,
  role: fieldRoleSchema.default('dimension'),
  description: z.string().optional(),
  nullable: z.boolean().default(false),
  unit: z.string().optional(),
});
export type FieldSpec = z.infer<typeof fieldSpecSchema>;

export const datasetSchemaSchema = z.object({
  entity: z.string().default('rows'),
  fields: z.array(fieldSpecSchema).default([]),
  primaryKey: z.array(z.string()).default([]),
  rowCount: z.number().int().nonnegative().optional(),
  timeField: z.string().optional(),
  labelField: z.string().optional(),
});
export type DatasetSchema = z.infer<typeof datasetSchemaSchema>;

export const provenanceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  license: z.string().optional(),
  notes: z.string().optional(),
});
export type Provenance = z.infer<typeof provenanceSchema>;

export const datasetLoaderSchema = z.object({
  format: z.enum(['json']),
  localPath: z.string(),
  remotePath: z.string().optional(),
  tableName: z.string().optional(),
});
export type DatasetLoader = z.infer<typeof datasetLoaderSchema>;

export const datasetExecutionSchema = z.object({
  defaultMode: executionModeSchema,
  supportedModes: z.array(executionModeSchema).min(1),
  preferredPreviewLimit: z.number().int().positive().default(12),
  rowCount: z.number().int().nonnegative(),
  notes: z.array(z.string()).default([]),
});
export type DatasetExecution = z.infer<typeof datasetExecutionSchema>;

export const datasetDescriptorSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  kind: datasetKindSchema,
  tags: z.array(z.string()).default([]),
  provenance: provenanceSchema,
  schema: datasetSchemaSchema,
  loader: datasetLoaderSchema,
  execution: datasetExecutionSchema,
});
export type DatasetDescriptor = z.infer<typeof datasetDescriptorSchema>;

export const queryScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type QueryScalar = z.infer<typeof queryScalarSchema>;

export const queryValueSchema = z.union([queryScalarSchema, z.array(queryScalarSchema)]);
export type QueryValue = z.infer<typeof queryValueSchema>;

export const filterOperatorSchema = z.enum([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'between',
  'contains',
]);
export type FilterOperator = z.infer<typeof filterOperatorSchema>;

export const filterClauseSchema = z.object({
  field: z.string(),
  operator: filterOperatorSchema,
  value: queryValueSchema,
  secondaryValue: queryScalarSchema.optional(),
});
export type FilterClause = z.infer<typeof filterClauseSchema>;

export const sortDirectionSchema = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof sortDirectionSchema>;

export const sortSpecSchema = z.object({
  field: z.string(),
  direction: sortDirectionSchema.default('asc'),
});
export type SortSpec = z.infer<typeof sortSpecSchema>;

export const aggregateOperationSchema = z.enum(['count', 'sum', 'avg', 'min', 'max']);
export type AggregateOperation = z.infer<typeof aggregateOperationSchema>;

export const aggregateSpecSchema = z.object({
  operation: aggregateOperationSchema,
  field: z.string().optional(),
  as: z.string(),
});
export type AggregateSpec = z.infer<typeof aggregateSpecSchema>;

export const transformKindSchema = z.enum(['filter', 'sort', 'aggregate', 'project', 'limit']);
export type TransformKind = z.infer<typeof transformKindSchema>;

export const transformSpecSchema = z.object({
  id: z.string(),
  kind: transformKindSchema,
  label: z.string(),
  fields: z.array(z.string()).default([]),
});
export type TransformSpec = z.infer<typeof transformSpecSchema>;

export const querySpecSchema = z.object({
  datasetId: z.string(),
  entity: z.string().optional(),
  select: z.array(z.string()).default([]),
  filters: z.array(filterClauseSchema).default([]),
  sorts: z.array(sortSpecSchema).default([]),
  groupBy: z.array(z.string()).default([]),
  aggregates: z.array(aggregateSpecSchema).default([]),
  limit: z.number().int().positive().max(1000).optional(),
  executionMode: executionModeSchema.optional(),
});
export type QuerySpec = z.infer<typeof querySpecSchema>;

export const queryResultSchema = z.object({
  datasetId: z.string(),
  columns: z.array(z.string()).default([]),
  rows: z.array(z.record(z.string(), z.unknown())).default([]),
  rowCount: z.number().int().nonnegative(),
  executionMode: executionModeSchema,
  queryKey: z.string(),
  durationMs: z.number().nonnegative(),
  source: z.enum(['api', 'duckdb-worker', 'browser-runtime']),
});
export type QueryResult = z.infer<typeof queryResultSchema>;

export const jobStatusSchema = z.enum(['queued', 'running', 'completed', 'failed']);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const jobRequestSchema = z.object({
  description: z.string().optional(),
  query: querySpecSchema,
});
export type JobRequest = z.infer<typeof jobRequestSchema>;

export const jobRecordSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  status: jobStatusSchema,
  submittedAt: z.string(),
  completedAt: z.string().optional(),
  query: querySpecSchema,
  result: queryResultSchema.optional(),
  error: z.string().optional(),
});
export type JobRecord = z.infer<typeof jobRecordSchema>;

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortKeys((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  return value;
}

export function normalizeQuerySpec(spec: QuerySpec): QuerySpec {
  return querySpecSchema.parse(spec);
}

export function createQueryFingerprint(spec: QuerySpec): string {
  return JSON.stringify(sortKeys(normalizeQuerySpec(spec)));
}

export const queryKeys = {
  datasets: () => ['datasets'] as const,
  dataset: (datasetId: string) => ['dataset', datasetId] as const,
  preview: (spec: QuerySpec, mode: ExecutionMode) =>
    ['preview', mode, spec.datasetId, createQueryFingerprint(spec)] as const,
  job: (jobId: string) => ['job', jobId] as const,
};
