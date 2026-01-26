import type { LayerProps } from "react-map-gl";
import {
  BUILDING_LAYER_ID,
  BUILDING_COLORS,
  DEFAULT_BUILDING_COLOR,
  BUILDING_CIRCLE_RADIUS,
  BUILDING_CIRCLE_STROKE_WIDTH,
  BUILDING_CIRCLE_STROKE_COLOR,
  BUILDING_CIRCLE_OPACITY,
} from "./building-icons";

function createColorExpression(): unknown[] {
  const expression: unknown[] = ["match", ["get", "type"]];

  for (const [type, color] of Object.entries(BUILDING_COLORS)) {
    expression.push(type, color);
  }

  expression.push(DEFAULT_BUILDING_COLOR);
  return expression;
}

export const BUILDING_CIRCLE_LAYER: LayerProps = {
  id: BUILDING_LAYER_ID,
  type: "circle",
  paint: {
    "circle-radius": BUILDING_CIRCLE_RADIUS,
    "circle-color": createColorExpression() as any,
    "circle-stroke-color": BUILDING_CIRCLE_STROKE_COLOR,
    "circle-stroke-width": BUILDING_CIRCLE_STROKE_WIDTH,
    "circle-opacity": BUILDING_CIRCLE_OPACITY,
  },
};
