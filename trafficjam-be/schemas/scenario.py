import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ScenarioCreate(BaseModel):
    name: str
    description: str | None = None
    network_config: dict[str, Any] | None = None
    plan_params: str
    matsim_config: dict[str, Any] | None = None


class ScenarioUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    network_config: dict[str, Any] | None = None
    plan_params: str | None = None
    matsim_config: dict[str, Any] | None = None


class ScenarioSummary(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    plan_params: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScenarioResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    network_config: dict[str, Any] | None
    plan_params: str
    matsim_config: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
