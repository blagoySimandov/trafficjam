import { useCallback } from "react";
import type { Network, TrafficLink } from "../../../types";

export function useUpdateLink(
  network: Network | null,
  onSave: (updatedNetwork: Network, message: string) => void,
) {
  const updateLink = useCallback(
    (updatedLink: TrafficLink) => {
      if (!network) return;

      const updatedLinks = new Map(network.links);
      updatedLinks.set(updatedLink.id, updatedLink);

      const updatedNetwork = {
        ...network,
        links: updatedLinks,
      };

      const message = `Updated link: ${updatedLink.tags.name || updatedLink.tags.highway}`;
      onSave(updatedNetwork, message);
    },
    [network, onSave],
  );

  return { updateLink };
}