import { useMemo } from "react";
import type { Building } from "../types";
import { BuildingLayer } from "./building-layer";

interface BuildingClusterLayerProps {
  buildings: Building[];
}

interface BuildingCluster {
  id: string;
  centroid: L.LatLngTuple;
  buildings: Building[];
  type: "cluster" | "single";
}

function calculateDistance(pos1: L.LatLngTuple, pos2: L.LatLngTuple): number {
  const [lat1, lon1] = pos1;
  const [lat2, lon2] = pos2;
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

function getCentroid(geometry: L.LatLngTuple[]): L.LatLngTuple {
  const latSum = geometry.reduce((sum, point) => sum + point[0], 0);
  const lonSum = geometry.reduce((sum, point) => sum + point[1], 0);
  return [latSum / geometry.length, lonSum / geometry.length];
}

function getBuildingPosition(building: Building): L.LatLngTuple | null {
  if (building.type === "node" && building.position) {
    return building.position;
  }
  if (building.type === "way" && building.geometry) {
    return getCentroid(building.geometry);
  }
  return null;
}

function isResidential(building: Building): boolean {
  return building.tags.building === "house" ||
    building.tags.building === "residential" ||
    building.tags.building === "apartments";
}

function clusterResidentialBuildings(buildings: Building[]): Building[] {
  const residential = buildings.filter(isResidential);
  const nonResidential = buildings.filter(b => !isResidential(b));

  if (residential.length === 0) {
    return buildings;
  }

  const CLUSTER_DISTANCE = 0.003;
  const clusters: Building[][] = [];
  const processed = new Set<string>();

  for (const building of residential) {
    if (processed.has(building.id)) continue;

    const cluster: Building[] = [building];
    processed.add(building.id);

    const buildingPos = getBuildingPosition(building);
    if (!buildingPos) continue;

    for (const other of residential) {
      if (processed.has(other.id)) continue;

      const otherPos = getBuildingPosition(other);
      if (!otherPos) continue;

      if (calculateDistance(buildingPos, otherPos) < CLUSTER_DISTANCE) {
        cluster.push(other);
        processed.add(other.id);
      }
    }

    clusters.push(cluster);
  }

  const representativeBuildings = clusters.map(cluster => {
    if (cluster.length === 1) {
      return cluster[0];
    }

    const positions = cluster
      .map(getBuildingPosition)
      .filter((p): p is L.LatLngTuple => p !== null);

    const avgLat = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
    const avgLon = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;

    const hasApartments = cluster.some(b => b.tags.building === "apartments");

    return {
      id: `cluster_${cluster[0].id}`,
      osmId: cluster[0].osmId,
      type: "node" as const,
      position: [avgLat, avgLon] as L.LatLngTuple,
      tags: {
        building: hasApartments ? "apartments" : "residential",
        name: `${cluster.length} buildings`,
      },
    };
  });

  return [...representativeBuildings, ...nonResidential];
}

export function BuildingClusterLayer({ buildings }: BuildingClusterLayerProps) {
  const clusteredBuildings = useMemo(
    () => clusterResidentialBuildings(buildings),
    [buildings]
  );

  return (
    <>
      {clusteredBuildings.map((building) => (
        <BuildingLayer key={building.id} building={building} />
      ))}
    </>
  );
}
