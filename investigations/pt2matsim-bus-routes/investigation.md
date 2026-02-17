# TRA-26: pt2matsim - Simulation of Bus Routes

## Frame the Problem

Right now, buses in our simulation are faked. When an agent picks "bus" as their mode, MATSim just teleports them in a straight line at 30 km/h from A to B. There are no actual routes, no stops, no schedules — just a beeline with a detour factor slapped on. That means we can't really say anything meaningful about how buses affect traffic, whether agents would actually choose to take the bus, or what happens when buses share road space with cars.

We already pull bus route data from OSM through the map-data-service (route paths, stop locations, names, operators — see `map-data-service/constants.py` `ROUTE_TAG_KEYS`). But OSM doesn't have any timing information at all. No departure times, no frequencies, nothing about when buses actually run.

What we're missing is **GTFS** (General Transit Feed Specification) data — that's the standardized format for transit schedules. And **pt2matsim** is a tool built specifically to take GTFS data and turn it into MATSim-compatible transit files.

---

### Why are we doing this work?

To stop faking bus behaviour and start simulating it properly. Buses should follow real Cork routes, stop at real stops, and run on a real timetable. Without this, the simulation can't produce realistic results about traffic in Cork.

### What outcome are we looking for?

We need to understand:
1. What pt2matsim actually is and how it works
2. What GTFS data looks like and where to get it for Cork
3. How we'd actually wire this into our simulation
4. Which approach makes sense given our timeline and skills

If we go ahead with implementation, we'd need to produce:
- `transitSchedule.xml` — the bus lines, routes, stops, and departure times
- `transitVehicles.xml` — bus vehicle definitions (capacity, size)
- An updated `network.xml` where bus routes are actually marked as bus-allowed

Plus config changes to tell MATSim to use real transit routing instead of teleportation.

---

## What is pt2matsim?

