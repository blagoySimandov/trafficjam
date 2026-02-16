import { COLORS } from "./colors";

export const HIGHWAY_TYPES = [
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "service",
  "unclassified",
  "living_street",
  "pedestrian",
  "track",
  "cycleway",
  "footway",
  "path",
] as const;

export type HighwayType = (typeof HIGHWAY_TYPES)[number];

export const ROAD_STYLES: Record<
  string,
  {
    color: string;
    casingColor: string;
    baseWeight: number;
    zIndex: number;
    glow?: boolean;
  }
> = {
  motorway: {
    color: COLORS.motorwayRed,
    casingColor: COLORS.motorwayRedDark,
    baseWeight: 8,
    zIndex: 100,
    glow: true,
  },
  motorway_link: {
    color: COLORS.motorwayLinkRed,
    casingColor: COLORS.motorwayRedDark,
    baseWeight: 5,
    zIndex: 95,
  },
  trunk: {
    color: COLORS.trunkOrange,
    casingColor: COLORS.trunkOrangeDark,
    baseWeight: 7,
    zIndex: 90,
    glow: true,
  },
  trunk_link: {
    color: COLORS.trunkLinkOrange,
    casingColor: COLORS.trunkOrangeDark,
    baseWeight: 4,
    zIndex: 85,
  },
  primary: {
    color: COLORS.primaryYellow,
    casingColor: COLORS.primaryYellowDark,
    baseWeight: 6,
    zIndex: 80,
  },
  primary_link: {
    color: COLORS.primaryYellowLight,
    casingColor: COLORS.primaryYellowDark,
    baseWeight: 4,
    zIndex: 75,
  },
  secondary: {
    color: COLORS.secondaryGreen,
    casingColor: COLORS.secondaryGreenDark,
    baseWeight: 5,
    zIndex: 70,
  },
  secondary_link: {
    color: COLORS.secondaryGreenLight,
    casingColor: COLORS.secondaryGreenDark,
    baseWeight: 3,
    zIndex: 65,
  },
  tertiary: {
    color: COLORS.tertiaryBlue,
    casingColor: COLORS.tertiaryBlueDark,
    baseWeight: 4,
    zIndex: 60,
  },
  tertiary_link: {
    color: COLORS.tertiaryBlueLightV,
    casingColor: COLORS.tertiaryBlueDark,
    baseWeight: 3,
    zIndex: 55,
  },
  residential: {
    color: COLORS.residentialGray,
    casingColor: COLORS.residentialGrayDark,
    baseWeight: 3,
    zIndex: 40,
  },
  service: {
    color: COLORS.serviceGray,
    casingColor: COLORS.serviceGrayDark,
    baseWeight: 2,
    zIndex: 30,
  },
  unclassified: {
    color: COLORS.unclassifiedGray,
    casingColor: COLORS.serviceGrayDark,
    baseWeight: 3,
    zIndex: 35,
  },
};

export const DEFAULT_STYLE = {
  color: COLORS.defaultGray,
  casingColor: COLORS.defaultGrayDark,
  baseWeight: 2,
  zIndex: 20,
};

export const LANE_MULTIPLIER = 0.3;
