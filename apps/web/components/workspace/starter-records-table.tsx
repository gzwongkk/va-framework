'use client';

import {
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@va/ui';

import { handleSelectableRowKeyDown } from '@/components/workspace/cars-shell-primitives';

type StarterRecordsTableProps = {
  columns?: string[];
  idField?: string;
  onSelectId?: (id: string) => void;
  rows: Array<Record<string, unknown>>;
  selectedId?: string;
};

function formatCellValue(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toString();
    }

    return value.toFixed(Math.abs(value) >= 100 ? 1 : 2);
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}

function formatColumnLabel(column: string) {
  return column
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function StarterRecordsTable({
  columns,
  idField = 'id',
  onSelectId,
  rows,
  selectedId,
}: StarterRecordsTableProps) {
  const resolvedColumns =
    columns && columns.length > 0 ? columns : Object.keys(rows[0] ?? {}).filter((column) => column !== idField);

  return (
    <ScrollArea className="max-h-full">
      <Table aria-label="Starter records table">
        <TableHeader>
          <TableRow className="ui-studio-record-head">
            {resolvedColumns.map((column) => (
              <TableHead className="ui-studio-table-cell" key={column}>
                {formatColumnLabel(column)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, index) => {
              const rowId = row[idField];
              const selectableId = rowId === null || rowId === undefined ? undefined : String(rowId);
              const isActive = selectableId ? selectableId === selectedId : false;

              return (
                <TableRow
                  className="ui-studio-record-row"
                  data-active={isActive}
                  key={selectableId ?? `starter-row-${index}`}
                  onClick={selectableId ? () => onSelectId?.(selectableId) : undefined}
                  onKeyDown={
                    selectableId
                      ? (event) => handleSelectableRowKeyDown(event, () => onSelectId?.(selectableId))
                      : undefined
                  }
                  onMouseDown={selectableId ? (event) => event.preventDefault() : undefined}
                  tabIndex={selectableId ? 0 : undefined}
                >
                  {resolvedColumns.map((column) => (
                    <TableCell className="ui-studio-table-cell" key={`${selectableId ?? index}:${column}`}>
                      {formatCellValue(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow className="ui-studio-record-row">
              <TableCell className="ui-studio-table-cell" colSpan={Math.max(1, resolvedColumns.length)}>
                No records are visible for the current starter query.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
