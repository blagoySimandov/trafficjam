import { NETWORK_LAYER_ID, NETWORK_CASING_LAYER_ID, TRANSPORT_LAYER_IDS } from "./transport-layers";
import { BUILDING_LAYER_ID } from "./building";
import { NODE_LAYER_ID } from "./node-layers";

export const MIN_IMPORT_ZOOM = 14;
export const MIN_EDIT_ZOOM = 17;
export const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";
/**
 * IDs of layers that can be interacted with via mouse events.
 * Includes both "static" layers (stable map data) and "draft" layers
 * (temporary visuals for active dragging/adding operations).
 */
export const INTERACTIVE_LAYER_IDS = [
  NETWORK_LAYER_ID,
  `static-${NETWORK_LAYER_ID}`,
  `draft-${NETWORK_LAYER_ID}`,
  NETWORK_CASING_LAYER_ID,
  `static-${NETWORK_CASING_LAYER_ID}`,
  `draft-${NETWORK_CASING_LAYER_ID}`,
  TRANSPORT_LAYER_IDS.SUBWAY,
  TRANSPORT_LAYER_IDS.BUS,
  TRANSPORT_LAYER_IDS.TRAM,
  TRANSPORT_LAYER_IDS.TRAIN,
  TRANSPORT_LAYER_IDS.LIGHT_RAIL,
  BUILDING_LAYER_ID,
  NODE_LAYER_ID,
  `static-${NODE_LAYER_ID}`,
  `draft-${NODE_LAYER_ID}`,
];
