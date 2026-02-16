import random
import math

from haversine import haversine, Unit
from models import Building


DEFAULT_AMENITY_RADIUS = 2  # kilometers


# TODO: use a library for that
def get_bounding_box(
    lat: float, lon: float, radius: float
) -> tuple[float, float, float, float]:
    delta_lat = radius / 111.32
    delta_lon = radius / (111.32 * math.cos(math.radians(lat)))

    return (lat - delta_lat, lat + delta_lat, lon - delta_lon, lon + delta_lon)


def find_nearby_or_closest(
    position: tuple[float, float],
    buildings: list[Building],
    radius: float = DEFAULT_AMENITY_RADIUS,
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


def generate_adult_age() -> int:
    return random.choices(
        [random.randint(18, 64), random.randint(65, 90)],
        weights=[0.8, 0.2],
    )[0]


def determine_employment_status(age: int) -> tuple[bool, bool]:
    """Returns (employed, is_student) based on age."""
    if 18 <= age < 65:
        employed = random.random() > 0.1
        is_student = 18 <= age <= 25 and random.random() > 0.3
        return employed, is_student
    return False, False


def determine_transport_preferences(
    age: int, employed: bool, has_transport: bool, needs_to_dropoff: bool
) -> tuple[bool, bool]:
    if 16 <= age <= 25:
        uses_public_transport = has_transport and random.random() > 0.4
    elif age >= 65:
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
