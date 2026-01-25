"""
OSMnx to MATSim Network Converter

This script downloads street network data from OpenStreetMap using OSMnx,
processes it, and exports it to MATSim-compatible XML format.

Dependencies:
    - networkx
    - osmnx
    - xml.etree.ElementTree (standard library)
"""

import networkx as nx
import osmnx as ox
import xml.etree.ElementTree as ET
import os

# ============================================================================
# CONFIGURATION
# ============================================================================

PLACE_NAME = "Cork City, Cork, Ireland"
NETWORK_TYPE = "drive"  # Options: 'drive', 'walk', 'bike', 'all'
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "cork_network.xml")
CRS_EPSG = "EPSG:2157"  # Irish Transverse Mercator projection


# ============================================================================
# NETWORK DATA ACQUISITION (OSM)
# ============================================================================

print(f"OSMnx version: {ox.__version__}")

# Download street network from OpenStreetMap
# graph_from_place() returns a pre-simplified graph by default
print(f"Downloading network data for {PLACE_NAME}...")
G = ox.graph.graph_from_place(PLACE_NAME, network_type=NETWORK_TYPE)

# Project graph to a planar coordinate system for accurate distance calculations
G = ox.project_graph(G)


# ============================================================================
# DATA QUALITY CHECK & IMPUTATION
# ============================================================================

# Check for edges missing speed data
missing_speeds = sum(1 for u, v, d in G.edges(data=True) if 'maxspeed' not in d)
print(f"Edges missing speed data: {missing_speeds}/{G.number_of_edges()}")

# OSMnx fills gaps in OSM data by imputing edge speeds based on road type
# This uses defaults from OSM wiki for different highway classifications
print("Imputing missing edge speeds and travel times...")
G = ox.add_edge_speeds(G)
G = ox.add_edge_travel_times(G)


# ============================================================================
# OPTIONAL: EXPORT TO SHAPEFILES FOR QGIS VISUALIZATION
# ============================================================================

# Uncomment to export shapefiles for visualization/debugging in QGIS
# print("Exporting to shapefiles...")
# nodes, edges = ox.graph_to_gdfs(G)
# nodes.to_file("nodes.shp")
# edges.to_file("edges.shp")

# ============================================================================
# OPTIONAL: Uncomment to plot the network
# fig, ax = ox.plot.plot_graph(G)


# ============================================================================
# INSPECT EDGE DATA STRUCTURE
# ============================================================================

# Print sample edge data to understand available attributes
u, v, key, edge_data = next(iter(G.edges(keys=True, data=True)))
print("\nSample edge data:")
print(edge_data)


# ============================================================================
# HELPER FUNCTIONS FOR MATSIM ATTRIBUTES
# ============================================================================

def get_lanes(edge_data):
    """
    Extract or estimate number of lanes from edge data.
    
    First attempts to read the 'lanes' attribute from OSM data.
    If unavailable, estimates based on highway classification.
    
    Args:
        edge_data (dict): Edge attributes from OSMnx graph
        
    Returns:
        int: Number of lanes (default: 1)
    """
    # Try to get from OSM data
    if 'lanes' in edge_data:
        try:
            return int(edge_data['lanes'])
        except (ValueError, TypeError):
            pass
    
    # Estimate based on highway type
    highway = edge_data.get('highway', 'residential')
    
    # Handle list-valued OSM tags (take first value)
    if isinstance(highway, list):
        highway = highway[0]
    
    # Default lane counts by road classification
    lane_defaults = {
        'motorway': 3,
        'motorway_link': 1,
        'trunk': 2,
        'primary': 2,
        'secondary': 1,
        'tertiary': 1,
        'residential': 1,
        'service': 1,
        'unclassified': 1
    }
    
    return lane_defaults.get(highway, 1)


def calculate_capacity(edge_data, lanes):
    """
    Calculate hourly capacity based on road type and number of lanes.
    
    Uses Highway Capacity Manual guidelines adjusted for European contexts.
    
    Args:
        edge_data (dict): Edge attributes from OSMnx graph
        lanes (int): Number of lanes
        
    Returns:
        int: Hourly capacity in vehicles per hour
    """
    highway = edge_data.get("highway", "residential")
    
    # Handle list-valued OSM tags
    if isinstance(highway, list):
        highway = highway[0]
    
    # Capacity per lane per hour (vehicles/hour)
    # Based on typical capacities for different road types
    capacity_per_lane = {
        'motorway': 2400,
        'motorway_link': 1800,
        'trunk': 2000,
        'primary': 1800,
        'secondary': 1800,
        'tertiary': 1200,
        'residential': 1000,
        'service': 800,
        'unclassified': 1200
    }
    
    base_capacity = capacity_per_lane.get(highway, 1200)
    return int(base_capacity * lanes)


