import { useCallback } from "react";
import type { Network, TrafficLink } from "../../../types";

export function useUpdateLink(
  network: Network | null,
  onSave: (updatedNetwork: Network, message: string) => void,
) {
  const updateLinks = useCallback(
    (linksToUpdate: TrafficLink[]) => {
      if (!network || linksToUpdate.length === 0) return;

      const updatedLinks = new Map(network.links);
      for (const link of linksToUpdate) {
        updatedLinks.set(link.id, link);
      }

      const updatedNetwork = {
        ...network,
        links: updatedLinks,
      };

      const message = `Updated ${linksToUpdate.length} link${linksToUpdate.length > 1 ? 's' : ''}`;
      onSave(updatedNetwork, message);
    },
    [network, onSave],
  );

  return { updateLinks };
}