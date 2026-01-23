import { Popup } from "react-map-gl";
import type { TrafficLink, TransportRoute } from "../../types";
import { LinkInfo } from "./link-info";
import { RouteInfo } from "./route-info";
import styles from "./combined-tooltip.module.css";

interface CombinedTooltipProps {
  link?: TrafficLink;
  routes?: TransportRoute[];
  longitude: number;
  latitude: number;
}

export function CombinedTooltip({
  link,
  routes,
  longitude,
  latitude,
}: CombinedTooltipProps) {
  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      closeButton={false}
      closeOnClick={false}
      anchor="bottom"
      offset={10}
    >
      <div className={styles.container}>
        {link && <LinkInfo link={link} />}
        {routes && <RouteInfo routes={routes} />}
      </div>
    </Popup>
  );
}
