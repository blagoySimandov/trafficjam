"""Geographic calculation utilities."""

import math
from typing import Dict


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two WGS84 coordinates."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * R * math.asin(math.sqrt(a))


def calculate_area_wgs84(bounds: Dict[str, float]) -> float:
    north, south = bounds["north"], bounds["south"]
    east, west = bounds["east"], bounds["west"]

    height_km = haversine_distance(south, west, north, west)
    width_km = haversine_distance(south, west, south, east)
    return height_km * width_km


def calculate_area_projected(bounds: Dict[str, float]) -> float:
    width_m = bounds["east"] - bounds["west"]
    height_m = bounds["north"] - bounds["south"]
    area_m2 = width_m * height_m
    return area_m2 / 1_000_000
