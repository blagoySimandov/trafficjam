"""
Coordinate transformation utilities for MATSim agent generation.

This module provides simple Euclidean distance calculation for projected coordinates.
All coordinate transformation is handled by the frontend - the backend receives
coordinates already in the appropriate projected CRS (e.g., EPSG:2157 for Ireland).
"""
import math
from typing import Tuple


def euclidean_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculate Euclidean distance between two projected coordinates in meters.

    This assumes coordinates are already in a projected CRS (e.g., EPSG:2157)
    where units are in meters, not degrees.

    Args:
        coord1: [x, y] in projected coordinates (meters)
        coord2: [x, y] in projected coordinates (meters)

    Returns:
        Distance in meters
    """
    dx = coord2[0] - coord1[0]
    dy = coord2[1] - coord1[1]
    return math.sqrt(dx * dx + dy * dy)
