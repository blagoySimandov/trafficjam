from pydantic import BaseModel, Field
from typing import Optional


class NetworkRequest(BaseModel):
    min_lat: float = Field(..., ge=-90, le=90)
    min_lng: float = Field(..., ge=-180, le=180)
    max_lat: float = Field(..., ge=-90, le=90)
    max_lng: float = Field(..., ge=-180, le=180)
    crs: str = Field(default="EPSG:32629")


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
    way_id: int
    geometry: list[tuple[float, float]]
    tags: dict[str, str]


class NetworkResponse(BaseModel):
    crs: str
    nodes: list[TrafficNode]
    links: list[TrafficLink]
    buildings: list[Building]
    transport_routes: list[TransportRoute]
