from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from .models import DatasetDescriptor

DATA_DIR = Path(__file__).resolve().parent.parent / 'data'


def _as_string_id(value: Any) -> str:
    return str(value)


def _build_hierarchy_links(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    links: list[dict[str, Any]] = []

    for row in rows:
        parent = row.get('parent')
        node_id = row.get('id')
        if parent is None or node_id is None:
            continue

        links.append(
            {
                'source': _as_string_id(parent),
                'target': _as_string_id(node_id),
                'value': 1,
            }
        )

    return links


@lru_cache(maxsize=1)
def dataset_registry() -> dict[str, DatasetDescriptor]:
    return {
        'cars': DatasetDescriptor.model_validate(
            {
                'id': 'cars',
                'title': 'Cars',
                'description': 'Starter tabular dataset for the single-view analytics roadmap.',
                'kind': 'tabular',
                'tags': ['starter', 'vega', 'tabular'],
                'provenance': {
                    'name': 'Vega Cars dataset',
                    'url': 'https://vega.github.io/vega-datasets/data/cars.json',
                    'license': 'Public sample dataset',
                    'notes': 'Curated local sample for the v2.1 data foundation milestone.',
                },
                'schema': {
                    'entity': 'rows',
                    'primaryKey': ['name', 'year'],
                    'rowCount': len(load_dataset_entity('cars')),
                    'fields': [
                        {'name': 'name', 'title': 'Name', 'dataType': 'string', 'role': 'identifier'},
                        {
                            'name': 'miles_per_gallon',
                            'title': 'Miles per gallon',
                            'dataType': 'number',
                            'role': 'measure',
                            'unit': 'mpg',
                        },
                        {'name': 'cylinders', 'title': 'Cylinders', 'dataType': 'number', 'role': 'measure'},
                        {'name': 'horsepower', 'title': 'Horsepower', 'dataType': 'number', 'role': 'measure'},
                        {
                            'name': 'weight_in_lbs',
                            'title': 'Weight',
                            'dataType': 'number',
                            'role': 'measure',
                            'unit': 'lbs',
                        },
                        {'name': 'year', 'title': 'Model year', 'dataType': 'date', 'role': 'timestamp'},
                        {'name': 'origin', 'title': 'Origin', 'dataType': 'string', 'role': 'category'},
                    ],
                },
                'loader': {
                    'format': 'json',
                    'localPath': '/datasets/cars.sample.json',
                    'remotePath': '/api/query',
                    'tableName': 'cars',
                },
                'execution': {
                    'defaultMode': 'local',
                    'supportedModes': ['local', 'remote'],
                    'rowCount': len(load_dataset_entity('cars')),
                    'preferredPreviewLimit': 6,
                    'notes': [
                        'Simple row previews and filters are suitable for the DuckDB browser worker.',
                        'Aggregations and long-running transforms can be pushed to the API job layer.',
                    ],
                },
            }
        ),
        'miserables': DatasetDescriptor.model_validate(
            {
                'id': 'miserables',
                'title': 'Les Miserables graph',
                'description': 'Starter graph dataset queued for the v2.3 graph milestone.',
                'kind': 'graph',
                'tags': ['starter', 'vega', 'graph'],
                'provenance': {
                    'name': 'Vega Miserables dataset',
                    'url': 'https://vega.github.io/vega-datasets/data/miserables.json',
                    'license': 'Public sample dataset',
                    'notes': 'Curated local sample with nodes and weighted links.',
                },
                'schema': {
                    'entity': 'nodes',
                    'primaryKey': ['id'],
                    'labelField': 'id',
                    'rowCount': len(load_dataset_entity('miserables', 'nodes')),
                    'fields': [
                        {'name': 'id', 'title': 'Node id', 'dataType': 'string', 'role': 'identifier'},
                        {'name': 'group', 'title': 'Community', 'dataType': 'number', 'role': 'category'},
                    ],
                    'entities': {
                        'nodes': {
                            'primaryKey': ['id'],
                            'labelField': 'id',
                            'rowCount': len(load_dataset_entity('miserables', 'nodes')),
                            'fields': [
                                {'name': 'id', 'title': 'Node id', 'dataType': 'string', 'role': 'identifier'},
                                {'name': 'group', 'title': 'Community', 'dataType': 'number', 'role': 'category'},
                            ],
                        },
                        'links': {
                            'primaryKey': ['source', 'target'],
                            'rowCount': len(load_dataset_entity('miserables', 'links')),
                            'sourceField': 'source',
                            'targetField': 'target',
                            'weightField': 'value',
                            'fields': [
                                {'name': 'source', 'title': 'Source', 'dataType': 'string', 'role': 'identifier'},
                                {'name': 'target', 'title': 'Target', 'dataType': 'string', 'role': 'identifier'},
                                {'name': 'value', 'title': 'Weight', 'dataType': 'number', 'role': 'measure'},
                            ],
                        },
                    },
                },
                'loader': {
                    'format': 'json',
                    'localPath': '/datasets/miserables.sample.json',
                    'remotePath': '/api/query',
                    'tableName': 'miserables_nodes',
                },
                'execution': {
                    'defaultMode': 'local',
                    'supportedModes': ['local', 'remote'],
                    'rowCount': len(load_dataset_entity('miserables', 'nodes')),
                    'preferredPreviewLimit': 8,
                    'notes': [
                        'Graph exploration defaults to the local graphology runtime in v2.3.0.',
                        'Remote execution stays available for parity and heavier graph transforms.',
                    ],
                },
            }
        ),
        'flare': DatasetDescriptor.model_validate(
            {
                'id': 'flare',
                'title': 'Flare hierarchy',
                'description': 'Hierarchy dataset for the v2.3 graph workbench tree technique line.',
                'kind': 'graph',
                'tags': ['starter', 'vega', 'graph', 'tree', 'hierarchy'],
                'provenance': {
                    'name': 'Vega Flare dataset',
                    'url': 'https://vega.github.io/vega-datasets/data/flare.json',
                    'license': 'Public sample dataset',
                    'notes': 'Curated local hierarchy sample normalized for upcoming tree techniques.',
                },
                'schema': {
                    'entity': 'nodes',
                    'primaryKey': ['id'],
                    'labelField': 'name',
                    'rowCount': len(load_dataset_entity('flare', 'nodes')),
                    'fields': [
                        {'name': 'id', 'title': 'Node id', 'dataType': 'number', 'role': 'identifier'},
                        {'name': 'name', 'title': 'Name', 'dataType': 'string', 'role': 'category'},
                        {
                            'name': 'parent',
                            'title': 'Parent id',
                            'dataType': 'number',
                            'role': 'identifier',
                            'nullable': True,
                        },
                        {
                            'name': 'size',
                            'title': 'Size',
                            'dataType': 'number',
                            'role': 'measure',
                            'nullable': True,
                        },
                        {'name': 'depth', 'title': 'Depth', 'dataType': 'number', 'role': 'measure'},
                    ],
                    'hierarchy': {
                        'rootId': '1',
                        'parentField': 'parent',
                        'depthField': 'depth',
                        'labelField': 'name',
                    },
                    'entities': {
                        'nodes': {
                            'primaryKey': ['id'],
                            'labelField': 'name',
                            'rowCount': len(load_dataset_entity('flare', 'nodes')),
                            'fields': [
                                {'name': 'id', 'title': 'Node id', 'dataType': 'number', 'role': 'identifier'},
                                {'name': 'name', 'title': 'Name', 'dataType': 'string', 'role': 'category'},
                                {
                                    'name': 'parent',
                                    'title': 'Parent id',
                                    'dataType': 'number',
                                    'role': 'identifier',
                                    'nullable': True,
                                },
                                {
                                    'name': 'size',
                                    'title': 'Size',
                                    'dataType': 'number',
                                    'role': 'measure',
                                    'nullable': True,
                                },
                                {'name': 'depth', 'title': 'Depth', 'dataType': 'number', 'role': 'measure'},
                            ],
                        },
                        'links': {
                            'primaryKey': ['source', 'target'],
                            'rowCount': len(load_dataset_entity('flare', 'links')),
                            'sourceField': 'source',
                            'targetField': 'target',
                            'weightField': 'value',
                            'fields': [
                                {'name': 'source', 'title': 'Source', 'dataType': 'string', 'role': 'identifier'},
                                {'name': 'target', 'title': 'Target', 'dataType': 'string', 'role': 'identifier'},
                                {'name': 'value', 'title': 'Weight', 'dataType': 'number', 'role': 'measure'},
                            ],
                        },
                    },
                },
                'loader': {
                    'format': 'json',
                    'localPath': '/datasets/flare.sample.json',
                    'remotePath': '/api/query',
                    'tableName': 'flare_nodes',
                },
                'execution': {
                    'defaultMode': 'local',
                    'supportedModes': ['local', 'remote'],
                    'rowCount': len(load_dataset_entity('flare', 'nodes')),
                    'preferredPreviewLimit': 16,
                    'notes': [
                        'Hierarchy metadata is exposed now so tree techniques can reuse the shared graph contract.',
                        'Parent-child links are synthesized locally and remotely from the flat flare JSON rows.',
                    ],
                },
            }
        ),
        'earthquakes': DatasetDescriptor.model_validate(
            {
                'id': 'earthquakes',
                'title': 'Earthquakes',
                'description': 'Starter spatio-temporal dataset reserved for the v2.4 milestone.',
                'kind': 'spatio-temporal',
                'tags': ['starter', 'vega', 'spatio-temporal'],
                'provenance': {
                    'name': 'Vega Earthquakes dataset',
                    'url': 'https://vega.github.io/vega-datasets/data/earthquakes.json',
                    'license': 'Public sample dataset',
                    'notes': 'Curated local sample with latitude, longitude, and time.',
                },
                'schema': {
                    'entity': 'rows',
                    'primaryKey': ['id'],
                    'labelField': 'place',
                    'timeField': 'time',
                    'rowCount': len(load_dataset_entity('earthquakes')),
                    'fields': [
                        {'name': 'id', 'title': 'Event id', 'dataType': 'string', 'role': 'identifier'},
                        {'name': 'time', 'title': 'Time', 'dataType': 'date', 'role': 'timestamp'},
                        {'name': 'latitude', 'title': 'Latitude', 'dataType': 'latitude', 'role': 'location'},
                        {'name': 'longitude', 'title': 'Longitude', 'dataType': 'longitude', 'role': 'location'},
                        {'name': 'magnitude', 'title': 'Magnitude', 'dataType': 'number', 'role': 'measure'},
                        {'name': 'depth_km', 'title': 'Depth', 'dataType': 'number', 'role': 'measure', 'unit': 'km'},
                        {'name': 'place', 'title': 'Place', 'dataType': 'string', 'role': 'category'},
                    ],
                },
                'loader': {
                    'format': 'json',
                    'localPath': '/datasets/earthquakes.sample.json',
                    'remotePath': '/api/query',
                    'tableName': 'earthquakes',
                },
                'execution': {
                    'defaultMode': 'remote',
                    'supportedModes': ['local', 'remote'],
                    'rowCount': len(load_dataset_entity('earthquakes')),
                    'preferredPreviewLimit': 6,
                    'notes': [
                        'Spatial viewport coordination is planned for v2.4.0.',
                        'The dataset is already normalized for time and location fields.',
                    ],
                },
            }
        ),
    }


@lru_cache(maxsize=None)
def _load_raw_file(dataset_id: str) -> Any:
    path = DATA_DIR / f'{dataset_id}.sample.json'
    with path.open('r', encoding='utf-8') as handle:
        return json.load(handle)


def list_datasets() -> list[DatasetDescriptor]:
    return list(dataset_registry().values())


def get_dataset(dataset_id: str) -> DatasetDescriptor:
    registry = dataset_registry()
    if dataset_id not in registry:
        raise KeyError(dataset_id)
    return registry[dataset_id]


def load_dataset_entity(dataset_id: str, entity: str | None = None) -> list[dict[str, Any]]:
    raw = _load_raw_file(dataset_id)
    if isinstance(raw, list):
        if entity == 'links':
            return _build_hierarchy_links(raw)
        return raw
    if entity and entity in raw:
        return raw[entity]
    if 'rows' in raw:
        return raw['rows']
    if 'nodes' in raw:
        return raw['nodes']
    return []
