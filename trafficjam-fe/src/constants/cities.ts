export interface CityConfig {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
  bounds: { south: number; west: number; north: number; east: number };
}

export const CORK: CityConfig = {
  id: "cork",
  name: "Cork",
  center: [-8.47, 51.9],
  zoom: 15,
  bounds: { south: 51.85, west: -8.55, north: 51.95, east: -8.38 },
};

export const DUBLIN: CityConfig = {
  id: "dublin",
  name: "Dublin",
  center: [-6.26, 53.35],
  zoom: 14,
  bounds: { south: 53.28, west: -6.42, north: 53.42, east: -6.1 },
};

export const CITIES: CityConfig[] = [CORK, DUBLIN];

export const DEFAULT_CITY = CORK;
