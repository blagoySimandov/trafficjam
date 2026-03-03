import { useMemo } from "react";
import { Source, Layer, useMap } from "react-map-gl";
import type { Building } from "../../types";
import { buildingToGeoJSON } from "../../utils";
import {
  BUILDING_SOURCE_ID,
  BUILDING_FILL_LAYER,
  BUILDING_OUTLINE_LAYER,
  BUILDING_HOTSPOT_FILL_LAYER,
  BUILDING_HOTSPOT_OUTLINE_LAYER,
  HOTSPOT_PATTERN_ID,
} from "../../constants";

function createStripePattern() {
  const size = 8;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#FF6B00";
  ctx.fillRect(0, 0, size, 4);
  const { data } = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data };
}

interface BuildingLayerProps {
  buildings: Map<string, Building>;
}

export function BuildingLayer({ buildings }: BuildingLayerProps) {
  const { current: mapRef } = useMap();
  const geojson = useMemo(() => buildingToGeoJSON(buildings), [buildings]);

  useMemo(() => {
    const map = mapRef?.getMap();
    if (!map || map.hasImage(HOTSPOT_PATTERN_ID)) return;
    map.addImage(HOTSPOT_PATTERN_ID, createStripePattern());
  }, [mapRef]);

  return (
    <Source id={BUILDING_SOURCE_ID} type="geojson" data={geojson}>
      <Layer {...BUILDING_FILL_LAYER} />
      <Layer {...BUILDING_OUTLINE_LAYER} />
      <Layer {...BUILDING_HOTSPOT_FILL_LAYER} />
      <Layer {...BUILDING_HOTSPOT_OUTLINE_LAYER} />
    </Source>
  );
}
