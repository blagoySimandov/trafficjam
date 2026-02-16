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

VALID_BUILDING_TYPES = frozenset(
    {"retail", "apartments", "supermarket", "school", "kindergarten", "parking"}
)

SHOP_TYPES = frozenset({"supermarket", "retail", "shop", "commercial"})
