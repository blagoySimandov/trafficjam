# TRA-08: OSM (OpenStreetMap) Network Data Utilization

## Overview

**Objective:** Investigate the feasibility and capabilities of using OpenStreetMap (OSM) for obtaining network data for traffic simulation.

**Key Questions:**
- What data does OSM provide?
- How detailed is the network map?
- What road attributes are available (speed limits, traffic lights, stop signs, etc.)?
- Can we use OSM to save and export modified networks?

## Investigation

### 1. OSM Data Capabilities

OpenStreetMap provides comprehensive real-world network data that is well-suited for traffic simulation projects. The platform offers:

- **Road network topology** (intersections, road segments, connectivity)
- **Road attributes** including:
  - Road types (motorway, primary, secondary, residential, etc.)
  - Speed limits (where available)
  - Number of lanes (partial coverage)
  - One-way street information
  - Surface type
  - Access restrictions
- **Limited traffic control data**:
  - Traffic lights and stop signs (coverage varies by region)
  - Turn restrictions
  
**Data Quality Notes:**
- Coverage and detail vary significantly by geographic region
- Urban areas typically have more complete data than rural areas
- Some attributes (especially lane counts) are frequently missing and require imputation

---

### 2. Technical Implementation

#### Pipeline

```
OSM Data → OSMnx → NetworkX → MatSim
```

#### 2.1 OSMnx Library

