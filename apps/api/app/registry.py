from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from .models import DatasetDescriptor

DATA_DIR = Path(__file__).resolve().parent.parent / 'data'


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
                },
                'loader': {
                    'format': 'json',
                    'localPath': '/datasets/miserables.sample.json',
                    'remotePath': '/api/query',
                    'tableName': 'miserables_nodes',
                },
                'execution': {
                    'defaultMode': 'remote',
                    'supportedModes': ['local', 'remote'],
                    'rowCount': len(load_dataset_entity('miserables', 'nodes')),
                    'preferredPreviewLimit': 8,
                    'notes': [
                        'Graph entity expansion will land in v2.3.0.',
                        'The foundation already exposes this dataset through the shared registry.',
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
        return raw
    if entity and entity in raw:
        return raw[entity]
    if 'rows' in raw:
        return raw['rows']
    if 'nodes' in raw:
        return raw['nodes']
    return []
