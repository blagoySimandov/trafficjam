from pydantic import BaseModel
from typing import Optional
from enum import Enum


class TransportMode(str, Enum):
    CAR = "car"
    PUBLIC_TRANSPORT = "pt"
    WALK = "walk"
    BIKE = "bike"


class Building(BaseModel):
    id: str
    osm_id: int
    position: tuple[float, float]
    geometry: list[tuple[float, float]]
    type: Optional[str] = None
    tags: dict[str, str]

    def get_tag(self, key: str) -> Optional[str]:
        return self.tags.get(key)


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
