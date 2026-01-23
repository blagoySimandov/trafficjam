import type { LayerProps } from "react-map-gl";
import type { BuildingType } from "../types";
import {
  BUILDING_LAYER_ID,
  BUILDING_ICON_LAYER_ID,
  BUILDING_COLORS,
  BUILDING_ICONS,
  DEFAULT_BUILDING_COLOR,
  DEFAULT_BUILDING_ICON,
  BUILDING_CIRCLE_RADIUS,
  BUILDING_CIRCLE_STROKE_WIDTH,
  BUILDING_CIRCLE_STROKE_COLOR,
  BUILDING_CIRCLE_OPACITY,
  BUILDING_ICON_SIZE,
  BUILDING_ICON_COLOR,
} from "./building-icons";

function createColorExpression(): any[] {
  const expression: any[] = ["match", ["get", "type"]];

  for (const [type, color] of Object.entries(BUILDING_COLORS)) {
    expression.push(type, color);
  }

  expression.push(DEFAULT_BUILDING_COLOR);
  return expression;
}

function createIconExpression(): any[] {
  const expression: any[] = ["match", ["get", "type"]];

  for (const [type, icon] of Object.entries(BUILDING_ICONS)) {
    expression.push(type, icon);
  }

  expression.push(DEFAULT_BUILDING_ICON);
  return expression;
}

export const BUILDING_CIRCLE_LAYER: LayerProps = {
  id: BUILDING_LAYER_ID,
  type: "circle",
  paint: {
    "circle-radius": BUILDING_CIRCLE_RADIUS,
    "circle-color": createColorExpression(),
    "circle-stroke-color": BUILDING_CIRCLE_STROKE_COLOR,
    "circle-stroke-width": BUILDING_CIRCLE_STROKE_WIDTH,
    "circle-opacity": BUILDING_CIRCLE_OPACITY,
  },
};

export const BUILDING_ICON_LAYER: LayerProps = {
  id: BUILDING_ICON_LAYER_ID,
  type: "symbol",
  layout: {
    "text-field": createIconExpression(),
    "text-size": BUILDING_ICON_SIZE,
    "text-allow-overlap": true,
    "text-ignore-placement": true,
  },
  paint: {
    "text-color": BUILDING_ICON_COLOR,
  },
};
