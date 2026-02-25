import uuid
from datetime import datetime
from pydantic import BaseModel
from db.models import RunStatus

class RunCreate(BaseModel):
    scenario_id: uuid.UUID
    run_id: uuid.UUID | None = None
    nats_subject: str | None = None

class RunStatusUpdate(BaseModel):
    status: RunStatus
    nats_subject: str | None = None
    event_count: int | None = None
    duration_seconds: float | None = None

class RunResponse(BaseModel):
    id: uuid.UUID
    scenario_id: uuid.UUID
    status: RunStatus
    nats_subject: str | None
    event_count: int
    duration_seconds: float | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
