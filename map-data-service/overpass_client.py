from collections import Counter

import httpx

from models import Building, NetworkResponse, TrafficLink, TrafficNode, TransportRoute

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


async def fetch_network_from_overpass(
    min_lat: float, min_lng: float, max_lat: float, max_lng: float
) -> NetworkResponse:
    bbox = f"{min_lat},{min_lng},{max_lat},{max_lng}"
    query = _build_query(bbox)
    data = await _execute_query(query)
    return _parse_response(data)


def _build_query(bbox: str) -> str:
    return (
        f"[out:json][timeout:60];"
        f"("
        f'way["highway"]({bbox});'
        f'way["building"]({bbox});'
        f'relation["route"~"bus|tram|train|subway|light_rail|ferry"]({bbox});'
        f");"
        f"out body;>;out skel qt;"
    )


async def _execute_query(query: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            OVERPASS_URL, data={"data": query}, timeout=120.0
        )
        response.raise_for_status()
        return response.json()


def _categorize_elements(elements: list[dict]) -> tuple[list, list, list]:
    nodes, ways, relations = [], [], []
    for el in elements:
        match el["type"]:
            case "node":
                nodes.append(el)
            case "way":
                ways.append(el)
            case "relation":
                relations.append(el)
    return nodes, ways, relations


def _build_node_coords(nodes: list[dict]) -> dict[int, tuple[float, float]]:
    return {n["id"]: (n["lon"], n["lat"]) for n in nodes if "lat" in n and "lon" in n}


def _split_ways(ways: list[dict]) -> tuple[list, list]:
    highway_ways = [w for w in ways if "highway" in w.get("tags", {})]
    building_ways = [w for w in ways if "building" in w.get("tags", {})]
    return highway_ways, building_ways


def _count_node_connections(highway_ways: list[dict]) -> Counter:
    counter = Counter()
    for way in highway_ways:
        for nid in way.get("nodes", []):
            counter[nid] += 1
    return counter


def _build_traffic_nodes(
    highway_ways: list[dict], node_coords: dict[int, tuple[float, float]]
) -> list[TrafficNode]:
    connections = _count_node_connections(highway_ways)
    endpoint_ids = _collect_endpoint_ids(highway_ways)
    relevant_ids = endpoint_ids | {nid for nid, c in connections.items() if c > 1}
    return [
        TrafficNode(
            id=f"node-{nid}",
            osm_id=nid,
            position=node_coords[nid],
            connection_count=connections[nid],
        )
        for nid in relevant_ids
        if nid in node_coords
    ]


def _collect_endpoint_ids(highway_ways: list[dict]) -> set[int]:
    ids = set()
    for way in highway_ways:
        nodes = way.get("nodes", [])
        if len(nodes) >= 2:
            ids.add(nodes[0])
            ids.add(nodes[-1])
    return ids


def _build_traffic_links(
    highway_ways: list[dict], node_coords: dict[int, tuple[float, float]]
) -> list[TrafficLink]:
    links = []
    for way in highway_ways:
        link = _way_to_link(way, node_coords)
        if link:
            links.append(link)
    return links


def _way_to_link(
    way: dict, node_coords: dict[int, tuple[float, float]]
) -> TrafficLink | None:
    nodes = way.get("nodes", [])
    if len(nodes) < 2:
        return None
    geometry = [node_coords[n] for n in nodes if n in node_coords]
    if len(geometry) < 2:
        return None
    return TrafficLink(
        id=f"link-{way['id']}",
        osm_id=way["id"],
        from_node=f"node-{nodes[0]}",
        to_node=f"node-{nodes[-1]}",
        geometry=geometry,
        tags=way.get("tags", {}),
    )


def _build_buildings(
    building_ways: list[dict], node_coords: dict[int, tuple[float, float]]
) -> list[Building]:
    buildings = []
    for way in building_ways:
        building = _way_to_building(way, node_coords)
        if building:
            buildings.append(building)
    return buildings


def _way_to_building(
    way: dict, node_coords: dict[int, tuple[float, float]]
) -> Building | None:
    geometry = [node_coords[n] for n in way.get("nodes", []) if n in node_coords]
    if not geometry:
        return None
    return Building(
        id=f"building-{way['id']}",
        osm_id=way["id"],
        position=_centroid(geometry),
        geometry=geometry,
        type=way.get("tags", {}).get("building"),
        tags=way.get("tags", {}),
    )


def _centroid(points: list[tuple[float, float]]) -> tuple[float, float]:
    avg_lng = sum(p[0] for p in points) / len(points)
    avg_lat = sum(p[1] for p in points) / len(points)
    return (avg_lng, avg_lat)


def _build_transport_routes(
    relations: list[dict],
    ways: list[dict],
    node_coords: dict[int, tuple[float, float]],
) -> list[TransportRoute]:
    way_map = {w["id"]: w for w in ways}
    routes = []
    for rel in relations:
        routes.extend(_relation_to_routes(rel, way_map, node_coords))
    return routes


def _relation_to_routes(
    rel: dict,
    way_map: dict[int, dict],
    node_coords: dict[int, tuple[float, float]],
) -> list[TransportRoute]:
    tags = rel.get("tags", {})
    if "route" not in tags:
        return []
    routes = []
    for member in rel.get("members", []):
        if member["type"] != "way" or member["ref"] not in way_map:
            continue
        way = way_map[member["ref"]]
        geometry = [node_coords[n] for n in way.get("nodes", []) if n in node_coords]
        if not geometry:
            continue
        routes.append(TransportRoute(
            id=f"route-{rel['id']}-{way['id']}",
            osm_id=rel["id"],
            way_id=way["id"],
            geometry=geometry,
            tags=tags,
        ))
    return routes


def _parse_response(data: dict) -> NetworkResponse:
    elements = data.get("elements", [])
    nodes_raw, ways_raw, relations_raw = _categorize_elements(elements)
    node_coords = _build_node_coords(nodes_raw)
    highway_ways, building_ways = _split_ways(ways_raw)
    return NetworkResponse(
        nodes=_build_traffic_nodes(highway_ways, node_coords),
        links=_build_traffic_links(highway_ways, node_coords),
        buildings=_build_buildings(building_ways, node_coords),
        transport_routes=_build_transport_routes(relations_raw, ways_raw, node_coords),
    )
