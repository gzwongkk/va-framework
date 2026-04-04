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
                'category': 'tabular',
                'tags': ['starter', 'vega', 'tabular'],
                'featuredExampleIds': ['cars-scatter'],
                'previewSummary': 'Compact reference table for one-page filtering, scatterplots, and record inspection.',
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
                'starter': {
                    'kindAdapterId': 'tabular',
                    'priority': 'primary',
                    'defaultVariant': 'scatter',
                    'supportedVariants': ['scatter', 'table'],
                    'supportsMultiDatasetBinding': False,
                },
            }
        ),
        'miserables': DatasetDescriptor.model_validate(
            {
                'id': 'miserables',
                'title': 'Les Miserables graph',
                'description': 'Starter graph dataset queued for the v2.3 graph milestone.',
                'kind': 'graph',
                'category': 'graph',
                'tags': ['starter', 'vega', 'graph'],
                'featuredExampleIds': ['graph-force', 'graph-matrix', 'graph-multivariate'],
                'previewSummary': 'Weighted character network used for force, matrix, and multivariate graph analysis techniques.',
                'provenance': {
                    'name': 'Vega Miserables dataset',
                    'url': 'https://vega.github.io/vega-datasets/data/miserables.json',
                    'license': 'Public sample dataset',
                    'notes': 'Canonical Vega graph normalized locally for the graph workbench runtime.',
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
                'starter': {
                    'kindAdapterId': 'graph',
                    'priority': 'primary',
                    'defaultVariant': 'force',
                    'supportedVariants': ['force', 'matrix'],
                    'supportsMultiDatasetBinding': True,
                },
            }
        ),
        'flare': DatasetDescriptor.model_validate(
            {
                'id': 'flare',
                'title': 'Flare hierarchy',
                'description': 'Hierarchy dataset for the v2.3 graph workbench tree technique line.',
                'kind': 'graph',
                'category': 'hierarchy',
                'tags': ['starter', 'vega', 'graph', 'tree', 'hierarchy'],
                'featuredExampleIds': ['hierarchy-suite'],
                'previewSummary': 'True hierarchy sample used for explicit and implicit tree techniques in the workbench.',
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
                'starter': {
                    'kindAdapterId': 'graph',
                    'priority': 'reference',
                    'defaultVariant': 'hierarchy',
                    'supportedVariants': ['hierarchy'],
                    'supportsMultiDatasetBinding': True,
                },
            }
        ),
        'earthquakes': DatasetDescriptor.model_validate(
            {
                'id': 'earthquakes',
                'title': 'Earthquakes',
                'description': 'Starter spatio-temporal dataset reserved for the v2.4 milestone.',
                'kind': 'spatio-temporal',
                'category': 'seed',
                'tags': ['starter', 'vega', 'spatio-temporal'],
                'featuredExampleIds': [],
                'previewSummary': 'Seed-only spatial dataset kept in the registry ahead of the dedicated v2.4 spatio-temporal line.',
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
                'starter': {
                    'kindAdapterId': 'spatio-temporal',
                    'priority': 'seed',
                    'defaultVariant': 'map',
                    'supportedVariants': ['map'],
                    'supportsMultiDatasetBinding': True,
                },
            }
        ),
        'penguins': DatasetDescriptor.model_validate(
            {
                'id': 'penguins',
                'title': 'Penguins',
                'description': 'Palmer penguins morphology sample normalized for multivariate tabular examples.',
                'kind': 'tabular',
                'category': 'tabular',
                'tags': ['official', 'vega', 'tabular', 'multivariate'],
                'featuredExampleIds': ['penguins-splom'],
                'previewSummary': '344 penguin observations across species, island, sex, and body measurements for brushable multivariate examples.',
                'provenance': {
                    'name': 'Vega Penguins dataset',
                    'url': 'https://vega.github.io/vega-datasets/data/penguins.json',
                    'license': 'Public sample dataset',
                    'notes': 'Vendored and normalized to snake_case JSON for the gallery dataset pack.',
                },
                'schema': {
                    'entity': 'rows',
                    'primaryKey': ['id'],
                    'labelField': 'id',
                    'rowCount': len(load_dataset_entity('penguins')),
                    'fields': [
                        {'name': 'id', 'title': 'Penguin id', 'dataType': 'string', 'role': 'identifier'},
                        {'name': 'species', 'title': 'Species', 'dataType': 'string', 'role': 'category'},
                        {'name': 'island', 'title': 'Island', 'dataType': 'string', 'role': 'category'},
                        {'name': 'beak_length_mm', 'title': 'Beak length', 'dataType': 'number', 'role': 'measure', 'unit': 'mm'},
                        {'name': 'beak_depth_mm', 'title': 'Beak depth', 'dataType': 'number', 'role': 'measure', 'unit': 'mm'},
                        {'name': 'flipper_length_mm', 'title': 'Flipper length', 'dataType': 'number', 'role': 'measure', 'unit': 'mm'},
                        {'name': 'body_mass_g', 'title': 'Body mass', 'dataType': 'number', 'role': 'measure', 'unit': 'g'},
                        {'name': 'sex', 'title': 'Sex', 'dataType': 'string', 'role': 'category', 'nullable': True},
                    ],
                },
                'loader': {
                    'format': 'json',
                    'localPath': '/datasets/penguins.sample.json',
                    'remotePath': '/api/query',
                    'tableName': 'penguins',
                },
                'execution': {
                    'defaultMode': 'local',
                    'supportedModes': ['local', 'remote'],
                    'rowCount': len(load_dataset_entity('penguins')),
                    'preferredPreviewLimit': 24,
                    'notes': [
                        'Designed for brushable scatterplot matrices and other multivariate tabular examples.',
                        'The local path uses the browser runtime for lightweight filters and the DuckDB worker for larger projections.',
                    ],
                },
                'starter': {
                    'kindAdapterId': 'tabular',
                    'priority': 'reference',
                    'defaultVariant': 'splom',
                    'supportedVariants': ['scatter', 'splom', 'table'],
                    'supportsMultiDatasetBinding': False,
                },
            }
        ),
        'energy': DatasetDescriptor.model_validate(
            {
                'id': 'energy',
                'title': 'Energy Sankey graph',
                'description': 'Flow network dataset normalized for Sankey-style source-target analysis.',
                'kind': 'graph',
                'category': 'flow',
                'tags': ['official', 'd3', 'graph', 'flow', 'sankey'],
                'featuredExampleIds': ['energy-sankey'],
                'previewSummary': '48 energy-system nodes and 68 weighted links for flow tracing, source-target filtering, and Sankey summaries.',
                'provenance': {
                    'name': 'D3 Sankey energy dataset',
                    'url': 'https://raw.githubusercontent.com/d3/d3-sankey/master/test/energy.json',
                    'license': 'Public example dataset',
                    'notes': 'Vendored and enriched with stage metadata for the gallery flow example.',
                },
                'schema': {
                    'entity': 'nodes',
                    'primaryKey': ['id'],
                    'labelField': 'name',
                    'rowCount': len(load_dataset_entity('energy', 'nodes')),
                    'fields': [
                        {'name': 'id', 'title': 'Node id', 'dataType': 'string', 'role': 'identifier'},
                        {'name': 'name', 'title': 'Node name', 'dataType': 'string', 'role': 'category'},
                        {'name': 'group', 'title': 'Stage', 'dataType': 'number', 'role': 'category'},
                        {'name': 'stage', 'title': 'Stage', 'dataType': 'number', 'role': 'measure'},
                        {'name': 'in_degree', 'title': 'In degree', 'dataType': 'number', 'role': 'measure'},
                        {'name': 'out_degree', 'title': 'Out degree', 'dataType': 'number', 'role': 'measure'},
                    ],
                    'entities': {
                        'nodes': {
                            'primaryKey': ['id'],
                            'labelField': 'name',
                            'rowCount': len(load_dataset_entity('energy', 'nodes')),
                            'fields': [
                                {'name': 'id', 'title': 'Node id', 'dataType': 'string', 'role': 'identifier'},
                                {'name': 'name', 'title': 'Node name', 'dataType': 'string', 'role': 'category'},
                                {'name': 'group', 'title': 'Stage', 'dataType': 'number', 'role': 'category'},
                                {'name': 'stage', 'title': 'Stage', 'dataType': 'number', 'role': 'measure'},
                                {'name': 'in_degree', 'title': 'In degree', 'dataType': 'number', 'role': 'measure'},
                                {'name': 'out_degree', 'title': 'Out degree', 'dataType': 'number', 'role': 'measure'},
                            ],
                        },
                        'links': {
                            'primaryKey': ['source', 'target'],
                            'rowCount': len(load_dataset_entity('energy', 'links')),
                            'sourceField': 'source',
                            'targetField': 'target',
                            'weightField': 'value',
                            'fields': [
                                {'name': 'source', 'title': 'Source', 'dataType': 'string', 'role': 'identifier'},
                                {'name': 'target', 'title': 'Target', 'dataType': 'string', 'role': 'identifier'},
                                {'name': 'value', 'title': 'Flow value', 'dataType': 'number', 'role': 'measure'},
                            ],
                        },
                    },
                },
                'loader': {
                    'format': 'json',
                    'localPath': '/datasets/energy.sample.json',
                    'remotePath': '/api/query',
                    'tableName': 'energy_nodes',
                },
                'execution': {
                    'defaultMode': 'local',
                    'supportedModes': ['local', 'remote'],
                    'rowCount': len(load_dataset_entity('energy', 'nodes')),
                    'preferredPreviewLimit': 12,
                    'notes': [
                        'Flow analysis reuses the shared graph query contract and a native Sankey renderer in the gallery line.',
                        'Stage metadata helps the flow example summarize upstream, midstream, and downstream energy paths.',
                    ],
                },
                'starter': {
                    'kindAdapterId': 'graph',
                    'priority': 'reference',
                    'defaultVariant': 'flow',
                    'supportedVariants': ['flow'],
                    'supportsMultiDatasetBinding': True,
                },
            }
        ),
        'stocks': DatasetDescriptor.model_validate(
            {
                'id': 'stocks',
                'title': 'Stocks',
                'description': 'Time-series table for focus-plus-context interaction examples.',
                'kind': 'tabular',
                'category': 'time-series',
                'tags': ['official', 'vega', 'tabular', 'time-series'],
                'featuredExampleIds': ['stocks-focus-context'],
                'previewSummary': '560 monthly stock prices across multiple symbols for brushing and focus-context domain changes.',
                'provenance': {
                    'name': 'Vega Stocks dataset',
                    'url': 'https://vega.github.io/vega-datasets/data/stocks.csv',
                    'license': 'Public sample dataset',
                    'notes': 'Vendored from the official CSV and normalized to JSON with ISO dates.',
                },
                'schema': {
                    'entity': 'rows',
                    'primaryKey': ['id'],
                    'labelField': 'symbol',
                    'timeField': 'date',
                    'rowCount': len(load_dataset_entity('stocks')),
                    'fields': [
                        {'name': 'id', 'title': 'Observation id', 'dataType': 'string', 'role': 'identifier'},
                        {'name': 'symbol', 'title': 'Symbol', 'dataType': 'string', 'role': 'category'},
                        {'name': 'date', 'title': 'Date', 'dataType': 'date', 'role': 'timestamp'},
                        {'name': 'price', 'title': 'Price', 'dataType': 'number', 'role': 'measure'},
                    ],
                },
                'loader': {
                    'format': 'json',
                    'localPath': '/datasets/stocks.sample.json',
                    'remotePath': '/api/query',
                    'tableName': 'stocks',
                },
                'execution': {
                    'defaultMode': 'local',
                    'supportedModes': ['local', 'remote'],
                    'rowCount': len(load_dataset_entity('stocks')),
                    'preferredPreviewLimit': 36,
                    'notes': [
                        'Time-series examples reuse the existing tabular query contract and local preview path.',
                        'The focus-context milestone uses date filtering and symbol selection without expanding the wire schema.',
                    ],
                },
                'starter': {
                    'kindAdapterId': 'tabular',
                    'priority': 'reference',
                    'defaultVariant': 'time-series',
                    'supportedVariants': ['time-series', 'table'],
                    'supportsMultiDatasetBinding': False,
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
