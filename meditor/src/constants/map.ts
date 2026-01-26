import { NETWORK_LAYER_ID, TRANSPORT_LAYER_IDS } from "./transport-layers";
import { BUILDING_LAYER_ID } from "./building-icons";
import { NODE_LAYER_ID } from "./node-layers";

export const DEFAULT_CENTER: [number, number] = [23.322, 42.698];
export const DEFAULT_ZOOM = 15;
export const MIN_IMPORT_ZOOM = 14;
export const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";
export const INTERACTIVE_LAYER_IDS = [
  NETWORK_LAYER_ID,
  TRANSPORT_LAYER_IDS.SUBWAY,
  TRANSPORT_LAYER_IDS.BUS,
  TRANSPORT_LAYER_IDS.TRAM,
  TRANSPORT_LAYER_IDS.TRAIN,
  TRANSPORT_LAYER_IDS.LIGHT_RAIL,
  BUILDING_LAYER_ID,
  NODE_LAYER_ID,
];
