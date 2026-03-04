from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import time


class HotspotConfig(BaseModel):
    label: str = ""
    trafficPercentage: float = 0
    dwellTimeMinutes: int = 60
    startTime: str | None = None
    endTime: str | None = None
    agentTypes: list[str] = []


class Building(BaseModel):
    id: str
    osm_id: int
    position: tuple[float, float]
    geometry: list[tuple[float, float]]
    type: Optional[str] = None
    tags: dict[str, str]
    hotspot: Optional[HotspotConfig] = None

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

    def prepend_activity_after_home(self, activity: Activity, new_departure: time, leg_mode: str) -> None:
        home = self.activities[0]
        self.activities[0] = Activity(type=home.type, location=home.location, end_time=new_departure)
        self.activities.insert(1, activity)
        self.transport.insert(0, Legs(mode=leg_mode))

    def append_evening_visit(self, activity: Activity, departure_time: time, leg_mode: str) -> None:
        final_home = self.activities.pop()
        self.transport.pop()
        self.add_activity(Activity(type=ActivityType.HOME, location=final_home.location, end_time=departure_time), leg_mode)
        self.add_activity(activity, leg_mode)
        self.add_activity(Activity(type=ActivityType.HOME, location=final_home.location), leg_mode)


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


