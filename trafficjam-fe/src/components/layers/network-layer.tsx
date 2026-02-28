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
  filterIds?: string[];
}

function mergeFilters(baseFilter: any[] | undefined, filterOutIds: string[] | undefined): any[] | undefined {
  if (!filterOutIds || filterOutIds.length === 0) return baseFilter;
  
  const idFilter = ["!", ["in", ["get", "id"], ["literal", filterOutIds]]];
  
  if (!baseFilter) return idFilter;
  
  if (Array.isArray(baseFilter) && baseFilter[0] === "all") {
    return [...baseFilter, idFilter];
  }
  
  return ["all", baseFilter, idFilter];
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

  const layers = useMemo(() => {
    return [
      { base: glowLayer, id: `${idPrefix}-${glowLayer.id}` },
      { base: casingLayer, id: `${idPrefix}-${casingLayer.id}` },
      { base: mainLayer, id: `${idPrefix}-${mainLayer.id}` },
      { base: dividersLayer, id: `${idPrefix}-${dividersLayer.id}` },
    ].map(layerDef => {
      const filter = mergeFilters(layerDef.base.filter as any[], filterIds);
      return {
        ...layerDef.base,
        id: layerDef.id,
        ...(filter ? { filter } : {})
      };
    });
  }, [idPrefix, filterIds]);

  return (
    <Source id={sourceId} type="geojson" data={geojson}>
      {layers.map(layerProps => (
        <Layer key={layerProps.id} {...layerProps} />
      ))}
    </Source>
  );
}
