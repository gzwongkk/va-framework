'use client';

import type { CarRecord } from '@/lib/analytics/cars-analytics';
import { cn, ScrollArea, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@va/ui';

import { handleSelectableRowKeyDown } from './cars-shell-primitives';

const TABLE_COLUMNS = [
  { key: 'name', label: 'Model' },
  { key: 'origin', label: 'Origin' },
  { key: 'horsepower', label: 'Horsepower' },
  { key: 'milesPerGallon', label: 'MPG' },
  { key: 'weightInLbs', label: 'Weight (lbs)' },
] as const;

type CarsRecordsTableProps = {
  onSelect: (id: string) => void;
  rows: CarRecord[];
  selectedId?: string;
};

export function CarsRecordsTable({
  onSelect,
  rows,
  selectedId,
}: CarsRecordsTableProps) {
  return (
    <div className="ui-studio-surface mt-4 min-h-0 overflow-hidden border">
      <ScrollArea className="h-full select-none">
        <Table className="min-w-full border-collapse text-sm">
          <TableHeader className="ui-studio-record-head sticky top-0 z-10 backdrop-blur">
            <TableRow>
              {TABLE_COLUMNS.map((column) => (
                <TableHead
                  key={column.key}
                  className="ui-studio-table-cell border-b text-left text-[0.72rem] font-semibold uppercase tracking-[0.18em]"
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isActive = row.id === selectedId;

              return (
                <TableRow
                  key={row.id}
                  aria-pressed={isActive}
                  className="ui-studio-record-row cursor-pointer select-none outline-none transition-colors"
                  data-active={isActive}
                  draggable={false}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(event) => handleSelectableRowKeyDown(event, () => onSelect(row.id))}
                  onMouseDown={(event) => event.preventDefault()}
                  role="button"
                  tabIndex={0}
                >
                  {TABLE_COLUMNS.map((column, columnIndex) => (
                    <TableCell
                      key={`${row.id}-${column.key}`}
                      className={cn(
                        'ui-studio-table-cell',
                        columnIndex === 0 &&
                          isActive &&
                          'shadow-[inset_3px_0_0_0_var(--ui-accent)] font-medium text-[var(--ui-text-primary)]',
                      )}
                    >
                      {String(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
