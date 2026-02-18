import { useState, useCallback } from "react";
import type { TrafficLink, Network } from "../../../types";

export function useLinkSelection() {
  const [selectedLink, setSelectedLink] = useState<TrafficLink | null>(null);

  const selectLink = useCallback((link: TrafficLink | null) => {
    setSelectedLink(link);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLink(null);
  }, []);

  const updateSelectedLink = useCallback(
    (network: Network | null) => {
      if (!selectedLink || !network) {
        return;
      }
      // Update the selected link reference if it still exists in the network
      const updatedLink = network.links.get(selectedLink.id);
      if (updatedLink) {
        setSelectedLink(updatedLink);
      } else {
        // Link was deleted, clear selection
        setSelectedLink(null);
      }
    },
    [selectedLink]
  );

  return {
    selectedLink,
    selectLink,
    clearSelection,
    updateSelectedLink,
  };
}
