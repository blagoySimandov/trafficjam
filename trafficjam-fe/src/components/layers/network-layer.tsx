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
  selectedLinkId?: string[];
  idPrefix?: string;
}

export function NetworkLayer({
  network,
  selectedLinkId,
  idPrefix = "static",
}: NetworkLayerProps) {
  const geojson = useMemo(
    () => networkToGeoJSON(network, selectedLinkId),
    [network, selectedLinkId],
  );

  const sourceId = `${idPrefix}-network`;

  return (
    <Source id={sourceId} type="geojson" data={geojson}>
      <Layer
        {...glowLayer}
        id={`${idPrefix}-${glowLayer.id}`}
      />
      <Layer
        {...casingLayer}
        id={`${idPrefix}-${casingLayer.id}`}
      />
      <Layer
        {...mainLayer}
        id={`${idPrefix}-${mainLayer.id}`}
      />
      <Layer
        {...dividersLayer}
        id={`${idPrefix}-${dividersLayer.id}`}
      />
    </Source>
  );
}