[OSMnx](https://github.com/gboeing/osmnx) is a Python library that simplifies interaction with OSM data:

**Key Features:**
- Retrieves street networks via **Overpass API**
- Converts geographic data to NetworkX graphs
- Imputes missing speed limits based on road type
- Handles graph topology and attributes
- Supports various coordinate reference systems

**Graph Representation:**
- **Nodes:** Represent intersections
- **Edges:** Represent road segments (streets)
- **Graph Type:** `networkx.MultiDiGraph`
  - **Directed:** Supports one-way streets
  - **Multi:** Supports parallel edges (e.g., two one-way roads)

**Documentation:** https://networkx.org/documentation/stable/auto_examples/geospatial/plot_osmnx.html

#### 2.2 NetworkX Integration

NetworkX provides the graph data structure for network manipulation and analysis:
- Standard graph algorithms (shortest path, centrality, etc.)
- Easy modification of nodes and edges
- Export capabilities to various formats

**Visualization Support:**
- [Via](https://www.simunto.com/via/) the official MATSim result data simulator
- Consider [QGIS](https://qgis.org/) for geographic visualization and validation

---

### 3. MatSim Conversion

MatSim requires network data in a specific XML format. The conversion process involves several challenges and considerations.

#### 3.1 MatSim Network Format

MatSim uses an XML structure with two main elements:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE network SYSTEM "http://www.matsim.org/files/dtd/network_v2.dtd">
<network>
    <nodes>
        <node id="1" x="longitude" y="latitude"/>
    </nodes>
    <links>
        <link id="1" from="node1" to="node2" length="100.0" 
              freespeed="13.89" capacity="2000" permlanes="2"/>
    </links>
</network>
```

#### 3.2 Required Attributes Mapping

| MatSim Attribute | Description | Unit | OSM/OSMnx Equivalent |
|-----------------|-------------|------|---------------------|
| `id` | Unique link identifier | - | Edge tuple (u, v, key) |
| `from` | Origin node ID | - | u (source node) |
| `to` | Destination node ID | - | v (target node) |
| `length` | Link length | meters | `length` attribute |
| `freespeed` | Free-flow speed | m/s | `maxspeed` (convert from km/h) |
| `capacity` | Hourly capacity | vehicles/hour | Calculated from lanes + road type |
| `permlanes` | Number of lanes | - | `lanes` attribute (often missing) |

#### 3.3 Conversion Challenges

**Challenge 1: Speed Unit Conversion**

OSMnx stores speeds in km/h, MatSim requires m/s:

```python
# Convert km/h to m/s
speed_ms = speed_kmh / 3.6
```

**Challenge 2: Missing Lane Data**

OSM frequently lacks lane information. Default assumptions must be established:

- **Motorway:** 2-3 lanes
- **Primary/Secondary:** 1-2 lanes  
- **Residential:** 1 lane

**Challenge 3: Capacity Calculation**

MatSim requires hourly capacity per link:

```python
# Standard capacity calculation
capacity_per_lane = 2000  # vehicles/hour (urban roads)
capacity = num_lanes * capacity_per_lane

# Motorways use higher values
motorway_capacity_per_lane = 2400  # vehicles/hour
```

**Challenge 4: Coordinate Systems**

- OSMnx graphs use WGS84 (EPSG:4326) by default
- MatSim typically uses projected coordinates (meters)
- May require coordinate reprojection for accurate distance calculations

---

### 4. Conversion Approaches

#### 4.1 Option 1: pt2matsim (Java-based)

[pt2matsim](https://github.com/matsim-org/pt2matsim) is a purpose-built tool for converting OSM to MatSim format.

**Pros:**
- Purpose-built for MatSim workflows
- Handles public transit networks
- Well-documented capacity and speed defaults
- Battle-tested in production use

**Cons:**
- Java-based
- Less flexible for custom graph modifications
- Bypasses NetworkX workflow

**Use Case:** Best for final conversion to MatSim format after modifications are complete.

#### 4.2 Option 2: Custom Python Conversion

Develop custom Python scripts to export NetworkX graphs to MatSim XML.

**Pros:**
- Full control over conversion logic
- Seamless integration with OSMnx/NetworkX workflow
- Allows custom attribute handling

**Cons:**
- Requires manual implementation
- Need to handle edge cases
- Must maintain conversion code

**Use Case:** Best when network modifications in NetworkX are frequent or complex.

#### 4.3 Implementation Note

A custom Python conversion script has been developed (see `network_builder.py` and example output `cork_network.xml`). This approach provides maximum flexibility for the modification workflow.

---


## Findings & Recommendations

### Key Findings

1. **OSM is viable for this project** - provides real-world network topology and essential road attributes
2. **Data quality varies** - urban areas have better coverage; lane data often requires imputation
3. **OSMnx simplifies data acquisition** - handles API calls, graph creation, and basic attribute imputation
4. **MatSim conversion is manageable** - either through pt2matsim or custom Python scripts
5. **Network modification is feasible** - NetworkX provides robust graph manipulation capabilities

### Possible Approach

```
OSM → OSMnx → NetworkX (modifications) → Custom Python Script → MatSim XML
```

This pipeline allows:
- Easy data acquisition from OSM
- Flexible network modifications in NetworkX
- Clean conversion to MatSim format

## Next Steps

1. **Enable Network Modifications**
   - Implement functionality to add new roads
   - Support changing speed limits
   - Allow modification of lane counts and direction
   - Validate modified networks before export

2. **Public Transit Integration (TRA-12)**
   - Investigate pt2matsim for bus route generation
   - Explore dynamic route creation
   - Determine if Java dependency can be avoided
   - Link with TRA-12 investigation

3. **Population & Demand Generation**
   - Create synthetic population compatible with MatSim
   - Generate realistic vehicle demand patterns
   - Consider population distribution and trip patterns

4. **Validation & Testing**
   - Test conversion pipeline with multiple cities
   - Validate attribute imputation accuracy
   - Compare results with known network characteristics

## References

- OSMnx Documentation: https://osmnx.readthedocs.io/
- NetworkX Geospatial Examples: https://networkx.org/documentation/stable/auto_examples/geospatial/plot_osmnx.html
- MatSim Network Format: http://www.matsim.org/files/dtd/network_v2.dtd
- QGIS: https://qgis.org/
- pt2matsim: https://github.com/matsim-org/pt2matsim

## Attachments

- `network_builder.py` - Custom conversion script
- `cork_network.xml` - Example MatSim network output