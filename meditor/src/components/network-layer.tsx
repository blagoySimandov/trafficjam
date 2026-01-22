import { LayerGroup } from "react-leaflet";
import type { Network, TrafficLink, BusRoute } from "../types";
import { LinkLayer } from "./link-layer";
import { BuildingClusterLayer } from "./building-cluster-layer";
import { BusRouteLayer } from "./bus-route-layer";

interface NetworkLayerProps {
  network: Network;
  onLinkClick: (link: TrafficLink) => void;
  onRouteClick: (route: BusRoute) => void;
}

export function NetworkLayer({ network, onLinkClick, onRouteClick }: NetworkLayerProps) {
  const links = Array.from(network.links.values());
  const buildings = Array.from(network.buildings.values());
  const busRoutes = Array.from(network.busRoutes.values());

  return (
    <LayerGroup>
      {links.map((link) => (
        <LinkLayer key={link.id} link={link} onClick={onLinkClick} />
      ))}
      {busRoutes.map((route) => (
        <BusRouteLayer key={route.id} route={route} onClick={onRouteClick} />
      ))}
      <BuildingClusterLayer buildings={buildings} />
    </LayerGroup>
  );
}
