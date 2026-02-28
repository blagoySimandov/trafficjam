import { useQuery } from "@tanstack/react-query";
import type { CityConfig } from "../constants/cities";
import { fetchOSMData } from "../osm";

function cityBoundsToLngLatBounds(bounds: CityConfig["bounds"]) {
  return {
    getSouth: () => bounds.south,
    getWest: () => bounds.west,
    getNorth: () => bounds.north,
    getEast: () => bounds.east,
  };
}

export function useAutoLoadMap(city: CityConfig) {
  return useQuery({
    queryKey: ["network", city.id],
    queryFn: () => fetchOSMData(cityBoundsToLngLatBounds(city.bounds)),
    staleTime: Infinity,
  });
}
