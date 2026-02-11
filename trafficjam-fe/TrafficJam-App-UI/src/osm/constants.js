// ID Prefixes for network elements
export const ID_PREFIXES = {
  NODE: "node_",
  LINK: "link_",
  TRANSPORT: "transport_",
  BUILDING: "building_",
  TRANSPORT_WAY: "_way_",
};

// OSM Tag Values
export const OSM_TAG_VALUES = {
  ONEWAY_YES: "yes",
  TYPE_ROUTE: "route",
  TYPE_WAY: "way",
  TYPE_NODE: "node",
  TYPE_RELATION: "relation",
};

// Geometry Validation
export const GEOMETRY_VALIDATION = {
  MIN_LINK_POINTS: 2,
  MIN_ROUTE_POINTS: 2,
  MIN_BUILDING_POLYGON_POINTS: 3,
};

// Highway types to fetch
export const HIGHWAY_TYPES = [
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "service",
  "unclassified",
];

// Transport types to fetch
export const TRANSPORT_TYPES = ["bus", "tram", "subway", "train", "light_rail"];

// Building queries
export const BUILDING_QUERIES = [
  { tag: "building", value: "retail" },
  { tag: "building", value: "apartments" },
  { tag: "shop", value: "supermarket" },
  { tag: "amenity", value: "school" },
  { tag: "amenity", value: "kindergarten" },
  { tag: "amenity", value: "parking" },
];

// Building tag mappings
export const BUILDING_TAG_MAPPINGS = [
  { tag: "building", value: "retail", type: "retail" },
  { tag: "building", value: "apartments", type: "apartments" },
  { tag: "shop", value: "supermarket", type: "supermarket" },
  { tag: "amenity", value: "school", type: "school" },
  { tag: "amenity", value: "kindergarten", type: "kindergarten" },
  { tag: "amenity", value: "parking", type: "parking" },
];

// OSM element types
export const OSM_ELEMENT_TYPES = ["way", "node"];

// Overpass API settings
export const OVERPASS_TIMEOUT = 10; // Reduced to 10s for minimal server load
export const OVERPASS_OUTPUT_FORMAT = "json";
