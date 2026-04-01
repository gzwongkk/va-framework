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

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return 'http://127.0.0.1:8000';
}

async function readJson<T>(path: string, init: RequestInit, parser: (value: unknown) => T): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      `Unable to reach the API at ${apiBaseUrl}${path}. Start the backend server or set NEXT_PUBLIC_API_BASE_URL.`,
    );
  }

  if (!response.ok) {
    const detail = (await response.text()).trim();
    throw new Error(
      detail
        ? `Request failed (${response.status}) at ${path}: ${detail}`
        : `Request failed (${response.status}) at ${path}.`,
    );
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
