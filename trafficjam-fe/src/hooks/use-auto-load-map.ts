import { useQuery } from "@tanstack/react-query";
import type { CityConfig } from "../constants/cities";
import { api } from "../api/client";

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
    queryFn: () => api.fetchNetwork(cityBoundsToLngLatBounds(city.bounds)),
    staleTime: Infinity,
  });
}
