import { useCallback } from "react";
import type { TrafficLink } from "../../../types";

let multiSelectHeld = false;

if (typeof window !== "undefined") {
    window.addEventListener("keydown", (e) => {
        if (e.metaKey || e.ctrlKey) multiSelectHeld = true;
    });
    window.addEventListener("keyup", (e) => {
        if (e.key === "Meta" || e.key === "Control") multiSelectHeld = false;
    });
    window.addEventListener("blur", () => {
        multiSelectHeld = false;
    });
}

export function useMultiSelect(selectedLinks: TrafficLink[]) {
    const handleLinkClick = useCallback(
        (link: TrafficLink): TrafficLink[] => {
            if (!multiSelectHeld) return [link];

            const isSelected = selectedLinks.some((l) => l.id === link.id);
            if (isSelected) return selectedLinks.filter((l) => l.id !== link.id);
            return [...selectedLinks, link];
        },
        [selectedLinks],
    );

    return { handleLinkClick };
}
