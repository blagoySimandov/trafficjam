# MATSim Investigation

## Quick Reference: How MATSim Handles Our Requirements

### 1. Interactive Simulation Engine

| Requirement | MATSim Support |
|-------------|----------------|
| Real-time visualization | **OTFVis** (live mobsim viewer) or **Via** (post-analysis) |
| Play/pause/speed controls | OTFVis supports this during live simulation |
| Modify network topology | Via **Network Change Events** - modify freespeed, lanes, capacity at specific times |
| Traffic signals | **Signals & Lanes contrib** - fixed-time or adaptive control |
| Speed limits | Set per-link via `freespeed` attribute |
| Lane modeling | Basic: aggregated into capacity. Detailed: Signals & Lanes contrib |
| Add bridges/intersections | Requires network file modification (not runtime) |

**Limitation:** Network topology changes (adding/removing links) require file edits, not live modification.

---

### 2. Intelligent Bots (Agents)

| Requirement | MATSim Support |
|-------------|----------------|
| Navigate road network | Built-in - agents follow computed routes |
| Learn from experience | Co-evolutionary algorithm - agents store/score multiple plans |
| Interact with other vehicles | Queue model handles congestion; agents compete for road space |
| Different vehicle types | Fully configurable (cars, buses, bikes, trucks) |
| Expandable behavior | Replanning modules: route, time, mode, destination choice |

**Key insight:** Agents don't make real-time decisions. They execute pre-computed plans, then learn across iterations. For reactive behavior, use the **Within-Day Replanning** contrib.

---

### 3. Different Views (Micro/Macro)

| View Level | Tool | What You See |
|------------|------|--------------|
| Microscopic | OTFVis | Individual vehicles moving in real-time |
| Mesoscopic | Via | Agent trajectories, link loads over time |
| Macroscopic | SimWrapper | Aggregated dashboards, flow maps, statistics |
| Analysis | Events file | Raw event stream for custom analysis |

**Output flexibility:** MATSim generates detailed events (vehicle enters link, departs, etc.) that can be aggregated to any level.

---

## Detailed Documentation

### What is MATSim?

1. MATSim simulates traffic by tracking every individual vehicle separately, showing how they all move through the network and where traffic jams form.

2. MATSim follows each simulated person individually through their entire day, tracking what activities they do and what travel choices they make. This approach is now commonly called "agent-based" modeling because each person acts as an independent decision-maker.

3. MATSim can efficiently simulate 10 million or more individual travelers at once, borrowing techniques from physics simulations that handle huge numbers of particles.

4. MATSim finds the best possible outcome for all travelers by having them repeatedly adjust their plans while competing with each other for road space and time slots. Over many iterations, the system settles into a stable state where no individual can improve their situation by changing their plan alone, similar to how different species in nature adapt alongside each other.

---

### Why Multi-Agent?

An agent is a single person represented on the map, each different one having their own plan for the day (go from A to B then to C, use these roads and so on).

Each agent also has a **memory** that stores multiple alternative plans, each with a score representing how good that plan turned out to be. Over many iterations, agents try different plans (different departure times, routes, modes) and learn which ones work best given what everyone else is doing.

---

### How to Configure Agents

The population can be configured by the config files like `population.xml` and allows us to set the whole plan for every single agent.

```xml
<person id="1">
  <plan>
    <act type="home" x="5.0" y="8.0" end_time="08:00:00" />
    <leg mode="car" />
    <act type="work" x="1500.0" y="890.0" end_time="17:30:00" />
    <leg mode="car" />
    <act type="home" x="5.0" y="8.0" />
  </plan>
</person>
We need to write the config for the agents ourself if we want to be more specific when dealing with different cities. (there are some defaults for cities like Berlin)
Will need some converter from public data to the format above or a way to just generate general data for most cities.
```

MATSim will take care of:

| What | How |
|------|-----|
| Link assignment | Finds nearest network link to each activity coordinate |
| Routes | Computes shortest/fastest path for each leg |
| Scores | Calculated after each simulation iteration |
| Alternative plans | Generated through replanning mutations |

---

### Why Choose a Meso/Macro Simulation?

This allows us to see the traffic as a whole block, a flow of cars all with the intention of eventually getting somewhere and all equally contributing to the traffic and treating each road as a simple FIFO queue. By not focusing on every single car (agent) and its decision, we make it less computationally intense.

---

### What About Roads with Multiple Lanes?

