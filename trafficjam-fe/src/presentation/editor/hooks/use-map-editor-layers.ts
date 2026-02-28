import { useMemo } from "react";
import {
  glowLayer,
  casingLayer,
  mainLayer,
  dividersLayer,
} from "../../../constants";
import { mergeFilters } from "../../../utils";

interface UseMapEditorLayersParams {
  idPrefix: string;
  filterIds?: string[];
}

/**
 * Generates Mapbox GL layer definitions for the network,
 * applying prefixing and draft/static filtering.
 */
export function useMapEditorLayers({
  idPrefix,
  filterIds,
}: UseMapEditorLayersParams) {
  return useMemo(() => {
    return [
      { base: glowLayer, id: `${idPrefix}-${glowLayer.id}` },
      { base: casingLayer, id: `${idPrefix}-${casingLayer.id}` },
      { base: mainLayer, id: `${idPrefix}-${mainLayer.id}` },
      { base: dividersLayer, id: `${idPrefix}-${dividersLayer.id}` },
    ].map((layerDef) => {
      const filter = mergeFilters(layerDef.base.filter as any[], filterIds);
      return {
        ...layerDef.base,
        id: layerDef.id,
        ...(filter ? { filter } : {}),
      };
    });
  }, [idPrefix, filterIds]);
}
