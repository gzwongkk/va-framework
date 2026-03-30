import { z } from 'zod';

export const datasetKindSchema = z.enum(['tabular', 'graph', 'spatio-temporal']);
export type DatasetKind = z.infer<typeof datasetKindSchema>;

export const executionModeSchema = z.enum(['local', 'remote']);
export type ExecutionMode = z.infer<typeof executionModeSchema>;

export const fieldSpecSchema = z.object({
  name: z.string(),
  title: z.string(),
  dataType: z.enum(['string', 'number', 'boolean', 'date', 'json']),
});
export type FieldSpec = z.infer<typeof fieldSpecSchema>;

export const datasetDescriptorSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  kind: datasetKindSchema,
  provenance: z.object({
    name: z.string(),
    url: z.string().url(),
  }),
  fields: z.array(fieldSpecSchema).default([]),
});
export type DatasetDescriptor = z.infer<typeof datasetDescriptorSchema>;
