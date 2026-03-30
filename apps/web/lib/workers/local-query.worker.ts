import * as duckdb from '@duckdb/duckdb-wasm/dist/duckdb-browser';
import { createQueryFingerprint, type DatasetDescriptor, type QueryResult, type QuerySpec } from '@va/contracts';
import { expose } from 'comlink';

type PlainRow = Record<string, unknown>;

const CDN_BUNDLES = duckdb.getJsDelivrBundles();

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function toSqlLiteral(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function buildWhereClause(query: QuerySpec): string {
  if (query.filters.length === 0) {
    return '';
  }

  const clauses = query.filters.map((filter) => {
    const field = quoteIdentifier(filter.field);
    if (filter.operator === 'between') {
      return `${field} BETWEEN ${toSqlLiteral(filter.value)} AND ${toSqlLiteral(filter.secondaryValue)}`;
    }
    if (filter.operator === 'in') {
      const values = Array.isArray(filter.value) ? filter.value : [filter.value];
      return `${field} IN (${values.map((value) => toSqlLiteral(value)).join(', ')})`;
    }
    if (filter.operator === 'contains') {
      return `${field} ILIKE '%' || ${toSqlLiteral(filter.value)} || '%'`;
    }

    const operatorMap = {
      eq: '=',
      gte: '>=',
      gt: '>',
      lt: '<',
      lte: '<=',
      neq: '!=',
    } as const;

    return `${field} ${operatorMap[filter.operator]} ${toSqlLiteral(filter.value)}`;
  });

  return ` WHERE ${clauses.join(' AND ')}`;
}

function buildSelectClause(query: QuerySpec): string {
  if (query.aggregates.length > 0) {
    const groupedFields = query.groupBy.map((field) => quoteIdentifier(field));
    const aggregateFields = query.aggregates.map((aggregate) => {
      const field = aggregate.field ? quoteIdentifier(aggregate.field) : '*';
      const operationMap = {
        avg: 'AVG',
        count: 'COUNT',
        max: 'MAX',
        min: 'MIN',
        sum: 'SUM',
      } as const;
      return `${operationMap[aggregate.operation]}(${field}) AS ${quoteIdentifier(aggregate.as)}`;
    });

    return [...groupedFields, ...aggregateFields].join(', ');
  }

  if (query.select.length > 0) {
    return query.select.map((field) => quoteIdentifier(field)).join(', ');
  }

  return '*';
}

function buildQuerySql(tableName: string, query: QuerySpec): string {
  const selectClause = buildSelectClause(query);
  const whereClause = buildWhereClause(query);
  const groupByClause =
    query.aggregates.length > 0 && query.groupBy.length > 0
      ? ` GROUP BY ${query.groupBy.map((field) => quoteIdentifier(field)).join(', ')}`
      : '';
  const orderByClause =
    query.sorts.length > 0
      ? ` ORDER BY ${query.sorts
          .map((sort) => `${quoteIdentifier(sort.field)} ${sort.direction.toUpperCase()}`)
          .join(', ')}`
      : '';
  const limitClause = query.limit ? ` LIMIT ${query.limit}` : '';

  return `SELECT ${selectClause} FROM ${quoteIdentifier(tableName)}${whereClause}${groupByClause}${orderByClause}${limitClause}`;
}

export type LocalQueryWorkerApi = {
  executeLocalQuery: (descriptor: DatasetDescriptor, query: QuerySpec) => Promise<QueryResult>;
};

class LocalQueryWorker implements LocalQueryWorkerApi {
  private readonly loadedTables = new Set<string>();

  private databasePromise: Promise<duckdb.AsyncDuckDB> | null = null;

  private async getDatabase(): Promise<duckdb.AsyncDuckDB> {
    if (!this.databasePromise) {
      this.databasePromise = (async () => {
        // Next 16's production bundlers are currently brittle around direct DuckDB wasm imports,
        // so the worker resolves the official browser bundles from jsDelivr at runtime instead.
        const bundle = await duckdb.selectBundle(CDN_BUNDLES);
        const worker = new Worker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();
        const database = new duckdb.AsyncDuckDB(logger, worker);
        await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
        return database;
      })();
    }

    return this.databasePromise;
  }

  private async ensureDataset(descriptor: DatasetDescriptor, entity?: string): Promise<string> {
    const datasetKey = `${descriptor.id}:${entity ?? descriptor.schema.entity}`;
    const tableName = `${descriptor.loader.tableName ?? descriptor.id}_${entity ?? descriptor.schema.entity}`.replaceAll(
      '-',
      '_',
    );

    if (this.loadedTables.has(datasetKey)) {
      return tableName;
    }

    const response = await fetch(new URL(descriptor.loader.localPath, self.location.origin).toString());
    if (!response.ok) {
      throw new Error(`Unable to fetch ${descriptor.loader.localPath}`);
    }

    const rawData = await response.json();
    const entityRows = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData[entity ?? descriptor.schema.entity])
        ? rawData[entity ?? descriptor.schema.entity]
        : [];

    const fileName = `${datasetKey.replaceAll(':', '_')}.json`;
    const db = await this.getDatabase();
    await db.registerFileText(fileName, JSON.stringify(entityRows));

    const connection = await db.connect();
    try {
      await connection.query(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)}`);
      await connection.insertJSONFromPath(fileName, {
        name: tableName,
      });
    } finally {
      await connection.close();
    }

    this.loadedTables.add(datasetKey);
    return tableName;
  }

  async executeLocalQuery(descriptor: DatasetDescriptor, query: QuerySpec): Promise<QueryResult> {
    const startedAt = Date.now();
    const tableName = await this.ensureDataset(descriptor, query.entity);
    const sql = buildQuerySql(tableName, query);
    const db = await this.getDatabase();
    const connection = await db.connect();

    try {
      const table = await connection.query(sql);
      const columns = table.schema.fields.map((field) => field.name);
      const rows = table.toArray().map((row) => JSON.parse(JSON.stringify(row)) as PlainRow);

      return {
        columns,
        datasetId: query.datasetId,
        durationMs: Date.now() - startedAt,
        executionMode: 'local',
        queryKey: createQueryFingerprint(query),
        rowCount: rows.length,
        rows,
        source: 'duckdb-worker',
      };
    } finally {
      await connection.close();
    }
  }
}

expose(new LocalQueryWorker());
