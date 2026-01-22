## MATSim Core Requirements

To run a traffic simulation, MATSim strictly requires the following input files:

### 1.1 Essential Inputs

| Input File | Purpose | Status | Issue |
| -- | -- | -- | -- |
| **network.xml** | Road network topology (nodes, links) with capacities, speeds, and lengths | ✓ Derivable from OSM | TRA-8 |
| **population.xml** | Synthetic population (agents/people who will travel) | ✗ Must be generated | [TRA-24](https://linear.app/traffic-jam/issue/TRA-24/matsim-input-creating-agent-plans-based-on-location)?  |
| **plans.xml** | Daily activity plans for each agent (where they go, when, by what mode) | ✗ Must be generated | [TRA-24](https://linear.app/traffic-jam/issue/TRA-24/matsim-input-creating-agent-plans-based-on-location) |
| **config.xml** | Simulation parameters and settings | ✓ User-defined | ? |

### 1.2 Optional But Important Inputs

| Input File | Purpose | Status | Issue |
| -- | -- | -- | -- |
| **vehicles.xml** | Vehicle fleet definitions (cars, trucks, buses with different characteristics) | ✗ Must be generated | [TRA-25](https://linear.app/traffic-jam/issue/TRA-25/investigation-get-the-sizes-and-capacity-for-different-vehicles) |
| **transitSchedule.xml** | Public transit routes and schedules | \~ Derivable from GTFS | [TRA-26](https://linear.app/traffic-jam/issue/TRA-26/investigation-pt2matsim-simulation-of-bus-routes) |
| **transitVehicles.xml** | Transit fleet (bus/train capacities) | \~ Derivable from GTFS | [TRA-26](https://linear.app/traffic-jam/issue/TRA-26/investigation-pt2matsim-simulation-of-bus-routes) |
| **facilities.xml** | Activity locations (workplaces, shops, schools) | ✗ Must be generated | ?  |

---

## 2\. What Can Be Derived from OpenStreetMap

This is explored in depth in TRA-08 (OSM Utilization)

### 2.1 Network Geometry & Topology

**Available from OSM:**

* Road network structure (intersections, street segments)
* Road classifications (motorway, primary, residential, etc.)
* Geographic coordinates (latitude/longitude)
* Some speed limits (where tagged)
* Some lane counts (where tagged)
* One-way restrictions
* Turn restrictions

---

## 3\. What Must Be Synthetically Generated

### 3.1 Population (Agents) ✗

**The Challenge:** OSM does not contain information about people, their homes, workplaces, or travel patterns.

**What We Need:**

* Number of agents (scaled population)
* Home locations
* Workplace locations
* Demographics (age, employment status)

**Available Public Data Sources:**

* Census data (population counts by area)
* OpenStreetMap building footprints (potential home/work locations)
* Points of Interest (POI) data for activity locations
* Employment statistics (where jobs are concentrated)

**Generation Approach:**

1. Use census data to determine how many agents to create per zone
2. Use OSM buildings to randomly assign home locations
3. Use employment data + OSM POIs to assign workplaces
4. Apply demographic distributions from census

**Limitations:**

* No real individual-level data
* Home-work assignments are synthetic (not actual commute patterns)
* Must assume generic demographic distributions

### 3.2 Activity Plans

**The Challenge:** We don't know when people travel, where they go, or what activities they perform.

**What We Need for Each Agent:**

* Daily activity chain (e.g., home → work → shop → home)
* Activity start/end times
* Mode choice (car, bus, bike, walk)
* Activity locations

**Available Public Data:**

* National travel surveys (average trip rates, timing patterns)
* Census journey-to-work data (commute mode shares)
* Activity-based model literature (typical schedules)

```
<!-- Example synthetic plan -->
<person id="person_1">
  <plan selected="yes">
    <activity type="home" x="123.4" y="567.8" end_time="08:00:00"/>
    <leg mode="car">
      <route>...</route>
    </leg>
    <activity type="work" x="234.5" y="678.9" end_time="17:00:00"/>
    <leg mode="car">
      <route>...</route>
    </leg>
    <activity type="home" x="123.4" y="567.8"/>
  </plan>
</person>
```

**Typical Assumptions:**

* Work activities: 8-9 AM start, 5-6 PM end
* Shopping trips: midday or evening
* Trip purposes based on national survey averages
* Mode choice based on census data

**Limitations:**

* Generic schedules, not real behavioral data
* No individual preferences or constraints
* Simplified activity patterns (reality is more complex)

### 3.3 Vehicle Fleet

**What We Need:**

* Vehicle types (car, truck, bus)
* Vehicle characteristics (PCU equivalents, max speed)
* Fleet composition (% cars vs trucks)

**Generation Approach:** Based on national vehicle registration statistics and fleet composition data.

```
<vehicleType id="car">
  <capacity seats="5"/>
  <length meter="7.5"/>
  <width meter="1.0"/>
  <maximumVelocity meterPerSecond="40.0"/>
  <passengerCarEquivalents pce="1.0"/>
</vehicleType>
```

---

## 4\. Public Transit: The pt2matsim Solution

[TRA-26](https://linear.app/traffic-jam/issue/TRA-26/investigation-pt2matsim-simulation-of-bus-routes)

---

## 5\.  Workflow

### Phase 1: Network Creation - COMPLETE

```
# Using OSMnx to download and process Cork road network
import osmnx as ox
G = ox.graph_from_place("Cork City, Ireland", network_type="drive")
# Convert to MATSim network.xml with realistic attributes
```

**Output:** `cork_network.xml` with \~1,500 nodes and \~3,000 links 

(Find this in TRA-08 OSM-utilization)

### Phase 2: Population & Demand Generation - NEXT STEP

```
# Synthetic population generator needed:
# 1. Use Cork census data for population counts
# 2. Use OSM buildings for home locations
# 3. Use OSM POIs for work/shop locations
# 4. Generate daily activity plans
# 5. Assign vehicles and modes
```

**Output:**

* `population.xml` (e.g., 10,000 agents representing Cork's population)
* `plans.xml` (daily schedules for each agent)
* `vehicles.xml` (fleet definitions)

**Key Decisions:**

* **Activity types:** Home, work, shopping, leisure
* **Mode split:** 80% car, 15% bus, 5% other (calibrated to census)

### Phase 3: Optional Public Transit Integration

```
IF modeling mode choice and public transit:
  1. Download Transport for Ireland GTFS
  2. Run pt2matsim (Java)
  3. Get transitSchedule.xml + transitVehicles.xml
ELSE:
  Model buses as regular vehicles in traffic
```

### Phase 4: Configuration & Execution in MATSim

```
<!-- config.xml -->
<config>
  <network>
    <inputNetworkFile>cork_network.xml</inputNetworkFile>
  </network>
  <plans>
    <inputPlansFile>population.xml</inputPlansFile>
  </plans>
  <vehicles>
    <vehiclesFile>vehicles.xml</vehiclesFile>
  </vehicles>
</config>
```

### Phase 5: Analysis & Iteration

* Run simulation
* Analyze link volumes, travel times, congestion
* Compare to any available validation data
* Iterate on demand generation if needed