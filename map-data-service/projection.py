from pyproj import Transformer

WGS84 = "EPSG:4326"
UTM_29N = "EPSG:32629"

_transformers: dict[str, Transformer] = {}


def get_transformer(target_crs: str = UTM_29N) -> Transformer:
    if target_crs not in _transformers:
        _transformers[target_crs] = Transformer.from_crs(
            WGS84, target_crs, always_xy=True
        )
    return _transformers[target_crs]


def transform_point(
    lng: float, lat: float, target_crs: str = UTM_29N
) -> tuple[float, float]:
    transformer = get_transformer(target_crs)
    x, y = transformer.transform(lng, lat)
    return (x, y)


def transform_points(
    coords: list[tuple[float, float]], target_crs: str = UTM_29N
) -> list[tuple[float, float]]:
    transformer = get_transformer(target_crs)
    return [transformer.transform(lng, lat) for lng, lat in coords]
