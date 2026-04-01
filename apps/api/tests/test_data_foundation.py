from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_dataset_registry_endpoint_returns_seed_datasets() -> None:
    client = TestClient(app)

    response = client.get('/api/datasets')

    assert response.status_code == 200
    payload = response.json()
    ids = {item['id'] for item in payload}
    assert ids == {'cars', 'miserables', 'flare', 'earthquakes'}

    flare = next(item for item in payload if item['id'] == 'flare')
    assert flare['schema']['hierarchy'] == {
        'childrenField': None,
        'rootId': '1',
        'parentField': 'parent',
        'depthField': 'depth',
        'labelField': 'name',
    }
    assert set(flare['schema']['entities'].keys()) == {'nodes', 'links'}


def test_query_endpoint_filters_and_projects_rows() -> None:
    client = TestClient(app)

    response = client.post(
        '/api/query',
        json={
            'datasetId': 'cars',
            'filters': [
                {
                    'field': 'horsepower',
                    'operator': 'gte',
                    'value': 150,
                }
            ],
            'sorts': [{'field': 'horsepower', 'direction': 'desc'}],
            'select': ['name', 'horsepower', 'origin'],
            'limit': 3,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['resultKind'] == 'table'
    assert payload['executionMode'] == 'remote'
    assert payload['rowCount'] == 3
    assert payload['columns'] == ['name', 'horsepower', 'origin']
    assert payload['rows'][0]['horsepower'] == 165


def test_query_endpoint_returns_graph_results_for_miserables() -> None:
    client = TestClient(app)

    response = client.post(
        '/api/query',
        json={
            'datasetId': 'miserables',
            'executionMode': 'remote',
            'filters': [
                {
                    'field': 'group',
                    'operator': 'in',
                    'value': [1, 2, 3],
                }
            ],
            'graph': {
                'focusNodeId': 'Valjean',
                'neighborDepth': 2,
                'minEdgeWeight': 4,
                'includeIsolates': False,
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['resultKind'] == 'graph'
    assert payload['executionMode'] == 'remote'
    assert payload['summary']['focusedNodeId'] == 'Valjean'
    assert payload['nodeCount'] == 5
    assert payload['edgeCount'] == 4
    assert payload['summary']['groupCount'] == 3
    assert payload['summary']['topNodes'][0]['id'] == 'Valjean'
    assert payload['summary']['topNodes'][0]['weightedDegree'] == 17


def test_query_endpoint_returns_graph_results_for_flare_hierarchy() -> None:
    client = TestClient(app)

    response = client.post(
        '/api/query',
        json={
            'datasetId': 'flare',
            'executionMode': 'remote',
            'filters': [
                {
                    'field': 'depth',
                    'operator': 'lte',
                    'value': 2,
                }
            ],
            'graph': {
                'includeIsolates': True,
                'minEdgeWeight': 0,
                'neighborDepth': 2,
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['resultKind'] == 'graph'
    assert payload['datasetId'] == 'flare'
    assert payload['executionMode'] == 'remote'
    assert payload['nodeCount'] > 0
    assert payload['edgeCount'] > 0
    assert payload['nodes'][0]['attributes']
    assert payload['summary']['groupCount'] >= 1
    assert any(node['parentId'] for node in payload['nodes'] if node.get('parentId'))


def test_job_endpoint_executes_background_query() -> None:
    client = TestClient(app)

    response = client.post(
        '/api/jobs',
        json={
            'description': 'Average horsepower by origin',
            'query': {
                'datasetId': 'cars',
                'groupBy': ['origin'],
                'aggregates': [
                    {'operation': 'avg', 'field': 'horsepower', 'as': 'avg_horsepower'},
                    {'operation': 'count', 'as': 'sample_count'},
                ],
                'sorts': [{'field': 'avg_horsepower', 'direction': 'desc'}],
            },
        },
    )

    assert response.status_code == 200
    job_id = response.json()['id']

    status_response = client.get(f'/api/jobs/{job_id}')

    assert status_response.status_code == 200
    payload = status_response.json()
    assert payload['status'] == 'completed'
    assert payload['result']['resultKind'] == 'table'
    assert payload['result']['rowCount'] == 3
    assert payload['result']['rows'][0]['avg_horsepower'] >= payload['result']['rows'][1]['avg_horsepower']
