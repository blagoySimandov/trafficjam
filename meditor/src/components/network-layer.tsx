import { useMemo } from "react";
import { Source, Layer, Popup } from "react-map-gl";
import type { Network, TrafficLink } from "../types";
import { glowLayer, casingLayer, mainLayer, dividersLayer } from "../constants";
import { networkToGeoJSON } from "../utils";
import { LinkTooltip } from "./link-tooltip";

interface NetworkLayerProps {
  network: Network;
  hoverInfo: {
    link: TrafficLink;
    longitude: number;
    latitude: number;
  } | null;
}

export function NetworkLayer({ network, hoverInfo }: NetworkLayerProps) {
  const geojson = useMemo(() => networkToGeoJSON(network), [network]);

  return (
    <>
      <Source id="network" type="geojson" data={geojson}>
        <Layer {...glowLayer} />
        <Layer {...casingLayer} />
        <Layer {...mainLayer} />
        <Layer {...dividersLayer} />
      </Source>
      {hoverInfo && (
        <Popup
          longitude={hoverInfo.longitude}
          latitude={hoverInfo.latitude}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={10}
        >
          <LinkTooltip link={hoverInfo.link} />
        </Popup>
      )}
    </>
  );
}
