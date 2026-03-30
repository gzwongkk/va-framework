from __future__ import annotations

from datetime import UTC, datetime
from threading import Lock
from uuid import uuid4

from .models import JobRecord, JobRequest
from .query_engine import execute_query

_JOB_STORE: dict[str, JobRecord] = {}
_JOB_LOCK = Lock()


def create_job(request: JobRequest) -> JobRecord:
    record = JobRecord(
        id=str(uuid4()),
        description=request.description,
        status='queued',
        submittedAt=datetime.now(UTC).isoformat(),
        query=request.query,
    )

    with _JOB_LOCK:
        _JOB_STORE[record.id] = record

    return record


def run_job(job_id: str) -> JobRecord:
    with _JOB_LOCK:
        record = _JOB_STORE[job_id]
        record.status = 'running'

    try:
        result = execute_query(record.query)
        with _JOB_LOCK:
            record.status = 'completed'
            record.result = result
            record.completedAt = datetime.now(UTC).isoformat()
    except Exception as error:  # pragma: no cover - defensive path
        with _JOB_LOCK:
            record.status = 'failed'
            record.error = str(error)
            record.completedAt = datetime.now(UTC).isoformat()

    return record


def get_job(job_id: str) -> JobRecord | None:
    with _JOB_LOCK:
        return _JOB_STORE.get(job_id)
