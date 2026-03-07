export type MatsimMode = "car" | "pt" | "bike" | "walk";

export interface ModeUser {
  main_mode: MatsimMode;
  user: number;
}

export interface TripStat {
  [key: string]: string | number;
}

export interface PopulationTripStat {
  [key: string]: string | number;
}

export interface LegHistogramRow {
  time: number;
  departures_all: number;
  arrivals_all: number;
  en_route_all: number;
  departures_car: number;
  arrivals_car: number;
  en_route_car: number;
}

export interface ModeShareByDistance {
  distanceBin: string;
  car: number;
  walk: number;
  bike: number;
  pt: number;
}

export interface ScoreStatRow {
  ITERATION: number;
  avg_executed: number;
  avg_worst: number;
  avg_best: number;
}
