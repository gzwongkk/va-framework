'use client';

import type { DatasetDescriptor, JobRequest, JobRecord, QueryResult, QuerySpec } from '@va/contracts';
import { jobRequestSchema, normalizeQuerySpec, queryKeys } from '@va/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';

import { createRemoteJob, executeRemoteQuery, fetchDatasetCatalog, fetchJob } from './api-client';
import { executeLocalQuery } from '../workers/local-query-client';

export function useDatasetCatalog() {
  return useQuery({
    queryKey: queryKeys.datasets(),
    queryFn: fetchDatasetCatalog,
  });
}

export function useRemotePreviewQuery(query: QuerySpec, enabled = true) {
  const normalized = normalizeQuerySpec(query);

  return useQuery<QueryResult>({
    enabled,
    queryKey: queryKeys.preview(normalized, 'remote'),
    queryFn: () => executeRemoteQuery(normalized),
  });
}

export function useLocalPreviewQuery(
  dataset: DatasetDescriptor | undefined,
  query: QuerySpec,
  enabled: boolean,
) {
  const normalized = normalizeQuerySpec(query);

  return useQuery<QueryResult>({
    enabled: enabled && Boolean(dataset),
    queryKey: queryKeys.preview(normalized, 'local'),
    queryFn: () => executeLocalQuery(dataset!, normalized),
  });
}

export function useCreateJobMutation() {
  return useMutation<JobRecord, Error, JobRequest>({
    mutationFn: (request) => createRemoteJob(jobRequestSchema.parse(request)),
  });
}

export function useJobStatus(jobId: string | undefined) {
  return useQuery({
    enabled: Boolean(jobId),
    queryKey: jobId ? queryKeys.job(jobId) : ['job', 'idle'],
    queryFn: () => fetchJob(jobId!),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 1_000;
    },
  });
}
