import { calculateHaversineDistance } from './haversine';

/**
 * Filter a network by radius from a center point
 * @param {Object} network - Network object with nodes, links, transportRoutes, buildings Maps
 * @param {Object} centerPoint - Center point with {lat, lon} properties
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Filtered network object
 */
export function filterNetworkByRadius(network, centerPoint, radiusKm) {
  const radiusMeters = radiusKm * 1000;
  const filteredNodes = new Map();
  const filteredLinks = new Map();
  const filteredTransportRoutes = new Map();
  const filteredBuildings = new Map();

  // Step 1: Filter nodes within radius
  for (const [nodeId, node] of network.nodes) {
    const distance = calculateHaversineDistance(
      [node.position[0], node.position[1]], // [lat, lon]
      [centerPoint.lat, centerPoint.lon]
    );
    if (distance <= radiusMeters) {
      filteredNodes.set(nodeId, node);
    }
  }

  // Step 2: Filter links (only keep if BOTH endpoints are within radius)
  for (const [linkId, link] of network.links) {
    if (filteredNodes.has(link.from) && filteredNodes.has(link.to)) {
      filteredLinks.set(linkId, link);
    }
  }

  // Step 3: Filter transport routes (keep if ANY point is within radius)
  if (network.transportRoutes) {
    for (const [routeId, route] of network.transportRoutes) {
      const hasPointInRadius = route.geometry.some((point) => {
        const distance = calculateHaversineDistance(
          point,
          [centerPoint.lat, centerPoint.lon]
        );
        return distance <= radiusMeters;
      });

      if (hasPointInRadius) {
        filteredTransportRoutes.set(routeId, route);
      }
    }
  }

  // Step 4: Filter buildings within radius
  if (network.buildings) {
    for (const [buildingId, building] of network.buildings) {
      const distance = calculateHaversineDistance(
        building.position,
        [centerPoint.lat, centerPoint.lon]
      );
      if (distance <= radiusMeters) {
        filteredBuildings.set(buildingId, building);
      }
    }
  }

  return {
    nodes: filteredNodes,
    links: filteredLinks,
    transportRoutes: filteredTransportRoutes,
    buildings: filteredBuildings,
  };
}
