from typing import Protocol

from agents.models import Agent, Building, DailyPlan
from agents.config import AgentConfig


class PlanStrategy(Protocol):
    def supports(self, agent: Agent, config: AgentConfig) -> bool: ...
    def generate(self, agent: Agent, buildings: list[Building], config: AgentConfig) -> DailyPlan | None: ...
