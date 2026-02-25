from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import time

from .config import config as _env_config


class Building(BaseModel):
    id: str
    osm_id: int
    position: tuple[float, float]
    geometry: list[tuple[float, float]]
    type: Optional[str] = None
    tags: dict[str, str]

    def get_tag(self, key: str) -> Optional[str]:
        return self.tags.get(key)


class ActivityType(str, Enum):
    HOME = "home"
    WORK = "work"
    EDUCATION = "education"
    SHOPPING = "shopping"
    HEALTHCARE = "healthcare"
    LEISURE = "leisure"


class Activity(BaseModel):
    type: ActivityType
    location: tuple[float, float] = (0, 0)
    end_time: time | None = None
    duration: time | None = None

    def to_dict(self) -> dict:
        result = {"type": self.type.value, "x": self.location[0], "y": self.location[1]}
        if self.end_time:
            result["end_time"] = self.end_time
        if self.duration:
            result["dur"] = self.duration
        return result


class Legs(BaseModel):
    mode: str

    def to_dict(self) -> dict:
        return {"mode": self.mode}


class DailyPlan(BaseModel):
    activities: list[Activity] = []
    transport: list[Legs] = []

    def add_activity(self, activity: Activity, leg_mode: str | None = None) -> None:
        if self.activities and leg_mode:
            self.transport.append(Legs(mode=leg_mode))
        self.activities.append(activity)
        self._sort_activities()

    def _sort_activities(self) -> None:
        self.activities.sort(
            key=lambda a: (a.end_time is None, a.end_time or time(23, 59, 59))
        )


class TransportMode(str, Enum):
    CAR = "car"
    PUBLIC_TRANSPORT = "pt"
    WALK = "walk"
    BIKE = "bike"


class Agent(BaseModel):
    id: str
    age: int
    home: Building
    has_car: bool = False
    uses_public_transport: bool = False
    preferred_transport: TransportMode = TransportMode.WALK


class Child(Agent):
    school: Optional[Building] = None
    needs_dropoff: bool = False


class Adult(Agent):
    employed: bool = False
    is_student: bool = False
    work: Optional[Building] = None
    work_type: Optional[str] = None
    children: list[Child] = []
    needs_to_dropoff_children: bool = False


def _default_planner_config() -> "PlannerConfig":
    return PlannerConfig(
        population_density=_env_config.default_population_density,
        shopping_probability=_env_config.shopping_probability,
        max_shopping_distance_km=_env_config.max_shopping_distance_km,
        healthcare_chance=_env_config.healthcare_chance,
        elderly_age_threshold=_env_config.elderly_age_threshold,
        kindergarten_age=_env_config.kindergarten_age,
        min_independent_school_age=_env_config.min_independent_school_age,
        errand_min_minutes=_env_config.errand_min_minutes,
        errand_max_minutes=_env_config.errand_max_minutes,
        child_dropoff_min_minutes=_env_config.child_dropoff_min_minutes,
        child_dropoff_max_minutes=_env_config.child_dropoff_max_minutes,
    )


class PlannerConfig(BaseModel):
    population_density: int = _env_config.default_population_density
    shopping_probability: float = _env_config.shopping_probability
    max_shopping_distance_km: float = _env_config.max_shopping_distance_km
    healthcare_chance: float = _env_config.healthcare_chance
    elderly_age_threshold: int = _env_config.elderly_age_threshold
    kindergarten_age: int = _env_config.kindergarten_age
    min_independent_school_age: int = _env_config.min_independent_school_age
    errand_min_minutes: int = _env_config.errand_min_minutes
    errand_max_minutes: int = _env_config.errand_max_minutes
    child_dropoff_min_minutes: int = _env_config.child_dropoff_min_minutes
    child_dropoff_max_minutes: int = _env_config.child_dropoff_max_minutes


class PlanCreationRequest(BaseModel):
    bounds: dict[str, float]
    buildings: list[Building]
    country_code: str = "IRL"
    config: PlannerConfig = Field(default_factory=_default_planner_config)
