from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_dataset_registry_endpoint_returns_seed_datasets() -> None:
    client = TestClient(app)

    response = client.get('/api/datasets')

    assert response.status_code == 200
    payload = response.json()
    ids = {item['id'] for item in payload}
    assert ids == {'cars', 'miserables', 'earthquakes'}


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
    assert payload['executionMode'] == 'remote'
    assert payload['rowCount'] == 3
    assert payload['columns'] == ['name', 'horsepower', 'origin']
    assert payload['rows'][0]['horsepower'] == 165


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
    assert payload['result']['rowCount'] == 3
    assert payload['result']['rows'][0]['avg_horsepower'] >= payload['result']['rows'][1]['avg_horsepower']
