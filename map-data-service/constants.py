LINK_TAG_KEYS = frozenset(
    {"highway", "lanes", "maxspeed", "oneway", "name", "ref", "surface"}
)

BUILDING_TAG_KEYS = frozenset(
    {
        "building",
        "name",
        "amenity",
        "shop",
        "addr:street",
        "addr:housenumber",
        "height",
        "building:levels",
    }
)

ROUTE_TAG_KEYS = frozenset(
    {"route", "ref", "name", "operator", "network", "from", "to", "colour"}
)

VALID_MEMBER_ROLES = frozenset({"", "forward", "backward"})

VALID_BUILDING_TYPES = frozenset(
    {"retail", "apartments", "supermarket", "school", "kindergarten", "parking"}
)

LINK_TAG_MAPPING = {
    "highway": "highway",
    "lanes": "lanes",
    "maxspeed": "maxspeed",
    "oneway": "oneway",
    "name": "name",
    "ref": "ref",
    "surface": "surface",
}

BUILDING_TAG_MAPPING = {
    "building": "building",
    "name": "name",
    "shop": "shop",
    "addr_street": "addr:street",
    "building_levels": "building:levels",
}

ROUTE_TAG_MAPPING = {
    "route": "route",
    "ref": "ref",
    "name": "name",
    "operator": "operator",
    "network": "network",
    "from_": "from",
    "to": "to",
    "colour": "colour",
}
