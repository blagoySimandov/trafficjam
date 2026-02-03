from __future__ import annotations
from osm_models import OSMApiResponse, OSMNode, OSMWay, OSMRelation
from constants import (
    LINK_TAG_KEYS,
    BUILDING_TAG_KEYS,
    ROUTE_TAG_KEYS,
    VALID_MEMBER_ROLES,
    VALID_BUILDING_TYPES,
)

from models import (
    Building,
    NetworkResponse,
    TrafficLink,
    TrafficNode,
    TransportRoute,
)


def _bucket_elements(
    response: OSMApiResponse,
) -> tuple[dict[int, OSMNode], list[OSMWay], list[OSMRelation]]:
    nodes_by_id: dict[int, OSMNode] = {}
    ways: list[OSMWay] = []
    relations: list[OSMRelation] = []
    for element in response.elements:
        if isinstance(element, OSMNode):
            nodes_by_id[element.id] = element
        elif isinstance(element, OSMWay):
            ways.append(element)
        elif isinstance(element, OSMRelation):
            relations.append(element)
    return nodes_by_id, ways, relations


def _count_endpoint_connections(highway_ways: list[OSMWay]) -> dict[int, int]:
    counts: dict[int, int] = {}
    for way in highway_ways:
        if len(way.nodes) < 2:
            continue
        for node_id in (way.nodes[0], way.nodes[-1]):
            counts[node_id] = counts.get(node_id, 0) + 1
    return counts


def _resolve_geometry(
    node_ids: list[int], nodes_by_id: dict[int, OSMNode]
) -> list[tuple[float, float]] | None:
    coords: list[tuple[float, float]] = []
    for nid in node_ids:
        node = nodes_by_id.get(nid)
        if node is None:
            return None
        coords.append((node.lon, node.lat))
    return coords


def _register_endpoint_nodes(
    way: OSMWay,
    geometry: list[tuple[float, float]],
    traffic_nodes: dict[int, TrafficNode],
    connection_counts: dict[int, int],
) -> None:
    for nid, coord in ((way.nodes[0], geometry[0]), (way.nodes[-1], geometry[-1])):
        if nid not in traffic_nodes:
            traffic_nodes[nid] = TrafficNode(
                id=f"n{nid}",
                osm_id=nid,
                position=coord,
                connection_count=connection_counts.get(nid, 1),
            )


def _make_traffic_link(way: OSMWay, geometry: list[tuple[float, float]]) -> TrafficLink:
    return TrafficLink(
        id=f"l{way.id}",
        osm_id=way.id,
        from_node=f"n{way.nodes[0]}",
        to_node=f"n{way.nodes[-1]}",
        geometry=geometry,
        tags={k: v for k, v in way.tags.items() if k in LINK_TAG_KEYS},
    )


def _build_traffic_graph(
    highway_ways: list[OSMWay],
    nodes_by_id: dict[int, OSMNode],
    connection_counts: dict[int, int],
) -> tuple[list[TrafficNode], list[TrafficLink]]:
    traffic_nodes: dict[int, TrafficNode] = {}
    traffic_links: list[TrafficLink] = []
    for way in highway_ways:
        if len(way.nodes) < 2:
            continue
        geometry = _resolve_geometry(way.nodes, nodes_by_id)
        if geometry is None or len(geometry) < 2:
            continue
        _register_endpoint_nodes(way, geometry, traffic_nodes, connection_counts)
        traffic_links.append(_make_traffic_link(way, geometry))
    return list(traffic_nodes.values()), traffic_links


def _centroid(geometry: list[tuple[float, float]]) -> tuple[float, float]:
    return (
        sum(p[0] for p in geometry) / len(geometry),
        sum(p[1] for p in geometry) / len(geometry),
    )


def _resolve_building_type(tags: dict[str, str]) -> str | None:
    building_type = tags.get("building")
    if building_type == "yes":
        return tags.get("amenity") or tags.get("shop") or None
    return building_type


def _make_building(
    way: OSMWay, geometry: list[tuple[float, float]]
) -> Building | None:
    b_type = _resolve_building_type(way.tags)
    if b_type not in VALID_BUILDING_TYPES:
        return None

    return Building(
        id=f"b{way.id}",
        osm_id=way.id,
        position=_centroid(geometry),
        geometry=geometry,
        type=b_type,
        tags={k: v for k, v in way.tags.items() if k in BUILDING_TAG_KEYS},
    )


def _build_buildings(
    building_ways: list[OSMWay], nodes_by_id: dict[int, OSMNode]
) -> list[Building]:
    buildings: list[Building] = []
    for way in building_ways:
        if len(way.nodes) < 3:
            continue
        geometry = _resolve_geometry(way.nodes, nodes_by_id)
        if geometry is None or len(geometry) < 3:
            continue
        building = _make_building(way, geometry)
        if building:
            buildings.append(building)
    return buildings


def _build_way_geometries(
    ways: list[OSMWay], nodes_by_id: dict[int, OSMNode]
) -> dict[int, list[tuple[float, float]]]:
    geometries: dict[int, list[tuple[float, float]]] = {}
    for way in ways:
        geom = _resolve_geometry(way.nodes, nodes_by_id)
        if geom:
            geometries[way.id] = geom
    return geometries


def _extract_route_members(
    relation: OSMRelation,
    way_geometries: dict[int, list[tuple[float, float]]],
) -> list[TransportRoute]:
    route_tags = {k: v for k, v in relation.tags.items() if k in ROUTE_TAG_KEYS}
    routes: list[TransportRoute] = []
    for member in relation.members:
        if member.type != "way" or member.role not in VALID_MEMBER_ROLES:
            continue
        geom = way_geometries.get(member.ref)
        if geom is not None:
            routes.append(
                TransportRoute(
                    id=f"r{relation.id}_{member.ref}",
                    osm_id=relation.id,
                    way_id=member.ref,
                    geometry=geom,
                    tags=route_tags,
                )
            )
    return routes


def _build_transport_routes(
    relations: list[OSMRelation],
    way_geometries: dict[int, list[tuple[float, float]]],
) -> list[TransportRoute]:
    routes: list[TransportRoute] = []
    for relation in relations:
        if "route" not in relation.tags:
            continue
        routes.extend(_extract_route_members(relation, way_geometries))
    return routes


def parse_osm_response(data: dict) -> NetworkResponse:
    nodes_by_id, ways, relations = _bucket_elements(OSMApiResponse.model_validate(data))

    highway_ways = [w for w in ways if "highway" in w.tags]

    building_ways = [w for w in ways if "building" in w.tags]

    connection_counts = _count_endpoint_connections(highway_ways)

    nodes, links = _build_traffic_graph(highway_ways, nodes_by_id, connection_counts)

    buildings = _build_buildings(building_ways, nodes_by_id)

    way_geometries = _build_way_geometries(ways, nodes_by_id)

    transport_routes = _build_transport_routes(relations, way_geometries)

    return NetworkResponse(
        nodes=nodes,
        links=links,
        buildings=buildings,
        transport_routes=transport_routes,
    )