def get_freespeed(edge_data):
    """
    Extract free-flow speed from edge data and convert to m/s.
    
    IMPORTANT: MATSim requires speeds in meters per second.
    
    Args:
        edge_data (dict): Edge attributes from OSMnx graph

    Returns:
        float: Free-flow speed in meters per second
    """
    speed = edge_data.get("speed_kph", 50)
    
    # Handle list-valued OSM tags
    if isinstance(speed, list):
        speed = speed[0]
    
    # Ensure numeric value
    try:
        speed = float(speed)
    except (ValueError, TypeError):
        speed = 50.0
    
    # Convert km/h to m/s
    return speed / 3.6


# ============================================================================
# MATSIM NETWORK EXPORT FUNCTION
# ============================================================================

def networkx_to_matsim(G, output_file):
    """
    Convert a NetworkX graph to MATSim network XML format.
    
    Creates a MATSim-compatible network file with nodes and links,
    including realistic capacity and speed attributes.
    
    Args:
        G (networkx.MultiDiGraph): NetworkX graph from OSMnx
        output_file (str): Path to output XML file
    """
    # Create XML root element
    root = ET.Element("network", name="cork-network")
    
    # Add coordinate reference system metadata
    attrs = ET.SubElement(root, "attributes")
    crs = ET.SubElement(attrs, "attribute", {
        "name": "coordinateReferenceSystem",
        "class": "java.lang.String"
    })
    crs.text = CRS_EPSG
    
    # Add nodes section
    print("Converting nodes...")
    nodes_elem = ET.SubElement(root, "nodes")
    for node_id, data in G.nodes(data=True):
        ET.SubElement(nodes_elem, "node", {
            "id": str(node_id),
            "x": str(data["x"]),
            "y": str(data["y"])
        })
    
    # Add links section with calculated attributes
    print("Converting links...")
    links_elem = ET.SubElement(root, "links")
    for u, v, key, data in G.edges(keys=True, data=True):
        # Calculate link attributes
        lanes = get_lanes(data)
        capacity = calculate_capacity(data, lanes)
        freespeed = get_freespeed(data)
        length = data.get('length', 100)
        
        # Create link element
        ET.SubElement(links_elem, "link", {
            "id": f"{u}_{v}_{key}",
            "from": str(u),
            "to": str(v),
            "length": f"{length:.2f}",
            "freespeed": f"{freespeed:.2f}",
            "capacity": str(capacity),
            "permlanes": str(lanes),
            "allowedModes": "car"
        })
    
    # Format XML with proper indentation
    ET.indent(root, space="  ")
    
    # Convert to string
    xml_body = ET.tostring(root, encoding="utf-8").decode("utf-8")
    
    # Write to file with MATSim-required header
    print(f"Writing to {output_file}...")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<!DOCTYPE network SYSTEM "http://www.matsim.org/files/dtd/network_v2.dtd">\n')
        f.write(xml_body)
    
    print(f"✓ MATSim network successfully written to {output_file}")


# ============================================================================
# ENSURE NETWORK CONNECTIVITY
# ============================================================================

# MATSim requires a strongly connected network (all nodes reachable from all others)
# Extract the largest strongly connected component
print("\nEnsuring network connectivity...")
largest_cc = max(nx.strongly_connected_components(G), key=len)
original_nodes = G.number_of_nodes()
G = G.subgraph(largest_cc).copy()

print(f"Kept {G.number_of_nodes()}/{original_nodes} nodes "
      f"({G.number_of_edges()} edges) in largest connected component")


# ============================================================================
# EXPORT TO MATSIM
# ============================================================================

print("\nExporting to MATSim format...")
networkx_to_matsim(G, output_file=OUTPUT_FILE)

print("\n" + "="*60)
print("CONVERSION COMPLETE")
print("="*60)
print(f"Output file: {OUTPUT_FILE}")
print(f"Nodes: {G.number_of_nodes()}")
print(f"Links: {G.number_of_edges()}")
print("="*60)
