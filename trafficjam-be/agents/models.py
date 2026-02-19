from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import time


class Building(BaseModel):
    id: str
    osm_id: int
    position: tuple[float, float]
    geometry: list[tuple[float, float]]
    type: Optional[str] = None
    tags: dict[str, str]

    def get_tag(self, key: str) -> Optional[str]:
        return self.tags.get(key)


# Plans
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
    # Start time is implicite, its just end time of the previous task (first one is just the 00:00:00)
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


# Agents
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


# Request/Response types
class PlanCreationRequest(BaseModel):
    bounds: dict[str, float]  # {"north": ..., "south": ..., "east": ..., "west": ...}
    buildings: list[Building]
    country_code: str = "IRL"
