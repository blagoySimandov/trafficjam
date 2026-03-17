/**
 * Activity type defined per scenario.
 * Common values: "home", "work", "shopping", "leisure", "education"
 */
export type ActivityType = string;

export interface Trip {
  id: string;
  path: [number, number][];
  timestamps: number[];
  activityType?: ActivityType;
}
