import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { CombinedHoverInfo, Network } from "../../types";
import {
  glowLayer,
  casingLayer,
  mainLayer,
  dividersLayer,
} from "../../constants";
import { networkToGeoJSON } from "../../utils";

interface NetworkLayerProps {
  network: Network;
  hoverInfo: CombinedHoverInfo | null;
  selectedLinkIds?: string[];
}

export function NetworkLayer({ network, selectedLinkIds }: NetworkLayerProps) {
  const geojson = useMemo(
    () => networkToGeoJSON(network, selectedLinkIds),
    [network, selectedLinkIds],
  );

  return (
    <Source id="network" type="geojson" data={geojson}>
      <Layer {...glowLayer} />
      <Layer {...casingLayer} />
      <Layer {...mainLayer} />
      <Layer {...dividersLayer} />
    </Source>
  );
}
