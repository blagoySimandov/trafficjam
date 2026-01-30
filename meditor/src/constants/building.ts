import type { LayerProps } from "react-map-gl";
import type { ExpressionSpecification } from "mapbox-gl";
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

const DEFAULT_BUILDING_COLOR = "#34495E";

function createColorExpression(): ExpressionSpecification {
  const expression: (string | ExpressionSpecification)[] = ["match", ["get", "type"]];
  for (const [type, color] of Object.entries(BUILDING_COLORS)) {
    expression.push(type, color);
  }
  expression.push(DEFAULT_BUILDING_COLOR);
  return expression as ExpressionSpecification;
}

export const BUILDING_CIRCLE_LAYER: LayerProps = {
  id: BUILDING_LAYER_ID,
  type: "circle",
  paint: {
    "circle-radius": 10,
    "circle-color": createColorExpression(),
    "circle-stroke-color": "#FFFFFF",
    "circle-stroke-width": 2,
    "circle-opacity": 0.9,
  },
};
