import { useCallback } from "react";
import type { MapMouseEvent, MapRef } from "react-map-gl";
import type { Network, TrafficLink, Building, CombinedHoverInfo } from "../types";
import {
  detectFeaturesAtPoint,
  safeQueryRenderedFeatures,
} from "../utils/feature-detection";
import { findSnapPoint } from "../utils/snap-to-network";
import {
  NETWORK_LAYER_ID,
  NETWORK_CASING_LAYER_ID,
  NODE_LAYER_ID,
} from "../constants";
import { useRafState } from "./use-raf-state";

interface UseMapInteractionsParams {
  network: Network | null;
  mapRef: React.RefObject<MapRef | null>;
  onLinkClick?: (
    link: TrafficLink,
    coords?: { lng: number; lat: number },
    modKey?: boolean,
  ) => void;
  onBuildingClick?: (building: Building) => void;
  editorMode?: boolean;
}

const MIN_NODE_ZOOM = 16;

export function useMapInteractions({
  network,
  mapRef,
  onLinkClick,
  onBuildingClick,
  editorMode,
}: UseMapInteractionsParams) {
  const [hoverInfo, setHoverInfo] = useRafState<CombinedHoverInfo | null>(null);

  const findNearbyLink = useCallback(
    (event: MapMouseEvent) => {
      if (!network) return undefined;
      const map = mapRef.current;
      if (!map) return undefined;
      if (map.getZoom() < MIN_NODE_ZOOM) return undefined;

      const { x, y } = event.point;
      const bbox: [[number, number], [number, number]] = [
        [x - 6, y - 6],
        [x + 6, y + 6],
      ];

      const networkLayers = [NETWORK_LAYER_ID, NETWORK_CASING_LAYER_ID].flatMap(
        (id) => [id, `static-${id}`, `draft-${id}`],
      );
      const features = safeQueryRenderedFeatures(map, bbox, networkLayers);

      for (const feature of features) {
        const id = feature.properties?.id;
        if (typeof id === "string") {
          const link = network.links.get(id);
          if (link) return link;
        }
      }

      return undefined;
    },
    [mapRef, network],
  );

  const handleClick = useCallback(
    (event: MapMouseEvent): boolean => {
      if (!network) return false;
      const map = mapRef.current;
      const canEditAtZoom = !!(
        editorMode &&
        map &&
        map.getZoom() >= MIN_NODE_ZOOM
      );

      if (editorMode && !canEditAtZoom) return false;

      // If we're on or near a node, don't handle as a link click
      const isHoveringNode = map
        ? safeQueryRenderedFeatures(map, event.point, [
            NODE_LAYER_ID,
            `static-${NODE_LAYER_ID}`,
            `draft-${NODE_LAYER_ID}`,
          ]).length > 0
        : false;
      if (isHoveringNode) return false;

      if (canEditAtZoom) {
        const snapResult = findSnapPoint(
          [event.lngLat.lat, event.lngLat.lng],
          network,
          [],
        );
        if (snapResult?.isNode) return false;
      }

      const detected = detectFeaturesAtPoint(event, network);
      const link =
        detected.link || (editorMode ? findNearbyLink(event) : undefined);

      if (detected.building) {
        if (onBuildingClick) {
          onBuildingClick(detected.building);
        } else {
          setHoverInfo({
            building: detected.building,
            routes: [],
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
          });
        }
        return true;
      } else if (link && onLinkClick) {
        onLinkClick(
          link,
          { lng: event.lngLat.lng, lat: event.lngLat.lat },
          event.originalEvent.metaKey || event.originalEvent.ctrlKey,
        );
        return true;
      }

      return false;
    },
    [network, mapRef, onLinkClick, onBuildingClick, editorMode, findNearbyLink, setHoverInfo],
  );

  const handleMouseMove = useCallback(
    (event: MapMouseEvent): boolean => {
      const map = mapRef.current;
      const features = event.features || [];
      const canEditAtZoom = !!(
        editorMode &&
        map &&
        map.getZoom() >= MIN_NODE_ZOOM
      );

      if (features.length === 0 && !editorMode) {
        if (map) map.getCanvas().style.cursor = "";
        return false;
      }

      const detected = detectFeaturesAtPoint(event, network);
      const link =
        detected.link || (canEditAtZoom ? findNearbyLink(event) : undefined);

      const isHoveringNode =
        safeQueryRenderedFeatures(map, event.point, [
          NODE_LAYER_ID,
          `static-${NODE_LAYER_ID}`,
          `draft-${NODE_LAYER_ID}`,
        ]).length > 0;

      if (map) {
        if (link && canEditAtZoom && !isHoveringNode) {
          map.getCanvas().style.cursor = "crosshair";
        } else if (link || detected.routes.length > 0 || detected.building) {
          map.getCanvas().style.cursor = "pointer";
        } else {
          map.getCanvas().style.cursor = "";
        }
      }

      if (link || detected.routes.length > 0) {
        setHoverInfo({
          link,
          routes: detected.routes,
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
        });
        return true;
      } else {
        setHoverInfo(null);
        return false;
      }
    },
    [network, mapRef, editorMode, findNearbyLink, setHoverInfo],
  );

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = "";
    setHoverInfo(null);
  }, [mapRef, setHoverInfo]);

  return {
    hoverInfo,
    onClick: handleClick,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}
