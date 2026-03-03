import type { LayerProps } from "react-map-gl";
import type { ExpressionSpecification } from "mapbox-gl";
import type { BuildingType } from "../types";

export const BUILDING_LAYER_ID = "buildings";
export const BUILDING_OUTLINE_LAYER_ID = "buildings-outline";
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

const DEFAULT_BUILDING_COLOR = "#34495E";

function createColorExpression(): ExpressionSpecification {
  const expression: (string | ExpressionSpecification)[] = [
    "match",
    ["get", "type"],
  ];
  for (const [type, color] of Object.entries(BUILDING_COLORS)) {
    expression.push(type, color);
  }
  expression.push(DEFAULT_BUILDING_COLOR);
  return expression as ExpressionSpecification;
}

export const BUILDING_FILL_LAYER: LayerProps = {
  id: BUILDING_LAYER_ID,
  type: "fill",
  paint: {
    "fill-color": createColorExpression(),
    "fill-opacity": 0.6,
  },
};

export const BUILDING_OUTLINE_LAYER: LayerProps = {
  id: BUILDING_OUTLINE_LAYER_ID,
  type: "line",
  paint: {
    "line-color": createColorExpression(),
    "line-width": 2,
  },
};

export const BUILDING_HOTSPOT_LAYER_ID = "buildings-hotspot";
export const BUILDING_HOTSPOT_OUTLINE_LAYER_ID = "buildings-hotspot-outline";
export const HOTSPOT_PATTERN_ID = "hotspot-stripes";

export const BUILDING_HOTSPOT_FILL_LAYER: LayerProps = {
  id: BUILDING_HOTSPOT_LAYER_ID,
  type: "fill",
  filter: ["==", ["get", "isHotspot"], true],
  paint: { "fill-pattern": HOTSPOT_PATTERN_ID },
};

export const BUILDING_HOTSPOT_OUTLINE_LAYER: LayerProps = {
  id: BUILDING_HOTSPOT_OUTLINE_LAYER_ID,
  type: "line",
  filter: ["==", ["get", "isHotspot"], true],
  paint: { "line-color": "#FF6B00", "line-width": 4 },
};
