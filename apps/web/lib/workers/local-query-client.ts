'use client';

import type { DatasetDescriptor, QueryResult, QuerySpec } from '@va/contracts';
import { type Remote, wrap } from 'comlink';

import { executeBrowserQuery } from '../data/browser-query';
import { executeLocalGraphQuery } from '../data/graph-query';
import type { LocalQueryWorkerApi } from './local-query.worker';

let workerPromise: Promise<Remote<LocalQueryWorkerApi>> | null = null;

async function getWorker(): Promise<Remote<LocalQueryWorkerApi>> {
  if (!workerPromise) {
    const worker = new Worker(new URL('./local-query.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerPromise = Promise.resolve(wrap<LocalQueryWorkerApi>(worker));
  }

  return workerPromise;
}

export async function executeLocalQuery(
  descriptor: DatasetDescriptor,
  query: QuerySpec,
): Promise<QueryResult> {
  if (descriptor.kind === 'graph') {
    return executeLocalGraphQuery(descriptor, query);
  }

  const shouldUseBrowserRuntime =
    descriptor.kind === 'tabular' &&
    descriptor.execution.rowCount <= 250 &&
    query.aggregates.length === 0 &&
    query.groupBy.length === 0;

  if (shouldUseBrowserRuntime) {
    return executeBrowserQuery(descriptor, query);
  }

  try {
    const worker = await getWorker();
    return await worker.executeLocalQuery(descriptor, query);
  } catch {
    return executeBrowserQuery(descriptor, query);
  }
}
