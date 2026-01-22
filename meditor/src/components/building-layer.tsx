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

const apartmentIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🏢%3C/text%3E%3C/svg%3E",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const hospitalIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23FF4444'/%3E%3Ctext x='12' y='17' font-size='14' text-anchor='middle' fill='white'%3E%E2%9C%9A%3C/text%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const clinicIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23FF6666'/%3E%3Ctext x='12' y='17' font-size='12' text-anchor='middle' fill='white'%3E%2B%3C/text%3E%3C/svg%3E",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const supermarketIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Crect x='2' y='2' width='20' height='20' rx='3' fill='%234CAF50'/%3E%3Ctext x='12' y='17' font-size='14' text-anchor='middle' fill='white'%3E%F0%9F%9B%92%3C/text%3E%3C/svg%3E",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const schoolIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Crect x='2' y='2' width='20' height='20' rx='3' fill='%232196F3'/%3E%3Ctext x='12' y='18' font-size='16' text-anchor='middle' fill='white'%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const kindergartenIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Crect x='2' y='2' width='20' height='20' rx='3' fill='%23FF9800'/%3E%3Ctext x='12' y='18' font-size='16' text-anchor='middle' fill='white'%3E%F0%9F%A7%B8%3C/text%3E%3C/svg%3E",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const beautyIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23E91E63'/%3E%3Ctext x='12' y='18' font-size='14' text-anchor='middle' fill='white'%3E%E2%9C%82%3C/text%3E%3C/svg%3E",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function getBuildingIcon(building: Building): Icon {
  if (building.tags.amenity === "hospital") {
    return hospitalIcon;
  }
  if (building.tags.amenity === "clinic" || building.tags.amenity === "doctors") {
    return clinicIcon;
  }
  if (building.tags.amenity === "supermarket") {
    return supermarketIcon;
  }
  if (building.tags.amenity === "school") {
    return schoolIcon;
  }
  if (building.tags.amenity === "kindergarten") {
    return kindergartenIcon;
  }
  if (building.tags.amenity === "hairdresser" || building.tags.amenity === "beauty_salon") {
    return beautyIcon;
  }
  if (building.tags.building === "apartments") {
    return apartmentIcon;
  }
  return residentialIcon;
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
            <strong>{building.tags.name || building.tags.amenity || "Point of Interest"}</strong>
            {building.tags.amenity && <div>Type: {building.tags.amenity}</div>}
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
            color: "#d3d3d3",
            fillColor: "#e8e8e8",
            weight: 0.5,
            opacity: 0.5,
            fillOpacity: 0.4,
          }}
        />
        <Marker position={centroid} icon={getBuildingIcon(building)}>
          <Popup>
            <div>
              <strong>{building.tags.name || building.tags.building || building.tags.amenity || "Building"}</strong>
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
