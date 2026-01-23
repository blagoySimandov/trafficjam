export const COLORS = {
  // Reds
  motorwayRed: "#ff6b6b",
  motorwayRedDark: "#c92a2a",
  motorwayLinkRed: "#ff8787",

  // Oranges
  trunkOrange: "#ffa94d",
  trunkOrangeDark: "#d9480f",
  trunkLinkOrange: "#ffc078",

  // Yellows
  primaryYellow: "#ffd43b",
  primaryYellowLight: "#ffe066",
  primaryYellowDark: "#f59f00",

  // Greens
  secondaryGreen: "#69db7c",
  secondaryGreenLight: "#8ce99a",
  secondaryGreenDark: "#2f9e44",

  // Blues
  tertiaryBlue: "#74c0fc",
  tertiaryBlueLightV: "#a5d8ff",
  tertiaryBlueDark: "#1971c2",

  // Grays
  residentialGray: "#e9ecef",
  residentialGrayDark: "#868e96",
  serviceGray: "#dee2e6",
  serviceGrayDark: "#adb5bd",
  unclassifiedGray: "#f8f9fa",
  defaultGray: "#ced4da",
  defaultGrayDark: "#868e96",
} as const;

export const TRANSPORT_COLORS: Record<string, string> = {
  subway: "#0066cc",
  tram: "#cc6600",
  bus: "#cc0000",
  train: "#009933",
  light_rail: "#9933cc",
};

export const DEFAULT_TRANSPORT_COLOR = "#666666";
