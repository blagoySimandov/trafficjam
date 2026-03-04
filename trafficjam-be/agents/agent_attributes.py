import random

from geopy.distance import geodesic
from haversine import haversine, Unit
from .models import Building
from .config import AgentConfig

DEFAULT_AMENITY_RADIUS_KM = 2


def get_bounding_box(
    lat: float, lon: float, radius: float
) -> tuple[float, float, float, float]:
    origin = (lat, lon)
    north = geodesic(kilometers=radius).destination(origin, 0)
    south = geodesic(kilometers=radius).destination(origin, 180)
    east = geodesic(kilometers=radius).destination(origin, 90)
    west = geodesic(kilometers=radius).destination(origin, 270)
    return (south.latitude, north.latitude, west.longitude, east.longitude)


def find_nearby_or_closest(
    position: tuple[float, float],
    buildings: list[Building],
    radius: float = DEFAULT_AMENITY_RADIUS_KM,
) -> Building | None:
    if not buildings:
        return None

    lat, lon = position
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
            if haversine(position, b.position, unit=Unit.KILOMETERS) <= radius
        ]
        if within_radius:
            return random.choice(within_radius)

    return min(
        buildings, key=lambda b: haversine(position, b.position, unit=Unit.KILOMETERS)
    )


def generate_child_age() -> int:
    return random.randint(0, 17)


def generate_adult_age(config: AgentConfig) -> int:
    return random.choices(
        [
            random.randint(18, config.elderly_age_threshold - 1),
            random.randint(config.elderly_age_threshold, 90),
        ],
        weights=[0.8, 0.2],
    )[0]


def determine_employment_status(age: int, config: AgentConfig) -> tuple[bool, bool]:
    if 18 <= age < config.elderly_age_threshold:
        employed = random.random() > 0.1
        is_student = 18 <= age <= 25 and random.random() > 0.3
        return employed, is_student
    return False, False


def determine_transport_preferences(
    age: int,
    employed: bool,
    has_transport: bool,
    needs_to_dropoff: bool,
    config: AgentConfig,
) -> tuple[bool, bool]:
    if 16 <= age <= 25:
        uses_public_transport = has_transport and random.random() > 0.4
    elif age >= config.elderly_age_threshold:
        uses_public_transport = has_transport and random.random() > 0.6
    elif not employed:
        uses_public_transport = has_transport and random.random() > 0.5
    else:
        uses_public_transport = has_transport and random.random() > 0.7

    if needs_to_dropoff:
        has_car = random.random() > 0.15
    else:
        has_car = not uses_public_transport or (age >= 25 and random.random() > 0.3)

    return uses_public_transport, has_car
