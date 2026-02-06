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
    {"route", "ref", "name", "operator", "network", "from", "to"}
)

VALID_MEMBER_ROLES = frozenset({"", "forward", "backward"})

VALID_BUILDING_TYPES = frozenset(
    {"retail", "apartments", "supermarket", "school", "kindergarten", "parking"}
)