[pt2matsim](https://github.com/matsim-org/pt2matsim) is a Java tool from the MATSim org. It takes public transit data (GTFS, HAFAS, or OSM-based) and converts it into a MATSim transit schedule that's properly mapped onto the road network.

### How it works (three phases)

**Phase 1 — Generate the raw inputs:**

You run two things in parallel:

| Step | What it does | Input | Output |
|------|-------------|-------|--------|
| `Gtfs2TransitSchedule` | Converts GTFS into an **unmapped** MATSim schedule | GTFS folder + coordinate system + which day to use | `transitSchedule.xml` + `transitVehicles.xml` (stops have coordinates but aren't linked to the network yet) |
| `Osm2MultimodalNetwork` | Builds a MATSim network from OSM that includes bus-allowed links | OSM `.pbf` file | `network.xml` with `allowedModes` including `"bus"` on relevant links |

For the day selector you can pick a specific date like `"20260217"`, or use `"dayWithMostServices"` / `"dayWithMostTrips"` to automatically grab the busiest day.

**Phase 2 — Map the schedule onto the network** (`PublicTransitMapper`)

This is the hard part and the whole reason pt2matsim exists. It takes the unmapped schedule and the network and figures out:
1. Which network link each stop should be attached to
2. What sequence of links each bus route actually traverses (using a least-cost-path algorithm)
3. Whether any new links need to be added for stops that don't match existing roads

After this, every stop has a `linkRefId` and every route has a full link sequence. The schedule is now "mapped".

**Phase 3 — Sanity checks**

pt2matsim can validate the result and flag issues like routes that take weird detours, stops that ended up far from their assigned links, or routes with unrealistic speeds.

### Adding it to our project

We already have the MATSim Maven repo configured in `trafficjam-be/java/pom.xml`, so adding pt2matsim is just:

```xml
<dependency>
    <groupId>org.matsim</groupId>
    <artifactId>pt2matsim</artifactId>
    <version>26.1</version>
</dependency>
```

### The simpler alternative: GTFS2MATSim

There's also [GTFS2MATSim](https://github.com/matsim-org/GTFS2MATSim) from the MATSim Berlin team. It's a more lightweight converter that skips the fancy network mapping. Easier to use but the results won't be as accurate since it doesn't do the least-cost-path stop-to-link mapping that pt2matsim does.

---

## What is GTFS?

GTFS (General Transit Feed Specification) is basically Google's standardized format for describing public transit. It's a ZIP file full of CSVs that together describe every route, stop, trip, and timetable in a transit system.

### The important files

| File | What's in it | Why we care |
|------|-------------|-------------|
| `stops.txt` | Stop ID, name, lat/lon | Where buses stop — the physical locations |
| `routes.txt` | Route ID, name, type | Which routes exist (e.g. "220" Cork to Carrigaline) |
| `trips.txt` | Trip ID, route, service, direction | Each individual bus run |
| `stop_times.txt` | Arrival/departure time at each stop per trip | **This is the big one** — the actual timetable. This is what OSM doesn't have. |
| `calendar.txt` | Which days each service runs (Mon-Sun, date range) | Weekday vs weekend schedules |
| `calendar_dates.txt` | Exceptions to the regular calendar | Bank holidays, special days |
| `shapes.txt` | Route geometry as lat/lon points | The physical path — we already have this from OSM so this is redundant for us |
| `agency.txt` | Transit agency details | Bus Eireann, TFI Local Link, etc. |
| `frequencies.txt` (optional) | Headway-based service | Some feeds define "a bus every 15 min" instead of exact departure times |

### What GTFS gives us that OSM doesn't

| | OSM (what we have) | GTFS (what we need) |
|---|:---:|:---:|
| Route paths | Yes | Yes |
| Stop locations | Yes | Yes |
| Route names/operators | Yes | Yes |
| **Departure times** | No | **Yes** |
| **Arrival time at each stop** | No | **Yes** |
| **Weekday/weekend schedules** | No | **Yes** |
| **How often buses run** | No | **Yes** |

So basically we have the spatial side from OSM already. GTFS fills in the temporal side.

---

## Where to get GTFS data for Cork

### Transport for Ireland (TFI) / NTA

| What | Where |
|------|-------|
| GTFS downloads | https://www.transportforireland.ie/transitData/PT_Data.html |
| Developer portal (API keys) | https://developer.nationaltransport.ie/ |
| data.gov.ie | https://data.gov.ie/dataset?organization=national-transport-authority&theme=Transport |

The data is CC BY 4.0 (free, just attribute). You can download feeds for all operators combined or individually. **Bus Eireann** is the one we care about — they run the Cork city bus routes (220, 202, 205, 208, etc.).

### Things to watch out for

- The feed covers **all of Ireland**, not just Cork. We'd need to filter it down to our bounding box.
- We should check whether Cork routes have exact departure times in `stop_times.txt` or use `frequencies.txt` instead. Most Irish feeds seem to use exact times but worth confirming.
- The developer portal needs free registration. Static GTFS downloads might be available without it.
- Feeds get updated every few weeks as schedules change.

---

## How buses are set up right now

For context, here's what the current config does (`trafficjam-be/java/src/main/resources/config-template.xml`):

**Routing** (lines 138-143) — bus is just teleported:
```xml
<parameterset type="teleportedModeParameters">
    <param name="mode" value="bus" />
    <param name="teleportedModeSpeed" value="8.33" />  <!-- 30 km/h -->
    <param name="beelineDistanceFactor" value="1.5" />
</parameterset>
```

**Scoring** (lines 64-69):
```xml
<parameterset type="modeParams">
    <param name="mode" value="bus"/>
    <param name="constant" value="-2.0"/>
    <param name="marginalUtilityOfTraveling_util_hr" value="-6.0"/>
</parameterset>
```

**qsim** (line 106) — only car is on the network: `<param name="mainMode" value="car" />`

There's also a mismatch worth noting: the Python backend (`trafficjam-be/agents/transport_modes.py`) uses `TransportMode.PUBLIC_TRANSPORT = "pt"` but the config uses `"bus"`. That'll need to be sorted when we enable real transit.

---

## What would need to change in the config

To go from teleported buses to real transit, we'd need to:

### Add new modules

```xml
<module name="transit">
    <param name="useTransit" value="true" />
    <param name="transitScheduleFile" value="{{TRANSIT_SCHEDULE_FILE}}" />
    <param name="vehiclesFile" value="{{TRANSIT_VEHICLES_FILE}}" />
    <param name="transitModes" value="pt" />
</module>

<module name="transitRouter">
    <param name="searchRadius" value="1000.0" />
    <param name="extensionRadius" value="500.0" />
    <param name="maxBeelineWalkConnectionDistance" value="500.0" />
</module>
```

### Modify existing stuff

- **Remove** the bus teleported mode block from the routing module (lines 138-143). MATSim's transit router takes over.
- **Replace** the `"bus"` scoring params with `"pt"` to match MATSim's naming:
  ```xml
  <parameterset type="modeParams">
      <param name="mode" value="pt"/>
      <param name="constant" value="-2.0"/>
      <param name="marginalUtilityOfTraveling_util_hr" value="-6.0"/>
  </parameterset>
  ```
  And add `<param name="utilityOfLineSwitch" value="-1.0" />` so agents get penalized for transfers.
- **Update `ConfigGenerator.java`** to handle the new `{{TRANSIT_SCHEDULE_FILE}}` and `{{TRANSIT_VEHICLES_FILE}}` placeholders.
- **Update the network** — links that buses drive on need `allowedModes` to include `"bus"`. That means tweaking the network generation pipeline.

---

## What the MATSim transit files look like

Just for reference so we know what we're building towards.

### transitSchedule.xml

```xml
<transitSchedule>
    <transitStops>
        <stopFacility id="stop_001" x="571234.5" y="573456.7"
                       linkRefId="link_123" name="Patrick Street"/>
        <stopFacility id="stop_002" x="571300.0" y="573500.0"
                       linkRefId="link_456" name="Grand Parade"/>
    </transitStops>

    <transitLine id="route_220">
        <transitRoute id="route_220_outbound">
            <transportMode>bus</transportMode>
            <routeProfile>
                <stop refId="stop_001" departureOffset="00:00:00"/>
                <stop refId="stop_002" arrivalOffset="00:02:30"
                      departureOffset="00:03:00"/>
                <stop refId="stop_003" arrivalOffset="00:05:00"
                      departureOffset="00:05:30" awaitDeparture="true"/>
            </routeProfile>
            <route>
                <link refId="link_123"/>
                <link refId="link_124"/>
                <link refId="link_125"/>
                <link refId="link_456"/>
            </route>
            <departures>
                <departure id="dep_0700" departureTime="07:00:00"
                           vehicleRefId="bus_1"/>
                <departure id="dep_0720" departureTime="07:20:00"
                           vehicleRefId="bus_2"/>
            </departures>
        </transitRoute>
    </transitLine>
</transitSchedule>
```

### transitVehicles.xml

```xml
<vehicleDefinitions xmlns="http://www.matsim.org/files/dtd"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.matsim.org/files/dtd
    http://www.matsim.org/files/dtd/vehicleDefinitions_v1.0.xsd">

    <vehicleType id="city_bus">
        <description>Cork City Bus</description>
        <capacity>
            <seats persons="40"/>
            <standingRoom persons="20"/>
        </capacity>
        <length meter="12.0"/>
    </vehicleType>

    <vehicle id="bus_1" type="city_bus"/>
    <vehicle id="bus_2" type="city_bus"/>
</vehicleDefinitions>
```

---

## Assumptions / Knowns / Unknowns

### Knowns
- We already have bus route geometry and stop positions from OSM
- Bus Eireann runs the Cork city bus network
- TFI publishes GTFS data under CC BY 4.0
- Our MATSim Maven repo is already configured so adding pt2matsim is easy
- The Python backend already uses `"pt"` as the transport mode string
- MATSim supports real transit simulation via `useTransit=true` + schedule/vehicle files

### Assumptions
- The Bus Eireann GTFS feed covers all Cork city routes with enough detail
- The GTFS data uses exact departure times (not just headway-based frequencies)
- Our existing network has links along the roads buses actually use (since buses run on normal roads, this should be the case)
- MATSim 2024.0 supports the transit modules without needing extra contribs

### Unknowns
- Exact coverage of the TFI GTFS feed for Cork — need to download and check
- Whether the existing network links align well enough with bus routes, or if there'll be mapping issues
- Performance impact of running real transit vs teleportation (more expensive computationally)
- How much filtering/cleaning the GTFS data will need before it's usable

---

## Propose Solutions

### 1. Full pt2matsim (Java)

Go all-in with the standard pt2matsim pipeline: `Gtfs2TransitSchedule` + `Osm2MultimodalNetwork` + `PublicTransitMapper`.

**Pros:**
- The "proper" MATSim way, well-documented, community support
- Best accuracy for mapping routes to the network (least-cost-path algorithm)
- Built-in validation/plausibility checks
- Handles tricky edge cases (stops far from roads, complex paths)

**Cons:**
- `Osm2MultimodalNetwork` would generate a **completely different network** than our current Python/OSMnx pipeline. That's a big conflict — either we switch all network generation to pt2matsim, or we skip this step and lose some accuracy.
- Another Java dependency to learn and maintain
- More complex to set up and debug

**Effort:** ~2-3 weeks

### 2. Python-only

Read the GTFS with a Python library like `gtfs-kit` or `partridge`, filter to Cork, and generate the MATSim XML files ourselves using `lxml` or `xml.etree`.

**Pros:**
- We're more comfortable in Python
- Full control, can integrate with the existing backend and map-data-service
- Can cross-reference with the OSM route data we already have
- Quick to prototype

**Cons:**
- We'd have to do stop-to-link snapping ourselves (basically reimplementing a simpler version of what pt2matsim does)
- Need to figure out the route link sequences manually (shortest-path between consecutive stops)
- No built-in validation — we'd have to build that
- Risk of getting the MATSim XML format subtly wrong and spending time debugging

**Effort:** ~2-4 weeks, more risk of bugs

### 3. Hybrid (Python for preprocessing, Java for conversion)

Best of both worlds:
1. **Python** — download the GTFS feed, load it with `gtfs-kit`, filter to Cork and a representative weekday, clean it up
2. **Java** — use `Gtfs2TransitSchedule` to convert the cleaned GTFS into proper MATSim XML (in EPSG:2157)
3. **Python or Java** — snap stops to the existing network with a nearest-neighbour lookup
4. **Config** — update the template and `ConfigGenerator.java`

**Pros:**
- Data wrangling in Python where we're comfortable
- MATSim XML generation handled by a proven tool (no format errors)
- Keeps our existing network pipeline intact (no conflict with OSMnx)
- Least new Java code needed
- Can start simple and improve the mapping later

**Cons:**
- Two-language pipeline is a bit more to coordinate
- The stop-to-link mapping is simpler than what full pt2matsim does
- Might need to iterate on the snapping if stops don't line up well

**Effort:** ~1.5-2.5 weeks

---

## Recommendation

**Solution 3 — Hybrid approach.**

### Rationale

- **Avoids the network conflict.** The full pt2matsim approach (Solution 1) would want to regenerate our entire network, which clashes with our existing OSMnx pipeline. The hybrid keeps what we have and adds transit on top.
- **Plays to our strengths.** GTFS filtering and exploration is natural Python work. We already have the ecosystem set up.
- **Lets proven tools do the risky part.** `Gtfs2TransitSchedule` is battle-tested for producing correct MATSim XML. That's where format bugs are hardest to track down.
- **Good enough for MVP.** Even with simplified stop-snapping (nearest link instead of least-cost-path), buses following real routes on real schedules is a massive improvement over teleportation. We can refine later.
- **Clear upgrade path.** If we need better accuracy post-MVP, we can swap in the full pt2matsim `PublicTransitMapper` without redoing everything.

### Next steps

1. **Download the Bus Eireann GTFS feed** from TFI and check what's actually in it — do the Cork routes look right? Are there exact departure times?
2. **Filter in Python** — use `gtfs-kit` to isolate Cork routes and a single weekday
3. **Convert with Java** — add the pt2matsim dependency, run `Gtfs2TransitSchedule`
4. **Snap stops to the network** — nearest-link lookup for each stop coordinate
5. **Update the config** — add transit/transitRouter modules, remove bus teleportation, fix the `"bus"` vs `"pt"` mismatch
6. **Test it** — run the simulation, look for `TransitDriverStarts` and `VehicleArrivesAtFacility` events in the output to confirm buses are actually running on the network

---

## Sources

- [pt2matsim GitHub](https://github.com/matsim-org/pt2matsim)
- [pt2matsim Wiki](https://github.com/matsim-org/pt2matsim/wiki)
- [GTFS2MATSim GitHub](https://github.com/matsim-org/GTFS2MATSim)
- [MATSim Transit Tutorial](https://matsim.atlassian.net/wiki/spaces/MATPUB/pages/83099693/Transit+Tutorial)
- [Transport for Ireland GTFS Data](https://www.transportforireland.ie/transitData/PT_Data.html)
- [NTA Developer Portal](https://developer.nationaltransport.ie/)
- [GTFS Specification Reference](https://gtfs.org/schedule/reference/)
