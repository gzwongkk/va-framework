from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

DatasetKind = Literal['tabular', 'graph', 'spatio-temporal']
ExecutionMode = Literal['local', 'remote']
FieldDataType = Literal['string', 'number', 'boolean', 'date', 'json', 'latitude', 'longitude']
FieldRole = Literal['dimension', 'measure', 'identifier', 'timestamp', 'location', 'category']
FilterOperator = Literal['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'between', 'contains']
SortDirection = Literal['asc', 'desc']
AggregateOperation = Literal['count', 'sum', 'avg', 'min', 'max']
JobStatus = Literal['queued', 'running', 'completed', 'failed']


class FieldSpec(BaseModel):
    name: str
    title: str
    dataType: FieldDataType
    role: FieldRole = 'dimension'
    description: str | None = None
    nullable: bool = False
    unit: str | None = None


class DatasetSchema(BaseModel):
    entity: str = 'rows'
    fields: list[FieldSpec] = Field(default_factory=list)
    primaryKey: list[str] = Field(default_factory=list)
    rowCount: int | None = None
    timeField: str | None = None
    labelField: str | None = None


class Provenance(BaseModel):
    name: str
    url: str
    license: str | None = None
    notes: str | None = None


class DatasetLoader(BaseModel):
    format: Literal['json'] = 'json'
    localPath: str
    remotePath: str | None = None
    tableName: str | None = None


class DatasetExecution(BaseModel):
    defaultMode: ExecutionMode
    supportedModes: list[ExecutionMode]
    preferredPreviewLimit: int = 12
    rowCount: int
    notes: list[str] = Field(default_factory=list)


class DatasetDescriptor(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    description: str
    kind: DatasetKind
    tags: list[str] = Field(default_factory=list)
    provenance: Provenance
    datasetSchema: DatasetSchema = Field(alias='schema')
    loader: DatasetLoader
    execution: DatasetExecution


class FilterClause(BaseModel):
    field: str
    operator: FilterOperator
    value: Any
    secondaryValue: str | int | float | bool | None = None


class SortSpec(BaseModel):
    field: str
    direction: SortDirection = 'asc'


class AggregateSpec(BaseModel):
    operation: AggregateOperation
    field: str | None = None
    as_: str = Field(alias='as')


class QuerySpec(BaseModel):
    datasetId: str
    entity: str | None = None
    select: list[str] = Field(default_factory=list)
    filters: list[FilterClause] = Field(default_factory=list)
    sorts: list[SortSpec] = Field(default_factory=list)
    groupBy: list[str] = Field(default_factory=list)
    aggregates: list[AggregateSpec] = Field(default_factory=list)
    limit: int | None = None
    executionMode: ExecutionMode | None = None


class QueryResult(BaseModel):
    datasetId: str
    columns: list[str]
    rows: list[dict[str, Any]]
    rowCount: int
    executionMode: ExecutionMode
    queryKey: str
    durationMs: float
    source: Literal['api', 'duckdb-worker']


class JobRequest(BaseModel):
    description: str | None = None
    query: QuerySpec


class JobRecord(BaseModel):
    id: str
    description: str | None = None
    status: JobStatus
    submittedAt: str
    completedAt: str | None = None
    query: QuerySpec
    result: QueryResult | None = None
    error: str | None = None
