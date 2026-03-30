from __future__ import annotations

import json
import math
from collections import defaultdict
from time import perf_counter
from typing import Any

from .models import AggregateSpec, FilterClause, QueryResult, QuerySpec
from .registry import get_dataset, load_dataset_entity


def _as_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    return [value]


def _matches_filter(row: dict[str, Any], clause: FilterClause) -> bool:
    value = row.get(clause.field)
    target = clause.value

    if clause.operator == 'eq':
        return value == target
    if clause.operator == 'neq':
        return value != target
    if clause.operator == 'gt':
        return value is not None and target is not None and value > target
    if clause.operator == 'gte':
        return value is not None and target is not None and value >= target
    if clause.operator == 'lt':
        return value is not None and target is not None and value < target
    if clause.operator == 'lte':
        return value is not None and target is not None and value <= target
    if clause.operator == 'in':
        return value in _as_list(target)
    if clause.operator == 'between':
        lower = target
        upper = clause.secondaryValue
        return (
            value is not None
            and lower is not None
            and upper is not None
            and lower <= value <= upper
        )
    if clause.operator == 'contains':
        return target is not None and str(target).lower() in str(value).lower()
    return True


def _apply_filters(rows: list[dict[str, Any]], filters: list[FilterClause]) -> list[dict[str, Any]]:
    filtered = rows
    for clause in filters:
        filtered = [row for row in filtered if _matches_filter(row, clause)]
    return filtered


def _sort_key(value: Any) -> tuple[int, Any]:
    return (value is None, value)


def _apply_sorts(rows: list[dict[str, Any]], query: QuerySpec) -> list[dict[str, Any]]:
    sorted_rows = rows
    for sort in reversed(query.sorts):
        sorted_rows = sorted(
            sorted_rows,
            key=lambda row: _sort_key(row.get(sort.field)),
            reverse=sort.direction == 'desc',
        )
    return sorted_rows


def _project_rows(rows: list[dict[str, Any]], selected_fields: list[str]) -> list[dict[str, Any]]:
    if not selected_fields:
        return rows
    return [{field: row.get(field) for field in selected_fields} for row in rows]


def _aggregate_values(rows: list[dict[str, Any]], aggregate: AggregateSpec) -> Any:
    if aggregate.operation == 'count':
        return len(rows)

    values = [row.get(aggregate.field or '') for row in rows]
    numeric_values = [
        float(value)
        for value in values
        if value is not None and isinstance(value, (int, float)) and not math.isnan(float(value))
    ]

    if aggregate.operation == 'sum':
        return sum(numeric_values)
    if aggregate.operation == 'avg':
        return round(sum(numeric_values) / len(numeric_values), 3) if numeric_values else None
    if aggregate.operation == 'min':
        return min(values) if values else None
    if aggregate.operation == 'max':
        return max(values) if values else None
    return None


def _apply_aggregates(rows: list[dict[str, Any]], query: QuerySpec) -> list[dict[str, Any]]:
    if not query.aggregates:
        return rows

    grouped: dict[tuple[Any, ...], list[dict[str, Any]]] = defaultdict(list)
    if query.groupBy:
        for row in rows:
            grouped[tuple(row.get(field) for field in query.groupBy)].append(row)
    else:
        grouped[tuple()] = rows

    aggregated_rows: list[dict[str, Any]] = []
    for key, group_rows in grouped.items():
        result_row = {field: key[index] for index, field in enumerate(query.groupBy)}
        for aggregate in query.aggregates:
            result_row[aggregate.as_] = _aggregate_values(group_rows, aggregate)
        aggregated_rows.append(result_row)

    return aggregated_rows


def build_query_fingerprint(query: QuerySpec) -> str:
    payload = query.model_dump(mode='json', by_alias=True)
    return json.dumps(payload, sort_keys=True)


def execute_query(query: QuerySpec) -> QueryResult:
    started = perf_counter()
    dataset = get_dataset(query.datasetId)
    rows = load_dataset_entity(query.datasetId, query.entity)
    rows = _apply_filters(rows, query.filters)
    rows = _apply_aggregates(rows, query)
    rows = _apply_sorts(rows, query)

    if query.limit is not None:
        rows = rows[: query.limit]

    selected_fields = query.select if query.select else []
    rows = _project_rows(rows, selected_fields)

    if rows:
        columns = list(rows[0].keys())
    elif query.select:
        columns = query.select
    elif query.groupBy or query.aggregates:
        columns = [*query.groupBy, *[aggregate.as_ for aggregate in query.aggregates]]
    else:
        columns = [field.name for field in dataset.datasetSchema.fields]

    duration_ms = round((perf_counter() - started) * 1000, 3)
    return QueryResult(
        datasetId=query.datasetId,
        columns=columns,
        rows=rows,
        rowCount=len(rows),
        executionMode='remote',
        queryKey=build_query_fingerprint(query),
        durationMs=duration_ms,
        source='api',
    )
