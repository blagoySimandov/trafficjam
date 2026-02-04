//TODO: move this to where output parsing is done.
//This should not be the domain type/model.
//
/** MATSim events format version number */
export type MatsimVersion = number;

/** Timestamp in seconds from simulation start (e.g., 28800 = 8:00 AM if starting at midnight) */
export type SimulationTime = number;

/** Unique identifier for a person/agent in the simulation */
export type PersonId = string;

/** Unique identifier for a vehicle instance */
export type VehicleId = string;

/** Link ID referencing a network link from the network file */
export type LinkId = string;

/** Facility ID (e.g., building, transit stop, parking facility) */
export type FacilityId = string;

/** X coordinate in projected coordinate system (meters, e.g., UTM - NOT lat/lon) */
export type CoordinateX = number;

/** Y coordinate in projected coordinate system (meters, e.g., UTM - NOT lat/lon) */
export type CoordinateY = number;

/** Distance traveled in meters */
export type DistanceMeters = number;

/** Delay in seconds (positive = late, negative = early) */
export type DelaySeconds = number;

/**
 * Activity type defined per scenario.
 * Common values: "home", "work", "shopping", "leisure", "education"
 */
export type ActivityType = string;

/**
 * Transport mode for person trips.
 * Common values: "car", "pt" (public transit), "bike", "walk", "ride" (passenger)
 */
export type LegMode = string;

/**
 * Network routing mode - determines which network layer the vehicle uses.
 * Common values: "car", "bike", "truck", "pt"
 * Different from vehicle ID - this specifies routing rules and allowed links
 */
export type NetworkMode = string;

/**
 * Monetary amount in the simulation's currency units.
 * Negative = cost/expense, Positive = income/benefit
 */
export type MoneyAmount = number;

/**
 * Purpose of a money transaction.
 * Common values: "toll", "fare", "drtFare", "congestionCharge"
 */
export type MoneyPurpose = string;

/** Unique identifier for a transit line */
export type TransitLineId = string;

/** Unique identifier for a transit route within a line */
export type TransitRouteId = string;

/** Unique identifier for a specific transit departure */
export type DepartureId = string;

/** Unique identifier for a transit stop facility */
export type StopId = string;

export interface Root {
  version: MatsimVersion;
  event: Event[];
}

export interface BaseEvent {
  time: SimulationTime;
  type: EventType;
}

export type Event =
  | ActivityStartEvent
  | ActivityEndEvent
  | PersonDepartureEvent
  | PersonArrivalEvent
  | LinkEnterEvent
  | LinkLeaveEvent
  | PersonEntersVehicleEvent
  | PersonLeavesVehicleEvent
  | VehicleEntersTrafficEvent
  | VehicleLeavesTrafficEvent
  | PersonStuckEvent
  | PersonMoneyEvent
  | TransitDriverStartsEvent
  | VehicleArrivesAtFacilityEvent
  | VehicleDepartsAtFacilityEvent
  | AgentWaitingForPtEvent
  | TeleportationArrivalEvent;

export type EventType =
  | "actstart"
  | "actend"
  | "departure"
  | "arrival"
  | "entered link"
  | "left link"
  | "PersonEntersVehicle"
  | "PersonLeavesVehicle"
  | "VehicleEntersTraffic"
  | "VehicleLeavesTraffic"
  | "PersonStuckEvent"
  | "personMoney"
  | "TransitDriverStarts"
  | "VehicleArrivesAtFacility"
  | "VehicleDepartsAtFacility"
  | "waitingForPt"
  | "teleportation arrival";

export interface ActivityStartEvent extends BaseEvent {
  type: "actstart";
  person: PersonId;
  link: LinkId;
  actType: ActivityType;
  facility?: FacilityId;
  x?: CoordinateX;
  y?: CoordinateY;
}

export interface ActivityEndEvent extends BaseEvent {
  type: "actend";
  person: PersonId;
  link: LinkId;
  actType: ActivityType;
  facility?: FacilityId;
  x?: CoordinateX;
  y?: CoordinateY;
}

export interface PersonDepartureEvent extends BaseEvent {
  type: "departure";
  person: PersonId;
  link: LinkId;
  legMode: LegMode;
}

export interface PersonArrivalEvent extends BaseEvent {
  type: "arrival";
  person: PersonId;
  link: LinkId;
  legMode: LegMode;
}

export interface LinkEnterEvent extends BaseEvent {
  type: "entered link";
  vehicle: VehicleId;
  link: LinkId;
  driver?: PersonId;
}

export interface LinkLeaveEvent extends BaseEvent {
  type: "left link";
  vehicle: VehicleId;
  link: LinkId;
  driver?: PersonId;
}

export interface PersonEntersVehicleEvent extends BaseEvent {
  type: "PersonEntersVehicle";
  person: PersonId;
  vehicle: VehicleId;
}

export interface PersonLeavesVehicleEvent extends BaseEvent {
  type: "PersonLeavesVehicle";
  person: PersonId;
  vehicle: VehicleId;
}

export interface VehicleEntersTrafficEvent extends BaseEvent {
  type: "VehicleEntersTraffic";
  vehicle: VehicleId;
  link: LinkId;
  networkMode: NetworkMode;
  driver?: PersonId;
}

export interface VehicleLeavesTrafficEvent extends BaseEvent {
  type: "VehicleLeavesTraffic";
  vehicle: VehicleId;
  link: LinkId;
  networkMode: NetworkMode;
  driver?: PersonId;
}

export interface PersonStuckEvent extends BaseEvent {
  type: "PersonStuckEvent";
  person: PersonId;
  link: LinkId;
}

export interface PersonMoneyEvent extends BaseEvent {
  type: "personMoney";
  person: PersonId;
  amount: MoneyAmount;
  purpose: MoneyPurpose;
}

export interface TransitDriverStartsEvent extends BaseEvent {
  type: "TransitDriverStarts";
  driverId: PersonId;
  vehicleId: VehicleId;
  transitLineId: TransitLineId;
  transitRouteId: TransitRouteId;
  departureId: DepartureId;
}

export interface VehicleArrivesAtFacilityEvent extends BaseEvent {
  type: "VehicleArrivesAtFacility";
  vehicle: VehicleId;
  facility: FacilityId;
  delay?: DelaySeconds;
}

export interface VehicleDepartsAtFacilityEvent extends BaseEvent {
  type: "VehicleDepartsAtFacility";
  vehicle: VehicleId;
  facility: FacilityId;
  delay?: DelaySeconds;
}

export interface AgentWaitingForPtEvent extends BaseEvent {
  type: "waitingForPt";
  person: PersonId;
  atStop: StopId;
  destinationStop: StopId;
}

/**
 * WTF is teleportation?
 */
export interface TeleportationArrivalEvent extends BaseEvent {
  type: "teleportation arrival";
  person: PersonId;
  link: LinkId;
  distance: DistanceMeters;
}
