from pydantic import BaseModel
from typing import Optional


class TrafficNode(BaseModel):
    id: str
    osm_id: int
    position: tuple[float, float]
    connection_count: int


class TrafficLink(BaseModel):
    id: str
    osm_id: int
    from_node: str
    to_node: str
    geometry: list[tuple[float, float]]
    tags: dict[str, str]


class Building(BaseModel):
    id: str
    osm_id: int
    position: tuple[float, float]
    geometry: list[tuple[float, float]]
    type: Optional[str] = None
    tags: dict[str, str]


class TransportRoute(BaseModel):
    id: str
    osm_id: int
    way_id: int
    geometry: list[tuple[float, float]]
    tags: dict[str, str]


class NetworkResponse(BaseModel):
    nodes: list[TrafficNode]
    links: list[TrafficLink]
    buildings: list[Building]
    transport_routes: list[TransportRoute]