All roads, no matter the amount of lanes, are treated as queues for the sake of efficiency and simplicity of displaying the important information like congestion, delays, capacity limits (the amount of cars that can fit on that road).
Each direction for a single road is treated as a different queue.
So a road with one lane in each direction with be simply represented like :
  link1 A-B(permlanes=1)
  link2 B-A(permlanes=1)

#### Is a Queue Per Lane Worth It?

Every road (link) has the following:

```xml
<link id="1" from="1" to="2" 
      length="3000.00" 
      capacity="3600" 
      freespeed="27.78" 
      permlanes="2"
      modes="car" />
```

The `permlanes="2"` (amount of lanes) affects two key parameters:

**1. Storage Capacity** (how many vehicles can fit on the link)
- Calculated roughly as: `(length × number_of_lanes) / average_vehicle_spacing`
- A 2-lane road stores roughly twice as many vehicles as a 1-lane road of the same length

**2. Flow Capacity** (how many vehicles can exit per hour)
- The `capacity="3600"` attribute specifies vehicles/hour
- It has to be manually calculated by the converter (from OSM to input for MATSim)

Rule of thumb (adjustable):

| OSM highway type | Typical freespeed | Typical capacity | Typical lanes |
|------------------|-------------------|------------------|---------------|
| `motorway` | 33.33 m/s (120 km/h) | 2000/lane | 2-3 |
| `primary` | 22.22 m/s (80 km/h) | 1500/lane | 1-2 
| `residential` | 8.33 m/s (30 km/h) | 600/lane | 1 |

So a 2-lane motorway might get `capacity="4000"`.

By simply using a single queue instead, we can still see the flow of the traffic and change its capacity and number of lanes in cases where there is road work and one lane has to close or the opposite where we might try to add more lanes for a big enough road. 

---

### Vehicle Types and PCU (Passenger Car Equivalents)

Different vehicles take different amounts of space and can carry different amounts of people (bus vs car).

The sim allows us to define vehicle types:

```xml
<vehicleType id="car">
    <passengerCarEquivalents pce="1.0" />
</vehicleType>
<vehicleType id="bicycle">
    <passengerCarEquivalents pce="0.25" />
</vehicleType>
<vehicleType id="bus">
    <passengerCarEquivalents pce="3.0" />
</vehicleType>
```

A bus with PCE=3.0 takes up 3x the storage capacity of a car. This affects how many vehicles can fit on a link, even though they're all in the same queue.

#### How Configurable Are the Vehicles?

Very configurable. The sim allows us to represent different scenarios like buses, trains and possibly car pooling, by just changing the capacity (standing and seating capacity). It also gives us the chance to see what happens when boarding (access) time for a vehicle changes.

#### Carpooling
[Currently ignored for the sake of simplicity]

In standard MATSim, a "car" mode means one person drives their own car. For carpooling/ride-sharing, you need:
- The **DRT (Demand Responsive Transport) contrib**, or
- The **ride** mode with custom configuration

#### Reusing Vehicle Types

Define a type and reuse it:

```xml
<!-- Define type once -->
<vehicleType id="city_bus">
    <capacity><seats persons="40"/><standingRoom persons="60"/></capacity>
    <length meter="12.0"/>
    <passengerCarEquivalents pce="2.5"/>
</vehicleType>

<!-- Create many vehicles of that type -->
<vehicle id="bus_101" type="city_bus"/>
<vehicle id="bus_102" type="city_bus"/>
<vehicle id="bus_103" type="city_bus"/>
```

---

### Signals and Lane Modeling (Optional Extension)

#### What It Does

Provides **microscopic traffic signal simulation**.

**Signals (Traffic Lights):**
- Individual traffic lights at intersections
- Signal timing plans (green/red phases)
- Cycle times and offsets
- Signal groups (lights that change together)
- Amber times and intergreen times (optional)

**Lanes:**
- Turning lanes at intersections (left-turn lane, right-turn lane, through lane)
- Lane-specific signal control (e.g., green arrow for left turn only)
- Lane capacity and length

#### When to Use It

The module makes sense when:
- You're studying a specific intersection or corridor
- You want to optimize signal timings
- You're evaluating adaptive signal control strategies
- You need to model turn restrictions accurately
- Your research question specifically involves traffic signals

#### Cons

1. **Data Requirements are Large** (often not publicly available)
2. **Computational Cost**
3. **Often Unnecessary for Large-Scale Studies**
   - For regional/city-wide transport planning, aggregate traffic patterns matter more than individual intersection timing
   - Signal delays are implicitly captured in travel time observations used for calibration
   - The basic queue model already captures congestion effects
