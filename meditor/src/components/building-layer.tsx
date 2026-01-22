import { Marker, Polygon, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import type { Building } from "../types";

interface BuildingLayerProps {
  building: Building;
}

const residentialIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🏠%3C/text%3E%3C/svg%3E",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const commercialIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🏢%3C/text%3E%3C/svg%3E",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const shopIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🏪%3C/text%3E%3C/svg%3E",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const restaurantIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🍴%3C/text%3E%3C/svg%3E",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const defaultBuildingIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🏛️%3C/text%3E%3C/svg%3E",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function getBuildingIcon(building: Building): Icon {
  if (building.tags.amenity === "restaurant" || building.tags.amenity === "cafe") {
    return restaurantIcon;
  }
  if (building.tags.amenity === "shop" || building.tags.building === "retail") {
    return shopIcon;
  }
  if (building.tags.building === "commercial" || building.tags.building === "office") {
    return commercialIcon;
  }
  if (building.tags.building === "residential" || building.tags.building === "apartments" || building.tags.building === "house") {
    return residentialIcon;
  }
  return defaultBuildingIcon;
}

function getCentroid(geometry: L.LatLngTuple[]): L.LatLngTuple {
  const latSum = geometry.reduce((sum, point) => sum + point[0], 0);
  const lonSum = geometry.reduce((sum, point) => sum + point[1], 0);
  return [latSum / geometry.length, lonSum / geometry.length];
}

export function BuildingLayer({ building }: BuildingLayerProps) {
  if (building.type === "node" && building.position) {
    return (
      <Marker position={building.position} icon={getBuildingIcon(building)}>
        <Popup>
          <div>
            <strong>{building.tags.name || "Building"}</strong>
            {building.tags.amenity && <div>Type: {building.tags.amenity}</div>}
            {building.tags.building && <div>Building: {building.tags.building}</div>}
          </div>
        </Popup>
      </Marker>
    );
  }

  if (building.type === "way" && building.geometry) {
    const centroid = getCentroid(building.geometry);

    return (
      <>
        <Polygon
          positions={building.geometry}
          pathOptions={{
            color: "#8B4513",
            fillColor: "#D2691E",
            weight: 1,
            opacity: 0.6,
            fillOpacity: 0.3,
          }}
        />
        <Marker position={centroid} icon={getBuildingIcon(building)}>
          <Popup>
            <div>
              <strong>{building.tags.name || "Building"}</strong>
              {building.tags.amenity && <div>Type: {building.tags.amenity}</div>}
              {building.tags.building && <div>Building: {building.tags.building}</div>}
            </div>
          </Popup>
        </Marker>
      </>
    );
  }

  return null;
}
