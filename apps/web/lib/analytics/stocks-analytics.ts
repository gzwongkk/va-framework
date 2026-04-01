import { isTabularQueryResult, type ExecutionMode, type QueryResult, type QuerySpec } from '@va/contracts';

export const STOCKS_DATASET_ID = 'stocks';

export type StockRow = {
  date: Date;
  id: string;
  price: number;
  symbol: string;
};

export type StockSymbolSummary = {
  change: number;
  latest: number;
  max: number;
  min: number;
  symbol: string;
};

export type StockDomainSummary = {
  domainEnd?: number;
  domainStart?: number;
  maxPrice: number;
  minPrice: number;
  pointCount: number;
  symbolSummaries: StockSymbolSummary[];
};

const STOCK_COLORS: Record<string, string> = {
  AAPL: '#2f607d',
  AMZN: '#d97745',
  GOOG: '#7b6bb7',
  IBM: '#4f8b43',
  MSFT: '#2aa876',
};

export function buildStocksQuery({
  executionMode,
  selectedSymbols,
}: {
  executionMode: ExecutionMode;
  selectedSymbols: string[];
}): QuerySpec {
  return {
    aggregates: [],
    datasetId: STOCKS_DATASET_ID,
    executionMode,
    filters:
      selectedSymbols.length > 0
        ? [
            {
              field: 'symbol',
              operator: 'in',
              value: selectedSymbols,
            },
          ]
        : [],
    groupBy: [],
    limit: 1000,
    select: ['id', 'symbol', 'date', 'price'],
    sorts: [
      { direction: 'asc', field: 'symbol' },
      { direction: 'asc', field: 'date' },
    ],
  };
}

export function normalizeStocksRows(result: QueryResult | undefined): StockRow[] {
  if (!isTabularQueryResult(result)) {
    return [];
  }

  return result.rows
    .map((row) => {
      if (!row.id || !row.symbol || !row.date) {
        return undefined;
      }

      const date = new Date(String(row.date));
      const price = Number(row.price ?? 0);
      if (!Number.isFinite(date.getTime()) || !Number.isFinite(price)) {
        return undefined;
      }

      return {
        date,
        id: String(row.id),
        price,
        symbol: String(row.symbol),
      } satisfies StockRow;
    })
    .filter((row): row is StockRow => Boolean(row));
}

export function getStockColor(symbol: string) {
  return STOCK_COLORS[symbol] ?? '#64748b';
}

export function getAvailableStockSymbols(rows: StockRow[]) {
  return Array.from(new Set(rows.map((row) => row.symbol))).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function toStocksLegend(rows: StockRow[]) {
  return getAvailableStockSymbols(rows).map((symbol) => ({
    color: getStockColor(symbol),
    label: symbol,
  }));
}

export function filterStocksByDomain(
  rows: StockRow[],
  domain: [number, number] | undefined,
) {
  if (!domain) {
    return rows;
  }

  const [start, end] = domain;
  return rows.filter((row) => {
    const time = row.date.getTime();
    return time >= start && time <= end;
  });
}

export function getStocksFullDomain(rows: StockRow[]): [number, number] | undefined {
  if (rows.length === 0) {
    return undefined;
  }

  const times = rows.map((row) => row.date.getTime());
  return [Math.min(...times), Math.max(...times)];
}

export function summarizeStocks(rows: StockRow[]): StockDomainSummary {
  if (rows.length === 0) {
    return {
      maxPrice: 0,
      minPrice: 0,
      pointCount: 0,
      symbolSummaries: [],
    };
  }

  const grouped = new Map<string, StockRow[]>();
  for (const row of rows) {
    const current = grouped.get(row.symbol) ?? [];
    current.push(row);
    grouped.set(row.symbol, current);
  }

  return {
    domainEnd: Math.max(...rows.map((row) => row.date.getTime())),
    domainStart: Math.min(...rows.map((row) => row.date.getTime())),
    maxPrice: Math.max(...rows.map((row) => row.price)),
    minPrice: Math.min(...rows.map((row) => row.price)),
    pointCount: rows.length,
    symbolSummaries: [...grouped.entries()]
      .map(([symbol, series]) => {
        const orderedSeries = [...series].sort(
          (left, right) => left.date.getTime() - right.date.getTime(),
        );
        const first = orderedSeries[0];
        const last = orderedSeries[orderedSeries.length - 1];
        return {
          change: Number((last.price - first.price).toFixed(2)),
          latest: last.price,
          max: Math.max(...orderedSeries.map((row) => row.price)),
          min: Math.min(...orderedSeries.map((row) => row.price)),
          symbol,
        } satisfies StockSymbolSummary;
      })
      .sort((left, right) => left.symbol.localeCompare(right.symbol)),
  };
}
