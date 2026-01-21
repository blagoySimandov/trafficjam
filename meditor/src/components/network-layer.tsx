import { LayerGroup } from "react-leaflet";
import type { Network, TrafficLink } from "../types";
import { LinkLayer } from "./link-layer";

interface NetworkLayerProps {
  network: Network;
  onLinkClick: (link: TrafficLink) => void;
}

export function NetworkLayer({ network, onLinkClick }: NetworkLayerProps) {
  const links = Array.from(network.links.values());

  return (
    <LayerGroup>
      {links.map((link) => (
        <LinkLayer key={link.id} link={link} onClick={onLinkClick} />
      ))}
    </LayerGroup>
  );
}
