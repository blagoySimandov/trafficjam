import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { Network } from "../types";
import { glowLayer, casingLayer, mainLayer, dividersLayer } from "../constants";
import { networkToGeoJSON } from "../utils";

interface NetworkLayerProps {
  network: Network;
  hoverInfo: null;
}

export function NetworkLayer({ network }: NetworkLayerProps) {
  const geojson = useMemo(() => networkToGeoJSON(network), [network]);

  return (
    <Source id="network" type="geojson" data={geojson}>
      <Layer {...glowLayer} />
      <Layer {...casingLayer} />
      <Layer {...mainLayer} />
      <Layer {...dividersLayer} />
    </Source>
  );
}
