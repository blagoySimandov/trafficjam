from pydantic import BaseModel
from typing import Optional


class TrafficNode(BaseModel):
    id: int
    position: tuple[float, float]
    connection_count: int


class TrafficLink(BaseModel):
    id: int
    from_node: int
    to_node: int
    geometry: list[tuple[float, float]]
    tags: dict[str, str]


class Building(BaseModel):
    id: int
    position: tuple[float, float]
    geometry: list[tuple[float, float]]
    type: Optional[str] = None
    tags: dict[str, str]


class TransportRoute(BaseModel):
    id: int
    geometry: list[list[tuple[float, float]]]
    tags: dict[str, str]


class NetworkResponse(BaseModel):
    nodes: list[TrafficNode]
    links: list[TrafficLink]
    buildings: list[Building]
    transport_routes: list[TransportRoute]
