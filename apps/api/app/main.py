from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .jobs import create_job, get_job, run_job
from .models import JobRecord, JobRequest, QueryResult, QuerySpec
from .query_engine import execute_query
from .registry import DatasetDescriptor, list_datasets

app = FastAPI(
    title='va-framework API',
    version='2.3.9',
    description='Graph workbench API for the React-native visual analytics framework.',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_origin_regex=r'^https?://(localhost|127\.0\.0\.1|(?:10|192\.168|172\.(?:1[6-9]|2\d|3[0-1]))(?:\.\d{1,3}){2}|[A-Za-z0-9.-]+)(:\d+)?$',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/api/health')
def get_health() -> dict[str, str]:
    return {
        'status': 'ok',
        'version': '2.3.9',
        'stage': 'graph-workbench-final',
    }


@app.get('/api/datasets', response_model=list[DatasetDescriptor])
def get_datasets() -> list[DatasetDescriptor]:
    return list_datasets()


@app.post('/api/query', response_model=QueryResult)
def post_query(query: QuerySpec) -> QueryResult:
    return execute_query(query)


@app.post('/api/jobs', response_model=JobRecord)
def post_job(request: JobRequest, background_tasks: BackgroundTasks) -> JobRecord:
    record = create_job(request)
    background_tasks.add_task(run_job, record.id)
    return record


@app.get('/api/jobs/{job_id}', response_model=JobRecord)
def get_job_status(job_id: str) -> JobRecord:
    record = get_job(job_id)
    if record is None:
        raise HTTPException(status_code=404, detail='Job not found')
    return record
