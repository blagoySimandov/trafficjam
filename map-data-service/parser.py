from models import TrafficNode, TrafficLink, Building, TransportRoute, NetworkResponse
from projection import transform_points
from pydantic import BaseModel


class _RawNode(BaseModel):
    id: int
    lon: float
    lat: float


class _RawWay(BaseModel):
    id: int
    nodes: list[int]
    tags: dict[str, str] = {}


class _RawRelation(BaseModel):
    id: int
    tags: dict[str, str] = {}
    members: list[dict] = []


def parse_osm_response(data: dict, target_crs: str) -> NetworkResponse:
    nodes_by_id, ways, relations = bucket_elements(data)

    highway_ways = [w for w in ways if "highway" in w.tags]
    building_ways = [w for w in ways if "building" in w.tags]

    node_connection_count = count_node_connections(highway_ways)
    traffic_nodes, traffic_links = parse_highway_ways(
        highway_ways, nodes_by_id, node_connection_count, target_crs
    )
    buildings = parse_buildings(building_ways, nodes_by_id, target_crs)

    way_geometries = build_way_geometries(ways, nodes_by_id)
    transport_routes = parse_transport_routes(relations, way_geometries, target_crs)

    return NetworkResponse(
        crs=target_crs,
        nodes=list(traffic_nodes.values()),
        links=traffic_links,
        buildings=buildings,
        transport_routes=transport_routes,
    )


# -------------------------------------------------------------------


def bucket_elements(
    data: dict,
) -> tuple[dict[int, _RawNode], list[_RawWay], list[_RawRelation]]:
    nodes_by_id: dict[int, _RawNode] = {}
    ways: list[_RawWay] = []
    relations: list[_RawRelation] = []

    for element in data.get("elements", []):
        if element["type"] == "node" and "lon" in element and "lat" in element:
            nodes_by_id[element["id"]] = _RawNode(
                id=element["id"], lon=element["lon"], lat=element["lat"]
            )
        elif element["type"] == "way":
            ways.append(
                _RawWay(
                    id=element["id"],
                    nodes=element.get("nodes", []),
                    tags=element.get("tags", {}),
                )
            )
        elif element["type"] == "relation":
            relations.append(
                _RawRelation(
                    id=element["id"],
                    tags=element.get("tags", {}),
                    members=element.get("members", []),
                )
            )

    return nodes_by_id, ways, relations


def count_node_connections(highway_ways: list[_RawWay]) -> dict[int, int]:
    counts: dict[int, int] = {}
    for way in highway_ways:
        if len(way.nodes) >= 2:
            for node_id in [way.nodes[0], way.nodes[-1]]:
                counts[node_id] = counts.get(node_id, 0) + 1
    return counts


def resolve_geometry(
    node_refs: list[int],
    nodes_by_id: dict[int, _RawNode],
    min_points: int,
    target_crs: str,
) -> list[tuple[float, float]] | None:
    coords: list[tuple[float, float]] = []
    for nid in node_refs:
        node = nodes_by_id.get(nid)
        if not node:
            return None
        coords.append((node.lon, node.lat))

    if len(coords) < min_points:
        return None

    return transform_points(coords, target_crs)


def parse_highway_ways(
    highway_ways: list[_RawWay],
    nodes_by_id: dict[int, _RawNode],
    node_connection_count: dict[int, int],
    target_crs: str,
) -> tuple[dict[int, TrafficNode], list[TrafficLink]]:
    traffic_nodes: dict[int, TrafficNode] = {}
    traffic_links: list[TrafficLink] = []

    for way in highway_ways:
        projected_geometry = resolve_geometry(way.nodes, nodes_by_id, 2, target_crs)
        if not projected_geometry:
            continue

        from_node_id = way.nodes[0]
        to_node_id = way.nodes[-1]

        for nid, idx in [(from_node_id, 0), (to_node_id, -1)]:
            if nid not in traffic_nodes:
                traffic_nodes[nid] = TrafficNode(
                    id=nid,
                    position=projected_geometry[idx],
                    connection_count=node_connection_count.get(nid, 1),
                )

        link_tags = {
            k: v
            for k, v in way.tags.items()
            if k in ("highway", "lanes", "maxspeed", "oneway", "name", "ref", "surface")
        }

        traffic_links.append(
            TrafficLink(
                id=way.id,
                from_node=from_node_id,
                to_node=to_node_id,
                geometry=projected_geometry,
                tags=link_tags,
            )
        )

    return traffic_nodes, traffic_links


def parse_buildings(
    building_ways: list[_RawWay], nodes_by_id: dict[int, _RawNode], target_crs: str
) -> list[Building]:
    buildings: list[Building] = []

    for way in building_ways:
        projected_geometry = resolve_geometry(way.nodes, nodes_by_id, 3, target_crs)
        if not projected_geometry:
            continue

        centroid_x = sum(p[0] for p in projected_geometry) / len(projected_geometry)
        centroid_y = sum(p[1] for p in projected_geometry) / len(projected_geometry)

        building_type = way.tags.get("building")
        if building_type == "yes":
            building_type = way.tags.get("amenity") or way.tags.get("shop") or None

        building_tags = {
            k: v
            for k, v in way.tags.items()
            if k
            in (
                "building",
                "name",
                "amenity",
                "shop",
                "addr:street",
                "addr:housenumber",
                "height",
                "building:levels",
            )
        }

        buildings.append(
            Building(
                id=way.id,
                position=(centroid_x, centroid_y),
                geometry=projected_geometry,
                type=building_type,
                tags=building_tags,
            )
        )

    return buildings


def build_way_geometries(
    ways: list[_RawWay], nodes_by_id: dict[int, _RawNode]
) -> dict[int, list[tuple[float, float]]]:
    way_geometries: dict[int, list[tuple[float, float]]] = {}

    for way in ways:
        coords: list[tuple[float, float]] = []
        for nid in way.nodes:
            node = nodes_by_id.get(nid)
            if node:
                coords.append((node.lon, node.lat))
        if coords:
            way_geometries[way.id] = coords

    return way_geometries


def parse_transport_routes(
    relations: list[_RawRelation],
    way_geometries: dict[int, list[tuple[float, float]]],
    target_crs: str,
) -> list[TransportRoute]:
    transport_routes: list[TransportRoute] = []

    for relation in relations:
        if "route" not in relation.tags:
            continue

        for member in relation.members:
            if member["type"] == "way" and member.get("role") in (
                "",
                "forward",
                "backward",
            ):
                way_id: int = member["ref"]
                if way_id not in way_geometries:
                    continue

                projected_geometry = transform_points(
                    way_geometries[way_id], target_crs
                )

                route_tags = {
                    k: v
                    for k, v in relation.tags.items()
                    if k
                    in ("route", "ref", "name", "operator", "network", "from", "to")
                }

                transport_routes.append(
                    TransportRoute(
                        id=relation.id,
                        way_id=way_id,
                        geometry=projected_geometry,
                        tags=route_tags,
                    )
                )

    return transport_routes
