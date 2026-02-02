from models import TrafficNode, TrafficLink, Building, TransportRoute


def parse_osm_response(data: dict) -> dict:
    elements = data.get("elements", [])

    nodes_by_id: dict[int, dict] = {}
    ways: list[dict] = []
    relations: list[dict] = []

    for element in elements:
        if element["type"] == "node":
            nodes_by_id[element["id"]] = element
        elif element["type"] == "way":
            ways.append(element)
        elif element["type"] == "relation":
            relations.append(element)

    traffic_nodes: dict[int, TrafficNode] = {}
    traffic_links: list[TrafficLink] = []
    buildings: list[Building] = []
    transport_routes: list[TransportRoute] = []

    node_connection_count: dict[int, int] = {}

    highway_ways = [w for w in ways if "highway" in w.get("tags", {})]
    building_ways = [w for w in ways if "building" in w.get("tags", {})]

    for way in highway_ways:
        node_refs = way.get("nodes", [])
        if len(node_refs) >= 2:
            for node_id in [node_refs[0], node_refs[-1]]:
                node_connection_count[node_id] = node_connection_count.get(node_id, 0) + 1

    for way in highway_ways:
        tags = way.get("tags", {})
        node_refs = way.get("nodes", [])

        if len(node_refs) < 2:
            continue

        geometry = []
        valid = True
        for nid in node_refs:
            node = nodes_by_id.get(nid)
            if node and "lon" in node and "lat" in node:
                geometry.append((node["lon"], node["lat"]))
            else:
                valid = False
                break

        if not valid or len(geometry) < 2:
            continue

        from_node_id = node_refs[0]
        to_node_id = node_refs[-1]

        for nid, idx in [(from_node_id, 0), (to_node_id, -1)]:
            if nid not in traffic_nodes:
                traffic_nodes[nid] = TrafficNode(
                    id=f"n{nid}",
                    osm_id=nid,
                    position=geometry[idx],
                    connection_count=node_connection_count.get(nid, 1)
                )

        link_tags = {
            k: v for k, v in tags.items()
            if k in ("highway", "lanes", "maxspeed", "oneway", "name", "ref", "surface")
        }

        traffic_links.append(TrafficLink(
            id=f"l{way['id']}",
            osm_id=way["id"],
            from_node=f"n{from_node_id}",
            to_node=f"n{to_node_id}",
            geometry=geometry,
            tags=link_tags
        ))

    for way in building_ways:
        tags = way.get("tags", {})
        node_refs = way.get("nodes", [])

        geometry = []
        valid = True
        for nid in node_refs:
            node = nodes_by_id.get(nid)
            if node and "lon" in node and "lat" in node:
                geometry.append((node["lon"], node["lat"]))
            else:
                valid = False
                break

        if not valid or len(geometry) < 3:
            continue

        centroid_x = sum(p[0] for p in geometry) / len(geometry)
        centroid_y = sum(p[1] for p in geometry) / len(geometry)

        building_type = tags.get("building")
        if building_type == "yes":
            building_type = tags.get("amenity") or tags.get("shop") or None

        building_tags = {
            k: v for k, v in tags.items()
            if k in ("building", "name", "amenity", "shop", "addr:street", "addr:housenumber", "height", "building:levels")
        }

        buildings.append(Building(
            id=f"b{way['id']}",
            osm_id=way["id"],
            position=(centroid_x, centroid_y),
            geometry=geometry,
            type=building_type,
            tags=building_tags
        ))

    way_geometries: dict[int, list[tuple[float, float]]] = {}
    for way in ways:
        node_refs = way.get("nodes", [])
        coords = []
        for nid in node_refs:
            node = nodes_by_id.get(nid)
            if node and "lon" in node and "lat" in node:
                coords.append((node["lon"], node["lat"]))
        if coords:
            way_geometries[way["id"]] = coords

    for relation in relations:
        tags = relation.get("tags", {})
        if "route" not in tags:
            continue

        for member in relation.get("members", []):
            if member["type"] == "way" and member.get("role") in ("", "forward", "backward"):
                way_id = member["ref"]
                if way_id in way_geometries:
                    route_tags = {
                        k: v for k, v in tags.items()
                        if k in ("route", "ref", "name", "operator", "network", "from", "to")
                    }

                    transport_routes.append(TransportRoute(
                        id=f"r{relation['id']}_{way_id}",
                        osm_id=relation["id"],
                        way_id=way_id,
                        geometry=way_geometries[way_id],
                        tags=route_tags
                    ))

    return {
        "nodes": list(traffic_nodes.values()),
        "links": traffic_links,
        "buildings": buildings,
        "transport_routes": transport_routes
    }
