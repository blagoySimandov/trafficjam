import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from db.models import RunStatus


class RunCreate(BaseModel):
    scenario_id: uuid.UUID = Field(description="Parent scenario UUID")
    run_id: uuid.UUID | None = Field(default=None, description="Optional client-supplied run UUID")
    nats_subject: str | None = Field(default=None, description="NATS subject override for event streaming")


class RunStatusUpdate(BaseModel):
    status: RunStatus = Field(description="New run status")
    nats_subject: str | None = Field(default=None, description="NATS subject for event streaming")
    event_count: int | None = Field(default=None, description="Total events produced so far")
    duration_seconds: float | None = Field(default=None, description="Elapsed simulation time in seconds")


class RunResponse(BaseModel):
    id: uuid.UUID = Field(description="Run UUID")
    scenario_id: uuid.UUID = Field(description="Parent scenario UUID")
    status: RunStatus = Field(description="Current run status")
    nats_subject: str | None = Field(description="NATS subject used for event streaming")
    event_count: int = Field(description="Total simulation events produced")
    duration_seconds: float | None = Field(description="Total simulation duration in seconds")
    created_at: datetime = Field(description="Creation timestamp (UTC)")
    updated_at: datetime = Field(description="Last status update timestamp (UTC)")

    model_config = {"from_attributes": True}
