from haversine import haversine, Unit


def calculate_area_wgs84(bounds: dict[str, float]) -> float:
    north, south = bounds["north"], bounds["south"]
    east, west = bounds["east"], bounds["west"]

    height_km = haversine((south, west), (north, west), unit=Unit.KILOMETERS)
    width_km = haversine((south, west), (south, east), unit=Unit.KILOMETERS)
    return height_km * width_km


def calculate_area_projected(bounds: dict[str, float]) -> float:
    width_m = bounds["east"] - bounds["west"]
    height_m = bounds["north"] - bounds["south"]
    area_m2 = width_m * height_m
    return area_m2 / 1_000_000
