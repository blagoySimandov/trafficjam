import { useState, useCallback } from "react";
import type { TrafficLink, Network } from "../../../types";

export function useLinkSelection() {
  const [selectedLinks, setSelectedLinks] = useState<TrafficLink[]>([]);

  const selectLink = useCallback((link: TrafficLink | null) => {
    setSelectedLinks(link ? [link] : []);
  }, []);

  const selectLinks = useCallback((links: TrafficLink[]) => {
    setSelectedLinks(links);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLinks([]);
  }, []);

  const updateSelectedLinks = useCallback(
    (network: Network | null) => {
      if (selectedLinks.length === 0 || !network) {
        return;
      }
      const updatedLinks = selectedLinks
        .map((link) => network.links.get(link.id))
        .filter((link): link is TrafficLink => link !== undefined);
      setSelectedLinks(updatedLinks);
    },
    [selectedLinks]
  );

  return {
    selectedLinks,
    selectLink,
    selectLinks,
    clearSelection,
    updateSelectedLinks,
  };
}
