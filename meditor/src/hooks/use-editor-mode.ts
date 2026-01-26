import { useState, useCallback } from "react";
import type { TrafficLink, Network, LngLatTuple, BuildingType } from "../types";

export type EditorTool = "select" | "draw-road" | "add-building";

export interface EditableLink extends TrafficLink {
  isNew?: boolean;
}

export interface BuildingPreset {
  id: string;
  type: BuildingType;
  position: LngLatTuple;
  width: number;
  height: number;
  name?: string;
}

interface EditorState {
  isActive: boolean;
  tool: EditorTool;
  selectedLink: EditableLink | null;
  selectedBuildingType: BuildingType | null;
  drawingPoints: LngLatTuple[];
  drawingNodeIds: string[];
  buildingPresets: Map<string, BuildingPreset>;
  modifiedLinks: Map<string, EditableLink>;
  newLinks: Map<string, EditableLink>;
  resizingBuilding: string | null;
}

export function useEditorMode(network: Network | null) {
  const [state, setState] = useState<EditorState>({
    isActive: false,
    tool: "select",
    selectedLink: null,
    selectedBuildingType: null,
    drawingPoints: [],
    drawingNodeIds: [],
    buildingPresets: new Map(),
    modifiedLinks: new Map(),
    newLinks: new Map(),
    resizingBuilding: null,
  });

  const toggleEditor = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: !prev.isActive,
      tool: "select",
      selectedLink: null,
      drawingPoints: [],
      drawingNodeIds: [],
    }));
  }, []);

  const setTool = useCallback((tool: EditorTool) => {
    setState((prev) => ({
      ...prev,
      tool,
      selectedLink: null,
      drawingPoints: [],
      drawingNodeIds: [],
      selectedBuildingType: tool === "add-building" ? "retail" : null,
    }));
  }, []);

  const setBuildingType = useCallback((buildingType: BuildingType) => {
    setState((prev) => ({
      ...prev,
      selectedBuildingType: buildingType,
    }));
  }, []);

  const selectLink = useCallback((link: TrafficLink) => {
    setState((prev) => ({
      ...prev,
      selectedLink: { ...link },
      tool: "select",
    }));
  }, []);

  const updateLinkAttributes = useCallback(
    (linkId: string, updates: Partial<TrafficLink["tags"]>) => {
      setState((prev) => {
        const link = prev.selectedLink;
        if (!link || link.id !== linkId) return prev;

        const updatedLink: EditableLink = {
          ...link,
          tags: { ...link.tags, ...updates },
        };

        const modifiedLinks = new Map(prev.modifiedLinks);
        modifiedLinks.set(linkId, updatedLink);

        return {
          ...prev,
          selectedLink: updatedLink,
          modifiedLinks,
        };
      });
    },
    []
  );

  const addDrawingPoint = useCallback((point: LngLatTuple, nodeId?: string) => {
    setState((prev) => ({
      ...prev,
      drawingPoints: [...prev.drawingPoints, point],
      drawingNodeIds: [...prev.drawingNodeIds, nodeId || ""],
    }));
  }, []);

  const finishDrawing = useCallback((tags: TrafficLink["tags"]) => {
    setState((prev) => {
      if (prev.drawingPoints.length < 2) return prev;

      const newLinkId = `new_link_${Date.now()}`;
      const newLink: EditableLink = {
        id: newLinkId,
        osmId: -1,
        from: prev.drawingNodeIds[0] || `node_${prev.drawingPoints[0].join("_")}`,
        to: prev.drawingNodeIds[prev.drawingNodeIds.length - 1] || 
            `node_${prev.drawingPoints[prev.drawingPoints.length - 1].join("_")}`,
        geometry: prev.drawingPoints,
        tags,
        isNew: true,
      };

      const newLinks = new Map(prev.newLinks);
      newLinks.set(newLinkId, newLink);

      return {
        ...prev,
        newLinks,
        drawingPoints: [],
        drawingNodeIds: [],
        tool: "select",
      };
    });
  }, []);

  const cancelDrawing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      drawingPoints: [],
      drawingNodeIds: [],
      tool: "select",
    }));
  }, []);

  const addBuildingPreset = useCallback((position: LngLatTuple, name?: string) => {
    setState((prev) => {
      if (!prev.selectedBuildingType) return prev;

      const presetId = `building_preset_${Date.now()}`;
      const preset: BuildingPreset = {
        id: presetId,
        type: prev.selectedBuildingType,
        position,
        width: 50,
        height: 50,
        name,
      };

      const buildingPresets = new Map(prev.buildingPresets);
      buildingPresets.set(presetId, preset);

      return {
        ...prev,
        buildingPresets,
      };
    });
  }, []);

  const updateBuildingPreset = useCallback((id: string, updates: Partial<BuildingPreset>) => {
    setState((prev) => {
      const buildingPresets = new Map(prev.buildingPresets);
      const preset = buildingPresets.get(id);
      if (!preset) return prev;

      buildingPresets.set(id, { ...preset, ...updates });

      return {
        ...prev,
        buildingPresets,
      };
    });
  }, []);

  const deleteLink = useCallback((linkId: string) => {
    setState((prev) => {
      const newLinks = new Map(prev.newLinks);
      newLinks.delete(linkId);

      return {
        ...prev,
        newLinks,
        selectedLink: prev.selectedLink?.id === linkId ? null : prev.selectedLink,
      };
    });
  }, []);

  const deleteBuildingPreset = useCallback((presetId: string) => {
    setState((prev) => {
      const buildingPresets = new Map(prev.buildingPresets);
      buildingPresets.delete(presetId);

      return {
        ...prev,
        buildingPresets,
      };
    });
  }, []);

  const setResizingBuilding = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      resizingBuilding: id,
    }));
  }, []);

  const getModifiedNetwork = useCallback((): Network | null => {
    if (!network) return null;

    const links = new Map(network.links);
    
    // Apply modifications
    for (const [id, link] of state.modifiedLinks) {
      links.set(id, link);
    }
    
    // Add new links
    for (const [id, link] of state.newLinks) {
      links.set(id, link);
    }

    return {
      ...network,
      links,
    };
  }, [network, state.modifiedLinks, state.newLinks]);

  return {
    isActive: state.isActive,
    tool: state.tool,
    selectedLink: state.selectedLink,
    selectedBuildingType: state.selectedBuildingType,
    drawingPoints: state.drawingPoints,
    drawingNodeIds: state.drawingNodeIds,
    buildingPresets: state.buildingPresets,
    modifiedLinks: state.modifiedLinks,
    newLinks: state.newLinks,
    resizingBuilding: state.resizingBuilding,
    toggleEditor,
    setTool,
    setBuildingType,
    selectLink,
    updateLinkAttributes,
    addDrawingPoint,
    finishDrawing,
    cancelDrawing,
    addBuildingPreset,
    updateBuildingPreset,
    deleteLink,
    deleteBuildingPreset,
    setResizingBuilding,
    getModifiedNetwork,
  };
}