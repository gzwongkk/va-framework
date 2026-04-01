from __future__ import annotations

import json
import math
from collections import defaultdict
from time import perf_counter
from typing import Any

from .models import AggregateSpec, FilterClause, GraphQueryResult, QueryResult, QuerySpec, TabularQueryResult
from .registry import get_dataset, load_dataset_entity

GraphScalar = str | int | float | bool | None


def _as_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    return [value]


def _to_number(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    return float(value or 0)


def _to_graph_scalar(value: Any) -> GraphScalar:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def _matches_filter(row: dict[str, Any], clause: FilterClause) -> bool:
    value = row.get(clause.field)
    target = clause.value

    if clause.operator == 'eq':
        return value == target
    if clause.operator == 'neq':
        return value != target
    if clause.operator == 'gt':
        return value is not None and target is not None and _to_number(value) > _to_number(target)
    if clause.operator == 'gte':
        return value is not None and target is not None and _to_number(value) >= _to_number(target)
    if clause.operator == 'lt':
        return value is not None and target is not None and _to_number(value) < _to_number(target)
    if clause.operator == 'lte':
        return value is not None and target is not None and _to_number(value) <= _to_number(target)
    if clause.operator == 'in':
        return value in _as_list(target)
    if clause.operator == 'between':
        lower = target
        upper = clause.secondaryValue
        return (
            value is not None
            and lower is not None
            and upper is not None
            and _to_number(lower) <= _to_number(value) <= _to_number(upper)
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


def _execute_tabular_query(query: QuerySpec) -> TabularQueryResult:
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
    return TabularQueryResult(
        resultKind='table',
        datasetId=query.datasetId,
        columns=columns,
        rows=rows,
        rowCount=len(rows),
        executionMode='remote',
        queryKey=build_query_fingerprint(query),
        durationMs=duration_ms,
        source='api',
    )


def _build_filtered_graph_edges(
    edges: list[dict[str, Any]],
    allowed_node_ids: set[str],
    minimum_edge_weight: float,
) -> list[dict[str, Any]]:
    filtered_edges: list[dict[str, Any]] = []
    for edge in edges:
        source = str(edge.get('source'))
        target = str(edge.get('target'))
        value = _to_number(edge.get('value'))
        if source not in allowed_node_ids or target not in allowed_node_ids or value < minimum_edge_weight:
            continue

        filtered_edges.append(
            {
                'id': '::'.join(sorted([source, target])),
                'source': source,
                'target': target,
                'value': value,
            }
        )

    return filtered_edges


def _build_neighborhood(
    focus_node_id: str,
    neighbor_depth: int,
    filtered_edges: list[dict[str, Any]],
) -> set[str]:
    adjacency: dict[str, set[str]] = defaultdict(set)
    for edge in filtered_edges:
        adjacency[edge['source']].add(edge['target'])
        adjacency[edge['target']].add(edge['source'])

    visited = {focus_node_id}
    frontier = {focus_node_id}

    for _ in range(neighbor_depth):
        next_frontier: set[str] = set()
        for node_id in frontier:
            for neighbor_id in adjacency.get(node_id, set()):
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    next_frontier.add(neighbor_id)
        frontier = next_frontier

    return visited


def _build_graph_metrics(
    node_ids: set[str],
    edges: list[dict[str, Any]],
) -> tuple[dict[str, int], dict[str, float]]:
    degree_by_node = {node_id: 0 for node_id in node_ids}
    weighted_degree_by_node = {node_id: 0.0 for node_id in node_ids}

    for edge in edges:
        source = edge['source']
        target = edge['target']
        value = _to_number(edge['value'])
        degree_by_node[source] = degree_by_node.get(source, 0) + 1
        degree_by_node[target] = degree_by_node.get(target, 0) + 1
        weighted_degree_by_node[source] = weighted_degree_by_node.get(source, 0.0) + value
        weighted_degree_by_node[target] = weighted_degree_by_node.get(target, 0.0) + value

    return degree_by_node, weighted_degree_by_node


def _compute_hierarchy_depths(nodes: list[dict[str, Any]]) -> dict[str, int]:
    parent_by_id = {
        str(node.get('id')): str(node.get('parent'))
        for node in nodes
        if node.get('id') is not None and node.get('parent') is not None
    }
    known_node_ids = {str(node.get('id')) for node in nodes if node.get('id') is not None}
    depth_by_id: dict[str, int] = {}

    def resolve_depth(node_id: str) -> int:
        if node_id in depth_by_id:
            return depth_by_id[node_id]

        parent_id = parent_by_id.get(node_id)
        if parent_id is None or parent_id == node_id or parent_id not in known_node_ids:
            depth_by_id[node_id] = 0
            return 0

        depth = resolve_depth(parent_id) + 1
        depth_by_id[node_id] = depth
        return depth

    for node_id in known_node_ids:
        resolve_depth(node_id)

    return depth_by_id


def _normalize_graph_nodes(nodes: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    depth_by_id = _compute_hierarchy_depths(nodes)
    normalized_nodes: dict[str, dict[str, Any]] = {}

    for node in nodes:
        raw_id = node.get('id')
        if raw_id is None:
            continue

        node_id = str(raw_id)
        parent = node.get('parent')
        parent_id = str(parent) if parent is not None else None
        depth = int(_to_number(node.get('depth'))) if node.get('depth') is not None else depth_by_id.get(node_id, 0)
        group_source = node.get('group')
        group = int(_to_number(group_source if group_source is not None else depth))
        label = str(node.get('name') or node.get('id'))
        attributes = {
            key: _to_graph_scalar(value)
            for key, value in node.items()
        }
        attributes['group'] = group
        attributes['depth'] = depth
        if 'parent' not in attributes:
            attributes['parent'] = _to_graph_scalar(parent)

        normalized_nodes[node_id] = {
            **node,
            'id': node_id,
            'label': label,
            'group': group,
            'depth': depth,
            'parentId': parent_id,
            'attributes': attributes,
        }

    return normalized_nodes


def _execute_graph_query(query: QuerySpec) -> GraphQueryResult:
    started = perf_counter()
    nodes = load_dataset_entity(query.datasetId, 'nodes')
    links = load_dataset_entity(query.datasetId, 'links')
    normalized_nodes = _normalize_graph_nodes(nodes)
    allowed_nodes = {
        node_id: node
        for node_id, node in normalized_nodes.items()
        if all(_matches_filter(node, clause) for clause in query.filters)
    }

    minimum_edge_weight = query.graph.minEdgeWeight if query.graph else 0
    filtered_edges = _build_filtered_graph_edges(links, set(allowed_nodes.keys()), minimum_edge_weight)
    requested_focus_node_id = query.graph.focusNodeId if query.graph else None
    focus_node_id = requested_focus_node_id if requested_focus_node_id in allowed_nodes else None
    include_isolates = query.graph.includeIsolates if query.graph else focus_node_id is None

    if focus_node_id is not None:
        selected_node_ids = _build_neighborhood(
            focus_node_id,
            query.graph.neighborDepth if query.graph else 1,
            filtered_edges,
        )
    else:
        selected_node_ids = set(allowed_nodes.keys())

    if not include_isolates and focus_node_id is None:
        selected_node_ids = {
            edge_node_id
            for edge in filtered_edges
            for edge_node_id in (edge['source'], edge['target'])
        }

    if not selected_node_ids and allowed_nodes:
        selected_node_ids = {focus_node_id} if focus_node_id is not None else set(allowed_nodes.keys())

    edges = sorted(
        [
            edge
            for edge in filtered_edges
            if edge['source'] in selected_node_ids and edge['target'] in selected_node_ids
        ],
        key=lambda edge: (-edge['value'], edge['id']),
    )
    degree_by_node, weighted_degree_by_node = _build_graph_metrics(selected_node_ids, edges)

    graph_nodes = sorted(
        [
            {
                'id': node_id,
                'label': str(allowed_nodes[node_id].get('label')),
                'group': int(_to_number(allowed_nodes[node_id].get('group'))),
                'degree': degree_by_node.get(node_id, 0),
                'weightedDegree': round(weighted_degree_by_node.get(node_id, 0.0), 3),
                'attributes': allowed_nodes[node_id].get('attributes', {}),
                'parentId': allowed_nodes[node_id].get('parentId'),
                'depth': allowed_nodes[node_id].get('depth'),
            }
            for node_id in selected_node_ids
        ],
        key=lambda node: (-node['degree'], -node['weightedDegree'], node['id']),
    )

    average_degree = (
        round(sum(node['degree'] for node in graph_nodes) / len(graph_nodes), 3)
        if graph_nodes
        else 0.0
    )
    group_count = len({node['group'] for node in graph_nodes})

    duration_ms = round((perf_counter() - started) * 1000, 3)
    return GraphQueryResult(
        resultKind='graph',
        datasetId=query.datasetId,
        nodes=graph_nodes,
        edges=edges,
        nodeCount=len(graph_nodes),
        edgeCount=len(edges),
        summary={
            'groupCount': group_count,
            'averageDegree': average_degree,
            'focusedNodeId': focus_node_id,
            'topNodes': [
                {
                    'id': node['id'],
                    'group': node['group'],
                    'degree': node['degree'],
                    'weightedDegree': node['weightedDegree'],
                }
                for node in graph_nodes[:5]
            ],
        },
        executionMode='remote',
        queryKey=build_query_fingerprint(query),
        durationMs=duration_ms,
        source='api',
    )


def execute_query(query: QuerySpec) -> QueryResult:
    dataset = get_dataset(query.datasetId)
    if dataset.kind == 'graph':
        return _execute_graph_query(query)
    return _execute_tabular_query(query)
