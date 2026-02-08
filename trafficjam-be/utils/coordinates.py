import math
from typing import Tuple


def euclidean_distance(
    coord1: Tuple[float, float], coord2: Tuple[float, float]
) -> float:
    """
    Args:
        coord1: [x, y] in projected coordinates (meters)
        coord2: [x, y] in projected coordinates (meters)
    Returns:
        Distance in meters
    """
    dx = coord2[0] - coord1[0]
    dy = coord2[1] - coord1[1]
    return math.sqrt(dx * dx + dy * dy)
