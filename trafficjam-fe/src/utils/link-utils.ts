import type { TrafficLink, Network } from "../types";

export function remapSelectedLinks(
  selectedLinks: TrafficLink[],
  network: Network,
): TrafficLink[] {
  return selectedLinks
    .map((link) => network.links.get(link.id))
    .filter((link): link is TrafficLink => link !== undefined);
}
