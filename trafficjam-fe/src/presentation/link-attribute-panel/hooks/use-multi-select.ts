import { useCallback } from "react";
import type { TrafficLink } from "../../../types";

export function useMultiSelect(selectedLinks: TrafficLink[]) {
    const handleLinkClick = useCallback(
        (link: TrafficLink, modKey: boolean): TrafficLink[] => {
            if (!modKey) return [link];

            const isSelected = selectedLinks.some((l) => l.id === link.id);
            if (isSelected) return selectedLinks.filter((l) => l.id !== link.id);
            return [...selectedLinks, link];
        },
        [selectedLinks],
    );

    return { handleLinkClick };
}
