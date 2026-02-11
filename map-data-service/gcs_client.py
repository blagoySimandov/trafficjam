import json
import httpx
from typing import Optional
from models import NetworkResponse
from config import get_settings

# Cache for the network data
_network_cache: Optional[NetworkResponse] = None


async def fetch_network_from_gcs() -> NetworkResponse:
    """
    Fetch the pre-processed network data from Google Cloud Storage.
    Uses caching to avoid repeated downloads.
    """
    global _network_cache

    # Return cached version if available
    if _network_cache is not None:
        return _network_cache

    settings = get_settings()

    url = f"https://storage.googleapis.com/{settings.gcs_bucket_name}/{settings.gcs_network_file}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=60.0)
        response.raise_for_status()
        data = response.json()

    # Parse into NetworkResponse model
    _network_cache = NetworkResponse.model_validate(data)

    return _network_cache


def _point_in_bounds(
    point: tuple[float, float],
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
) -> bool:
    """Check if a point (lng, lat) is within the bounds"""
    lng, lat = point
    return min_lng <= lng <= max_lng and min_lat <= lat <= max_lat


def _geometry_intersects_bounds(
    geometry: list[tuple[float, float]],
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
) -> bool:
    """Check if any point in the geometry is within bounds"""
    return any(_point_in_bounds(point, min_lat, min_lng, max_lat, max_lng) for point in geometry)


def filter_network_by_bounds(
    network: NetworkResponse,
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
) -> NetworkResponse:
    """
    Filter the network data to only include elements within the specified bounds.
    This replicates the behavior of querying Overpass API with a bounding box.
    """
    # Filter nodes - only keep nodes within bounds
    filtered_nodes = [
        node
        for node in network.nodes
        if _point_in_bounds(node.position, min_lat, min_lng, max_lat, max_lng)
    ]

    # Create set of valid node IDs for quick lookup
    valid_node_ids = {node.id for node in filtered_nodes}

    # Filter links - keep if geometry intersects bounds AND both endpoints are valid
    filtered_links = [
        link
        for link in network.links
        if (
            link.from_node in valid_node_ids
            and link.to_node in valid_node_ids
            and _geometry_intersects_bounds(link.geometry, min_lat, min_lng, max_lat, max_lng)
        )
    ]

    # Filter buildings - keep if position is within bounds
    filtered_buildings = [
        building
        for building in network.buildings
        if _point_in_bounds(building.position, min_lat, min_lng, max_lat, max_lng)
    ]

    # Filter transport routes - keep if geometry intersects bounds
    filtered_routes = [
        route
        for route in network.transport_routes
        if _geometry_intersects_bounds(route.geometry, min_lat, min_lng, max_lat, max_lng)
    ]

    return NetworkResponse(
        nodes=filtered_nodes,
        links=filtered_links,
        buildings=filtered_buildings,
        transport_routes=filtered_routes,
    )


def clear_cache():
    """Clear the cached network data (useful for testing or updates)"""
    global _network_cache
    _network_cache = None
