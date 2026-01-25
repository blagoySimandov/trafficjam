import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { CombinedHoverInfo, Network } from "../types";
import { glowLayer, casingLayer, mainLayer, dividersLayer } from "../constants";
import { networkToGeoJSON } from "../utils";
import { BuildingLayer } from "./building-layer";

interface NetworkLayerProps {
  network: Network;
  hoverInfo: CombinedHoverInfo | null;
  showBuildings: boolean;
}

export function NetworkLayer({ network, showBuildings }: NetworkLayerProps) {
  const geojson = useMemo(() => networkToGeoJSON(network), [network]);

  return (
    <>
      <Source id="network" type="geojson" data={geojson}>
        <Layer {...glowLayer} />
        <Layer {...casingLayer} />
        <Layer {...mainLayer} />
        <Layer {...dividersLayer} />
      </Source>
      {showBuildings && network.buildings && <BuildingLayer buildings={network.buildings} />}
    </>
  );
}