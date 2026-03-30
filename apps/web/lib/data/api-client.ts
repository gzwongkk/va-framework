import {
  datasetDescriptorSchema,
  jobRecordSchema,
  jobRequestSchema,
  queryResultSchema,
  querySpecSchema,
  type JobRequest,
  type JobRecord,
  type QueryResult,
  type QuerySpec,
  type DatasetDescriptor,
} from '@va/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

async function readJson<T>(path: string, init: RequestInit, parser: (value: unknown) => T): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return parser(await response.json());
}

export function fetchDatasetCatalog(): Promise<DatasetDescriptor[]> {
  return readJson('/api/datasets', { method: 'GET' }, (value) =>
    datasetDescriptorSchema.array().parse(value),
  );
}

export function executeRemoteQuery(query: QuerySpec): Promise<QueryResult> {
  return readJson(
    '/api/query',
    {
      method: 'POST',
      body: JSON.stringify(querySpecSchema.parse(query)),
    },
    (value) => queryResultSchema.parse(value),
  );
}

export function createRemoteJob(request: JobRequest): Promise<JobRecord> {
  return readJson(
    '/api/jobs',
    {
      method: 'POST',
      body: JSON.stringify(jobRequestSchema.parse(request)),
    },
    (value) => jobRecordSchema.parse(value),
  );
}

export function fetchJob(jobId: string): Promise<JobRecord> {
  return readJson(`/api/jobs/${jobId}`, { method: 'GET' }, (value) => jobRecordSchema.parse(value));
}
