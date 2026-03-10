from pydantic import BaseModel, Field
from typing import Optional


class TrafficNode(BaseModel):
    id: int = Field(description="Unique OSM node identifier")
    position: tuple[float, float] = Field(description="(longitude, latitude) coordinate")
    connection_count: int = Field(description="Number of links connected to this node")

    model_config = {
        "json_schema_extra": {
            "example": {"id": 123456, "position": [13.4050, 52.5200], "connection_count": 3}
        }
    }


class TrafficLink(BaseModel):
    id: int = Field(description="Unique OSM way identifier")
    from_node: int = Field(description="Origin node ID")
    to_node: int = Field(description="Destination node ID")
    geometry: list[tuple[float, float]] = Field(description="Ordered list of (longitude, latitude) points forming the link")
    tags: dict[str, str] = Field(description="OSM tags: highway, lanes, maxspeed, oneway, name, ref, surface")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 789,
                "from_node": 111,
                "to_node": 222,
                "geometry": [[13.4050, 52.5200], [13.4055, 52.5205]],
                "tags": {"highway": "primary", "maxspeed": "50", "oneway": "yes"},
            }
        }
    }


class Building(BaseModel):
    id: int = Field(description="Unique OSM building identifier")
    position: tuple[float, float] = Field(description="(longitude, latitude) centroid of the building")
    geometry: list[tuple[float, float]] = Field(description="Ordered polygon ring coordinates (longitude, latitude)")
    type: Optional[str] = Field(default=None, description="Building category: retail, apartments, supermarket, school, kindergarten, or parking")
    tags: dict[str, str] = Field(description="OSM tags: building, name, shop, addr:street, building:levels")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 42,
                "position": [13.4050, 52.5200],
                "geometry": [[13.404, 52.519], [13.406, 52.519], [13.406, 52.521], [13.404, 52.521]],
                "type": "retail",
                "tags": {"building": "yes", "name": "Mall of Berlin", "shop": "mall"},
            }
        }
    }


class TransportRoute(BaseModel):
    id: int = Field(description="Unique route group identifier")
    geometry: list[list[tuple[float, float]]] = Field(description="List of line segments, each a list of (longitude, latitude) points")
    tags: dict[str, str] = Field(description="OSM tags: route, ref, name, operator, network, from, to, colour")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 7,
                "geometry": [[[13.4050, 52.5200], [13.4060, 52.5210]]],
                "tags": {"route": "bus", "ref": "100", "name": "Bus 100", "colour": "#FF0000"},
            }
        }
    }


class NetworkResponse(BaseModel):
    nodes: list[TrafficNode] = Field(description="Road network intersection nodes")
    links: list[TrafficLink] = Field(description="Directed road segments connecting nodes")
    buildings: list[Building] = Field(description="Buildings of interest (retail, residential, etc.)")
    transport_routes: list[TransportRoute] = Field(description="Public transport routes (bus, tram, metro, etc.)")
