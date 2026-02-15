from __future__ import annotations

import asyncio
import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker
from geoalchemy2.functions import ST_Intersects, ST_MakeEnvelope

from db.db_models import NodeDB, LinkDB, BuildingDB, TransportRouteDB
from models import (
    TrafficNode,
    TrafficLink,
    Building,
    TransportRoute,
    NetworkResponse,
)
from constants import VALID_BUILDING_TYPES


def _parse_geometry(raw) -> list[tuple[float, float]]:
    if isinstance(raw, str):
        raw = json.loads(raw)
    return [(coord[0], coord[1]) for coord in raw]


def _pick_tags(row, mapping: dict[str, str]) -> dict[str, str]:
    return {key: getattr(row, attr) for attr, key in mapping.items() if getattr(row, attr)}


LINK_TAG_MAPPING = {
    "highway": "highway",
    "lanes": "lanes",
    "maxspeed": "maxspeed",
    "oneway": "oneway",
    "name": "name",
    "ref": "ref",
    "surface": "surface",
}

BUILDING_TAG_MAPPING = {
    "building": "building",
    "name": "name",
    "shop": "shop",
    "addr_street": "addr:street",
    "building_levels": "building:levels",
}

ROUTE_TAG_MAPPING = {
    "route": "route",
    "ref": "ref",
    "name": "name",
    "operator": "operator",
    "network": "network",
    "from_": "from",
    "to": "to",
    "colour": "colour",
}


class MapDataRepository:
    def __init__(self, session_factory: async_sessionmaker):
        self.session_factory = session_factory

    async def fetch_network(
        self,
        min_lat: float,
        min_lng: float,
        max_lat: float,
        max_lng: float,
    ) -> NetworkResponse:
        bbox = ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)

        nodes, links, buildings, transport_routes = await asyncio.gather(
            self._fetch_nodes(bbox),
            self._fetch_links(bbox),
            self._fetch_buildings(bbox),
            self._fetch_transport_routes(bbox),
        )

        return NetworkResponse(
            nodes=nodes,
            links=links,
            buildings=buildings,
            transport_routes=transport_routes,
        )

    async def _fetch_nodes(self, bbox) -> list[TrafficNode]:
        async with self.session_factory() as session:
            stmt = select(NodeDB).where(ST_Intersects(NodeDB.geom, bbox))
            result = await session.execute(stmt)
            rows = result.scalars().all()

        return [
            TrafficNode(
                id=row.id,
                osm_id=row.osm_id,
                position=(row.longitude, row.latitude),
                connection_count=row.connection_count,
            )
            for row in rows
        ]

    async def _fetch_links(self, bbox) -> list[TrafficLink]:
        async with self.session_factory() as session:
            stmt = select(LinkDB).where(ST_Intersects(LinkDB.geom, bbox))
            result = await session.execute(stmt)
            rows = result.scalars().all()

        links = []
        for row in rows:
            geometry = _parse_geometry(row.geometry)
            if len(geometry) < 2:
                continue
            links.append(
                TrafficLink(
                    id=row.id,
                    osm_id=row.osm_id,
                    from_node=row.from_node,
                    to_node=row.to_node,
                    geometry=geometry,
                    tags=_pick_tags(row, LINK_TAG_MAPPING),
                )
            )
        return links

    async def _fetch_buildings(self, bbox) -> list[Building]:
        async with self.session_factory() as session:
            stmt = select(BuildingDB).where(ST_Intersects(BuildingDB.geom, bbox))
            result = await session.execute(stmt)
            rows = result.scalars().all()

        buildings = []
        for row in rows:
            if row.type not in VALID_BUILDING_TYPES:
                continue

            geometry = _parse_geometry(row.geometry)

            buildings.append(
                Building(
                    id=row.id,
                    osm_id=row.osm_id,
                    position=(row.longitude, row.latitude),
                    geometry=geometry,
                    type=row.type,
                    tags=_pick_tags(row, BUILDING_TAG_MAPPING),
                )
            )
        return buildings

    async def _fetch_transport_routes(self, bbox) -> list[TransportRoute]:
        async with self.session_factory() as session:
            stmt = select(TransportRouteDB).where(
                ST_Intersects(TransportRouteDB.geom, bbox)
            )
            result = await session.execute(stmt)
            rows = result.scalars().all()

        routes = []
        for row in rows:
            geometry = _parse_geometry(row.geometry)
            if len(geometry) < 2:
                continue
            routes.append(
                TransportRoute(
                    id=row.id,
                    osm_id=row.osm_id,
                    way_id=row.way_id,
                    geometry=geometry,
                    tags=_pick_tags(row, ROUTE_TAG_MAPPING),
                )
            )
        return routes
