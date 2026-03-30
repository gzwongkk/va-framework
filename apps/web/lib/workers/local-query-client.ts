'use client';

import type { DatasetDescriptor, QueryResult, QuerySpec } from '@va/contracts';
import { type Remote, wrap } from 'comlink';

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
  const worker = await getWorker();
  return worker.executeLocalQuery(descriptor, query);
}
