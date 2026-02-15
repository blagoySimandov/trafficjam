from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.functions import ST_Intersects, ST_MakeEnvelope

from db_models import NodeDB, LinkDB, BuildingDB, TransportRouteDB
from models import (
    TrafficNode,
    TrafficLink,
    Building,
    TransportRoute,
    NetworkResponse,
)
from constants import VALID_BUILDING_TYPES


def _parse_geometry(raw) -> list[tuple[float, float]]:
    # Handle double-encoded JSON strings from CSV import
    if isinstance(raw, str):
        raw = json.loads(raw)
    # If still a string after one parse (double-encoded), parse again
    if isinstance(raw, str):
        raw = json.loads(raw)
    return [(coord[0], coord[1]) for coord in raw]


def _build_link_tags(row: LinkDB) -> dict[str, str]:
    tags: dict[str, str] = {}
    if row.highway:
        tags["highway"] = row.highway
    if row.lanes:
        tags["lanes"] = row.lanes
    if row.maxspeed:
        tags["maxspeed"] = row.maxspeed
    if row.oneway:
        tags["oneway"] = row.oneway
    if row.name:
        tags["name"] = row.name
    if row.ref:
        tags["ref"] = row.ref
    if row.surface:
        tags["surface"] = row.surface
    return tags


def _build_building_tags(row: BuildingDB) -> dict[str, str]:
    tags: dict[str, str] = {}
    if row.building:
        tags["building"] = row.building
    if row.name:
        tags["name"] = row.name
    if row.shop:
        tags["shop"] = row.shop
    if row.addr_street:
        tags["addr:street"] = row.addr_street
    if row.building_levels:
        tags["building:levels"] = row.building_levels
    return tags


def _build_route_tags(row: TransportRouteDB) -> dict[str, str]:
    tags: dict[str, str] = {}
    if row.route:
        tags["route"] = row.route
    if row.ref:
        tags["ref"] = row.ref
    if row.name:
        tags["name"] = row.name
    if row.operator:
        tags["operator"] = row.operator
    if row.network:
        tags["network"] = row.network
    if row.from_:
        tags["from"] = row.from_
    if row.to:
        tags["to"] = row.to
    if row.colour:
        tags["colour"] = row.colour
    return tags


class MapDataRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def fetch_network(
        self,
        min_lat: float,
        min_lng: float,
        max_lat: float,
        max_lng: float,
    ) -> NetworkResponse:
        bbox = ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)

        nodes = await self._fetch_nodes(bbox)
        links = await self._fetch_links(bbox)
        buildings = await self._fetch_buildings(bbox)
        transport_routes = await self._fetch_transport_routes(bbox)

        return NetworkResponse(
            nodes=nodes,
            links=links,
            buildings=buildings,
            transport_routes=transport_routes,
        )

    async def _fetch_nodes(self, bbox) -> list[TrafficNode]:
        stmt = select(NodeDB).where(ST_Intersects(NodeDB.geom, bbox))
        result = await self.session.execute(stmt)
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
        stmt = select(LinkDB).where(ST_Intersects(LinkDB.geom, bbox))
        result = await self.session.execute(stmt)
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
                    tags=_build_link_tags(row),
                )
            )
        return links

    async def _fetch_buildings(self, bbox) -> list[Building]:
        stmt = select(BuildingDB).where(ST_Intersects(BuildingDB.geom, bbox))
        result = await self.session.execute(stmt)
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
                    tags=_build_building_tags(row),
                )
            )
        return buildings

    async def _fetch_transport_routes(self, bbox) -> list[TransportRoute]:
        stmt = select(TransportRouteDB).where(
            ST_Intersects(TransportRouteDB.geom, bbox)
        )
        result = await self.session.execute(stmt)
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
                    tags=_build_route_tags(row),
                )
            )
        return routes
