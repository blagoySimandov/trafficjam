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
] as const;

export const TRANSPORT_TYPES = ["bus", "tram", "subway", "train", "light_rail"] as const;

export interface BuildingQuery {
  tag: string;
  value: string;
}

export const BUILDING_QUERIES: BuildingQuery[] = [
  { tag: "building", value: "retail" },
  { tag: "building", value: "apartments" },
  { tag: "shop", value: "supermarket" },
  { tag: "amenity", value: "school" },
  { tag: "amenity", value: "kindergarten" },
  { tag: "amenity", value: "parking" },
];

export interface BuildingTagMapping {
  tag: string;
  value: string;
  type: string;
}

export const BUILDING_TAG_MAPPINGS: BuildingTagMapping[] = [
  { tag: "building", value: "retail", type: "retail" },
  { tag: "building", value: "apartments", type: "apartments" },
  { tag: "shop", value: "supermarket", type: "supermarket" },
  { tag: "amenity", value: "school", type: "school" },
  { tag: "amenity", value: "kindergarten", type: "kindergarten" },
  { tag: "amenity", value: "parking", type: "parking" },
];

export const OSM_ELEMENT_TYPES = ["way", "node"] as const;

export const OVERPASS_TIMEOUT = 30;
export const OVERPASS_OUTPUT_FORMAT = "json";
