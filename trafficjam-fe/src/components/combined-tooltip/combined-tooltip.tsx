import { Popup } from "react-map-gl";
import type { TrafficLink, TransportRoute, Building } from "../../types";
import { LinkInfo } from "./link-info";
import { RouteInfo } from "./route-info";
import { BuildingInfo } from "./building-info";
import styles from "./combined-tooltip.module.css";

interface CombinedTooltipProps {
  link?: TrafficLink;
  routes?: TransportRoute[];
  building?: Building;
  longitude: number;
  latitude: number;
}

export function CombinedTooltip({
  link,
  routes,
  building,
  longitude,
  latitude,
}: CombinedTooltipProps) {
  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      closeButton={true}
      closeOnClick={true}
      anchor="bottom"
      offset={10}
    >
      <div className={styles.container}>
        {building && <BuildingInfo building={building} />}
        {link && <LinkInfo link={link} />}
        {routes && <RouteInfo routes={routes} />}
      </div>
    </Popup>
  );
}
