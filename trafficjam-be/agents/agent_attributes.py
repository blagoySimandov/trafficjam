from typing import Dict, List, Tuple
import random
import math

from haversine import haversine, Unit
from models import Building


DEFAULT_AMENITY_RADIUS = 2  # kilometers


def get_bounding_box(
    lat: float, lon: float, radius: float
) -> Tuple[float, float, float, float]:
    """Get lat/lon bounding box for a radius in kilometers around a point."""
    delta_lat = radius / 111.32
    delta_lon = radius / (111.32 * math.cos(math.radians(lat)))

    return (lat - delta_lat, lat + delta_lat, lon - delta_lon, lon + delta_lon)


def find_nearby_or_closest(
    agent_pos: Tuple[float, float],
    buildings: List[Building],
    radius: float = DEFAULT_AMENITY_RADIUS,
) -> Building | None:
    if not buildings:
        return None

    lat, lon = agent_pos
    lat_min, lat_max, lon_min, lon_max = get_bounding_box(lat, lon, radius)

    candidates = [
        b
        for b in buildings
        if lat_min <= b.position[0] <= lat_max and lon_min <= b.position[1] <= lon_max
    ]

    if candidates:
        within_radius = [
            b
            for b in candidates
            if haversine(agent_pos, b.position, unit=Unit.KILOMETERS) <= radius
        ]
        if within_radius:
            return random.choice(within_radius)

    return min(
        buildings, key=lambda b: haversine(agent_pos, b.position, unit=Unit.KILOMETERS)
    )


def generate_age_distribution() -> int:
    return random.choices(
        [random.randint(0, 17), random.randint(18, 64), random.randint(65, 90)],
        weights=[0.2, 0.65, 0.15],
    )[0]


def assign_employment_status(agent: Dict) -> None:
    age = agent["age"]

    if 18 <= age < 65:
        agent["employed"] = random.random() > 0.1
        agent["is_student"] = 18 <= age <= 25 and random.random() > 0.3
    else:
        agent["employed"] = False
        agent["is_student"] = False


def assign_transport_mode(agent: Dict, has_transport: bool) -> None:
    age = agent["age"]

    if 16 <= age <= 25:
        agent["uses_public_transport"] = has_transport and random.random() > 0.4
    elif age >= 65:
        agent["uses_public_transport"] = has_transport and random.random() > 0.6
    elif not agent.get("employed"):
        agent["uses_public_transport"] = has_transport and random.random() > 0.5
    else:
        agent["uses_public_transport"] = has_transport and random.random() > 0.7

    agent["has_car"] = not agent["uses_public_transport"] or (
        age >= 25 and random.random() > 0.3
    )


def assign_amenity_preferences(
    agent: Dict, buildings: List[Building], radius: float = DEFAULT_AMENITY_RADIUS
) -> None:
    agent_home = agent["home_location"]

    supermarkets = [b for b in buildings if b.type == "supermarket"]
    if supermarkets:
        selected = find_nearby_or_closest(agent_home, supermarkets, radius)
        if selected:
            agent["preferred_supermarket"] = selected.position

    hospitals = [b for b in buildings if b.type in ["hospital", "clinic", "doctors"]]
    if hospitals:
        selected = find_nearby_or_closest(agent_home, hospitals, radius)
        if selected:
            agent["preferred_healthcare"] = selected.position
