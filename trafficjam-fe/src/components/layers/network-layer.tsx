import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { CombinedHoverInfo, Network } from "../../types";
import { networkToGeoJSON } from "../../utils";
import { useMapEditorLayers } from "../../presentation/editor/hooks/use-map-editor-layers";

interface NetworkLayerProps {
  network: Network;
  hoverInfo: CombinedHoverInfo | null;
  selectedLinkId?: string[];
  idPrefix?: string;
  filterIds?: string[];
}

export function NetworkLayer({
  network,
  selectedLinkId,
  idPrefix = "static",
  filterIds,
}: NetworkLayerProps) {
  const geojson = useMemo(
    () => networkToGeoJSON(network, selectedLinkId),
    [network, selectedLinkId],
  );

  const sourceId = `${idPrefix}-network`;
  const layers = useMapEditorLayers({ idPrefix, filterIds });

  return (
    <Source id={sourceId} type="geojson" data={geojson}>
      {layers.map((layerProps) => (
        <Layer key={layerProps.id} {...layerProps} />
      ))}
    </Source>
  );
}
