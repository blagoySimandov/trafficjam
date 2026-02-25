import { useCallback, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { TrafficLink } from "../../../types";

export function useMultiSelect(selectedLinks: TrafficLink[]) {
    const held = useRef(false);

    useHotkeys("mod", () => { held.current = true; }, { keydown: true, keyup: false });
    useHotkeys("mod", () => { held.current = false; }, { keydown: false, keyup: true });

    const handleLinkClick = useCallback(
        (link: TrafficLink): TrafficLink[] => {
            if (!held.current) return [link];

            const isSelected = selectedLinks.some((l) => l.id === link.id);
            if (isSelected) return selectedLinks.filter((l) => l.id !== link.id);
            return [...selectedLinks, link];
        },
        [selectedLinks],
    );

    return { handleLinkClick };
}
