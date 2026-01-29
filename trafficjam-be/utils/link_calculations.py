"""Link length calculation utilities for MATSim network generation."""
from typing import List, Tuple
import math

from utils.coordinates import euclidean_distance


def calculate_link_length(geometry: List[List[float]], crs: str = "EPSG:4326") -> float:
    """
    Calculate length of a link in meters.
    Uses Euclidean distance for projected CRS, Haversine for WGS84.

    Args:
        geometry: List of [x, y] coordinates (projected) or [lat, lon] (WGS84)
        crs: Coordinate reference system

    Returns:
        Length in meters
    """
    if crs != "EPSG:4326":
        # Use Euclidean distance for projected coordinates (already in meters)
        total_length = 0.0
        for i in range(len(geometry) - 1):
            x1, y1 = geometry[i][0], geometry[i][1]
            x2, y2 = geometry[i + 1][0], geometry[i + 1][1]
            coord1: Tuple[float, float] = (x1, y1)
            coord2: Tuple[float, float] = (x2, y2)
            total_length += euclidean_distance(coord1, coord2)
        return total_length
    else:
        # Fallback: Use Haversine for WGS84
        def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
            R = 6371000
            phi1, phi2 = math.radians(lat1), math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lon2 - lon1)
            a = (
                math.sin(dphi / 2) ** 2
                + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
            )
            return 2 * R * math.asin(math.sqrt(a))

        total_length = 0
        for i in range(len(geometry) - 1):
            lat1, lon1 = geometry[i]
            lat2, lon2 = geometry[i + 1]
            total_length += haversine(lat1, lon1, lat2, lon2)
        return total_length
