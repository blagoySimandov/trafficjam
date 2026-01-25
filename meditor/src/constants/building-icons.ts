import type { BuildingType } from "../types";

export const BUILDING_LAYER_ID = "buildings";
export const BUILDING_SOURCE_ID = "buildings";

export const BUILDING_COLORS: Record<BuildingType, string> = {
  retail: "#E74C3C",
  apartments: "#3498DB",
  supermarket: "#2ECC71",
  school: "#F39C12",
  kindergarten: "#9B59B6",
  parking: "#95A5A6",
};

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  retail: "Retail",
  apartments: "Apartments",
  supermarket: "Supermarket",
  school: "School",
  kindergarten: "Kindergarten",
  parking: "Parking",
};

export const DEFAULT_BUILDING_COLOR = "#34495E";

export const BUILDING_CIRCLE_RADIUS = 10;
export const BUILDING_CIRCLE_STROKE_WIDTH = 2;
export const BUILDING_CIRCLE_STROKE_COLOR = "#FFFFFF";
export const BUILDING_CIRCLE_OPACITY = 0.9;
