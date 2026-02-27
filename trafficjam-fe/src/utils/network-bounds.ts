import type { Network } from "../types";

export function calculateBounds(network: Network) {
  let north = -90,
    south = 90,
    east = -180,
    west = 180;
  network.nodes.forEach((node) => {
    const [lat, lng] = node.position;
    if (lat > north) north = lat;
    if (lat < south) south = lat;
    if (lng > east) east = lng;
    if (lng < west) west = lng;
  });
  return { north, south, east, west };
}
