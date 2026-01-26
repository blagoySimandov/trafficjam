import type { Building, LngLatTuple, TrafficLink } from "../types";
import type { BuildingPreset } from "../hooks/use-editor-mode";

/**
 * Calculate distance between two points in meters
 */
function calculateDistance(point1: LngLatTuple, point2: LngLatTuple): number {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a building overlaps with a rectangular building preset
 */
function isInsideRectangle(
  point: LngLatTuple,
  center: LngLatTuple,
  width: number,
  height: number
): boolean {
  const [lat, lon] = point;
  const [centerLat, centerLon] = center;

  // Convert dimensions to degrees
  const dLon = width / (111320 * Math.cos(centerLat * Math.PI / 180)) / 2;
  const dLat = height / 110540 / 2;

  return (
    Math.abs(lon - centerLon) <= dLon &&
    Math.abs(lat - centerLat) <= dLat
  );
}

/**
 * Check if a building is close to a link (new road)
 */
function isNearLink(building: Building, link: TrafficLink, threshold: number = 20): boolean {
  for (const point of link.geometry) {
    const distance = calculateDistance(building.position, point);
    if (distance < threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Filter buildings that overlap with presets or new roads
 */
export function filterBuildingsByPresets(
  buildings: Map<string, Building>,
  buildingPresets: Map<string, BuildingPreset>,
  newLinks?: Map<string, TrafficLink>
): Map<string, Building> {
  if (buildingPresets.size === 0 && (!newLinks || newLinks.size === 0)) {
    return buildings;
  }

  const filtered = new Map<string, Building>();

  for (const [id, building] of buildings) {
    let shouldKeep = true;

    // Check against building presets
    for (const preset of buildingPresets.values()) {
      if (isInsideRectangle(building.position, preset.position, preset.width, preset.height)) {
        shouldKeep = false;
        break;
      }
    }

    // Check against new roads
    if (shouldKeep && newLinks) {
      for (const link of newLinks.values()) {
        if (isNearLink(building, link)) {
          shouldKeep = false;
          break;
        }
      }
    }

    if (shouldKeep) {
      filtered.set(id, building);
    }
  }

  return filtered;
}