import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ScenarioCreate(BaseModel):
    name: str = Field(description="Human-readable scenario name")
    description: str | None = Field(default=None, description="Optional longer description")
    network_config: dict[str, Any] | None = Field(default=None, description="Road network configuration (nodes, links, bounds)")
    plan_params: dict[str, Any] = Field(description="Agent plan parameters (e.g. maxAgents, mode split)")
    matsim_config: dict[str, Any] | None = Field(default=None, description="MATSim-specific simulation config overrides")


class ScenarioUpdate(BaseModel):
    name: str | None = Field(default=None, description="New scenario name")
    description: str | None = Field(default=None, description="New description")
    network_config: dict[str, Any] | None = Field(default=None, description="Updated network configuration")
    plan_params: dict[str, Any] | None = Field(default=None, description="Updated agent plan parameters")
    matsim_config: dict[str, Any] | None = Field(default=None, description="Updated MATSim config overrides")


class ScenarioSummary(BaseModel):
    id: uuid.UUID = Field(description="Scenario UUID")
    name: str = Field(description="Scenario name")
    description: str | None = Field(description="Optional description")
    plan_params: dict[str, Any] | None = Field(default=None, description="Agent plan parameters")
    created_at: datetime = Field(description="Creation timestamp (UTC)")
    updated_at: datetime = Field(description="Last update timestamp (UTC)")

    model_config = {"from_attributes": True}


class ScenarioResponse(BaseModel):
    id: uuid.UUID = Field(description="Scenario UUID")
    name: str = Field(description="Scenario name")
    description: str | None = Field(description="Optional description")
    network_config: dict[str, Any] | None = Field(description="Road network configuration")
    plan_params: dict[str, Any] | None = Field(default=None, description="Agent plan parameters")
    matsim_config: dict[str, Any] | None = Field(description="MATSim simulation config")
    created_at: datetime = Field(description="Creation timestamp (UTC)")
    updated_at: datetime = Field(description="Last update timestamp (UTC)")

    model_config = {"from_attributes": True}
