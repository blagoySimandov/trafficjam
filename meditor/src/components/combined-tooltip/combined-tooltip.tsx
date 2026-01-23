import { Popup } from "react-map-gl";
import type { TrafficLink, TransportRoute, Building } from "../../types";
import { LinkInfo } from "./link-info";
import { RouteInfo } from "./route-info";
import { BuildingInfo } from "./building-info";
import { TOOLTIP_CONFIG } from "../../constants";
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
      closeButton={TOOLTIP_CONFIG.CLOSE_BUTTON}
      closeOnClick={TOOLTIP_CONFIG.CLOSE_ON_CLICK}
      anchor={TOOLTIP_CONFIG.ANCHOR}
      offset={TOOLTIP_CONFIG.OFFSET}
    >
      <div className={styles.container}>
        {building && <BuildingInfo building={building} />}
        {link && <LinkInfo link={link} />}
        {routes && <RouteInfo routes={routes} />}
      </div>
    </Popup>
  );
}
