import { describe, expect, it } from 'vitest';

import {
  buildStocksQuery,
  filterStocksByDomain,
  normalizeStocksRows,
  summarizeStocks,
} from './stocks-analytics';

describe('stocks analytics', () => {
  it('builds a symbol-aware query', () => {
    const query = buildStocksQuery({
      executionMode: 'local',
      selectedSymbols: ['AAPL', 'MSFT'],
    });

    expect(query.filters[0]).toMatchObject({
      field: 'symbol',
      operator: 'in',
      value: ['AAPL', 'MSFT'],
    });
  });

  it('normalizes rows and summarizes a brushed domain', () => {
    const rows = normalizeStocksRows({
      columns: ['id', 'symbol', 'date', 'price'],
      datasetId: 'stocks',
      durationMs: 2,
      executionMode: 'local',
      queryKey: 'test',
      resultKind: 'table',
      rowCount: 3,
      rows: [
        { date: '2000-01-01', id: 'aapl-1', price: 10, symbol: 'AAPL' },
        { date: '2000-02-01', id: 'aapl-2', price: 12, symbol: 'AAPL' },
        { date: '2000-01-01', id: 'msft-1', price: 8, symbol: 'MSFT' },
      ],
      source: 'browser-runtime',
    });

    const filtered = filterStocksByDomain(rows, [
      new Date('2000-01-15').getTime(),
      new Date('2000-02-15').getTime(),
    ]);
    const summary = summarizeStocks(filtered);

    expect(filtered).toHaveLength(1);
    expect(summary.pointCount).toBe(1);
    expect(summary.symbolSummaries[0]?.latest).toBe(12);
  });
});
