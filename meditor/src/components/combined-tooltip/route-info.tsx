import type { TransportRoute } from "../../types";
import styles from "./combined-tooltip.module.css";

interface RouteInfoProps {
  routes: TransportRoute[];
}

export function RouteInfo({ routes }: RouteInfoProps) {
  if (routes.length === 0) return null;

  return (
    <div className={styles.routesSection}>
      <strong className={styles.routesTitle}>Transport Lines:</strong>
      {routes.map((route) => (
        <div
          key={route.id}
          className={styles.routeItem}
          style={{ borderLeftColor: route.tags.colour || "#666" }}
        >
          <span className={styles.routeType}>{route.tags.route}</span>
          {route.tags.ref && ` ${route.tags.ref}`}
          {route.tags.name && (
            <div className={styles.routeName}>{route.tags.name}</div>
          )}
        </div>
      ))}
    </div>
  );
}
