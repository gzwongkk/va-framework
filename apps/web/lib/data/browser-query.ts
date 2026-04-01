import { createQueryFingerprint, type AggregateSpec, type DatasetDescriptor, type QueryResult, type QuerySpec } from '@va/contracts';

type PlainRow = Record<string, unknown>;

const datasetPromiseCache = new Map<string, Promise<PlainRow[]>>();

function asList(value: unknown) {
  return Array.isArray(value) ? value : [value];
}

function toDatasetKey(descriptor: DatasetDescriptor, entity?: string) {
  return `${descriptor.id}:${entity ?? descriptor.schema.entity}`;
}

async function loadLocalRows(descriptor: DatasetDescriptor, entity?: string): Promise<PlainRow[]> {
  const cacheKey = toDatasetKey(descriptor, entity);
  const cached = datasetPromiseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const loadPromise = (async () => {
    const response = await fetch(descriptor.loader.localPath, {
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error(`Unable to load ${descriptor.loader.localPath}`);
    }

    const raw = (await response.json()) as unknown;
    if (Array.isArray(raw)) {
      return raw as PlainRow[];
    }

    if (raw && typeof raw === 'object') {
      const record = raw as Record<string, unknown>;
      const candidateEntity = entity ?? descriptor.schema.entity;

      if (Array.isArray(record[candidateEntity])) {
        return record[candidateEntity] as PlainRow[];
      }

      if (Array.isArray(record.rows)) {
        return record.rows as PlainRow[];
      }

      if (Array.isArray(record.nodes)) {
        return record.nodes as PlainRow[];
      }
    }

    return [];
  })();

  datasetPromiseCache.set(cacheKey, loadPromise);
  return loadPromise;
}

function matchesFilter(row: PlainRow, queryFilter: QuerySpec['filters'][number]) {
  const value = row[queryFilter.field];
  const target = queryFilter.value;

  switch (queryFilter.operator) {
    case 'eq':
      return value === target;
    case 'neq':
      return value !== target;
    case 'gt':
      return value != null && target != null && Number(value) > Number(target);
    case 'gte':
      return value != null && target != null && Number(value) >= Number(target);
    case 'lt':
      return value != null && target != null && Number(value) < Number(target);
    case 'lte':
      return value != null && target != null && Number(value) <= Number(target);
    case 'in':
      return asList(target).includes(value);
    case 'between': {
      const lower = Number(target);
      const upper = Number(queryFilter.secondaryValue);
      const numericValue = Number(value);
      return Number.isFinite(numericValue) && numericValue >= lower && numericValue <= upper;
    }
    case 'contains':
      return String(value ?? '').toLowerCase().includes(String(target ?? '').toLowerCase());
    default:
      return true;
  }
}

function applyFilters(rows: PlainRow[], query: QuerySpec) {
  return query.filters.reduce(
    (currentRows, queryFilter) => currentRows.filter((row) => matchesFilter(row, queryFilter)),
    rows,
  );
}

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

function applySorts(rows: PlainRow[], query: QuerySpec) {
  return query.sorts.reduceRight((currentRows, sort) => {
    return [...currentRows].sort((left, right) => {
      const comparison = compareValues(left[sort.field], right[sort.field]);
      return sort.direction === 'desc' ? comparison * -1 : comparison;
    });
  }, rows);
}

function aggregateValues(rows: PlainRow[], aggregate: AggregateSpec) {
  if (aggregate.operation === 'count') {
    return rows.length;
  }

  const values = rows
    .map((row) => row[aggregate.field ?? ''])
    .filter((value) => typeof value === 'number' && Number.isFinite(value)) as number[];

  if (values.length === 0) {
    return null;
  }

  switch (aggregate.operation) {
    case 'sum':
      return values.reduce((total, value) => total + value, 0);
    case 'avg':
      return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(3));
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return null;
  }
}

function applyAggregates(rows: PlainRow[], query: QuerySpec) {
  if (query.aggregates.length === 0) {
    return rows;
  }

  const grouped = new Map<string, PlainRow[]>();
  for (const row of rows) {
    const key = JSON.stringify(query.groupBy.map((field) => row[field]));
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries()).map(([key, groupRows]) => {
    const keyValues = JSON.parse(key) as unknown[];
    const groupedRow = query.groupBy.reduce<PlainRow>((row, field, index) => {
      row[field] = keyValues[index];
      return row;
    }, {});

    for (const aggregate of query.aggregates) {
      groupedRow[aggregate.as] = aggregateValues(groupRows, aggregate);
    }

    return groupedRow;
  });
}

function projectRows(rows: PlainRow[], query: QuerySpec) {
  if (query.select.length === 0) {
    return rows;
  }

  return rows.map((row) =>
    query.select.reduce<PlainRow>((projectedRow, field) => {
      projectedRow[field] = row[field];
      return projectedRow;
    }, {}),
  );
}

export async function executeBrowserQuery(
  descriptor: DatasetDescriptor,
  query: QuerySpec,
): Promise<QueryResult> {
  const startedAt = performance.now();
  const rows = await loadLocalRows(descriptor, query.entity);
  const filteredRows = applyFilters(rows, query);
  const aggregatedRows = applyAggregates(filteredRows, query);
  const sortedRows = applySorts(aggregatedRows, query);
  const limitedRows = query.limit ? sortedRows.slice(0, query.limit) : sortedRows;
  const projectedRows = projectRows(limitedRows, query);
  const columns =
    projectedRows[0] ? Object.keys(projectedRows[0]) : query.select.length > 0 ? query.select : descriptor.schema.fields.map((field) => field.name);

  return {
    resultKind: 'table',
    columns,
    datasetId: query.datasetId,
    durationMs: Number((performance.now() - startedAt).toFixed(3)),
    executionMode: 'local',
    queryKey: createQueryFingerprint(query),
    rowCount: projectedRows.length,
    rows: projectedRows,
    source: 'browser-runtime',
  };
}
