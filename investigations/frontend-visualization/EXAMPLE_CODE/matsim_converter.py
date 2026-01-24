# RUN THIS PROGRAM IN TERMINAL TO CONVERT MATSIM DATA TO GEOJSON YES YES

import xml.etree.ElementTree as ET
import json

def matsim_network_to_geojson(network_xml_path, output_geojson_path):
    """
    Convert MATSim network.xml to GeoJSON format
    """
    print(f"Reading network from {network_xml_path}...")
    tree = ET.parse(network_xml_path)
    root = tree.getroot()
    
    # Parse nodes (intersections)
    nodes = {}
    for node in root.findall('.//node'):
        node_id = node.get('id')
        x = float(node.get('x'))
        y = float(node.get('y'))
        nodes[node_id] = [x, y]
    
    print(f"Found {len(nodes)} nodes")
    
    # Parse links (roads) and create GeoJSON features
    features = []
    for link in root.findall('.//link'):
        from_node = link.get('from')
        to_node = link.get('to')
        link_id = link.get('id')
        
        # Get link attributes
        capacity = float(link.get('capacity', 0))
        freespeed = float(link.get('freespeed', 0))
        length = float(link.get('length', 0))
        lanes = float(link.get('permlanes', 1))
        
        # Determine road type based on capacity/lanes
        if capacity > 1500 or lanes >= 2:
            road_type = "primary"
        else:
            road_type = "secondary"
        
        # Create LineString from nodes
        coords = [nodes[from_node], nodes[to_node]]
        
        feature = {
            "type": "Feature",
            "properties": {
                "type": road_type,
                "id": link_id,
                "capacity": capacity,
                "freespeed": freespeed,
                "length": length,
                "lanes": lanes
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            }
        }
        features.append(feature)
    
    # Create GeoJSON
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    # Write to file
    with open(output_geojson_path, 'w') as f:
        json.dump(geojson, f, indent=2)
    
    print(f"✓ Converted {len(features)} links to {output_geojson_path}")
    return geojson


def matsim_events_to_trips(events_xml_path, network_geojson_path, output_json_path):
    """
    Convert MATSim events.xml to trips JSON format
    """
    print(f"\nReading network from {network_geojson_path}...")
    with open(network_geojson_path, 'r') as f:
        network = json.load(f)
    
    # Build a lookup: link_id -> coordinates
    link_coords = {}
    
    for feature in network['features']:
        link_id = feature['properties']['id']
        coords = feature['geometry']['coordinates']
        link_coords[link_id] = coords
    
    print(f"Loaded {len(link_coords)} links from network")
    
    # Parse events and group by vehicle
    print(f"Reading events from {events_xml_path}...")
    tree = ET.parse(events_xml_path)
    root = tree.getroot()
    
    vehicle_trips = {}  # vehicle_id -> list of (link_id, time)
    
    for event in root.findall('.//event'):
        event_type = event.get('type')
        
        # We care about "entered link" events
        if event_type == 'entered link':
            vehicle = event.get('vehicle')
            link = event.get('link')
            time = float(event.get('time'))
            
            if vehicle not in vehicle_trips:
                vehicle_trips[vehicle] = []
            
            vehicle_trips[vehicle].append((link, time))
    
    print(f"Found {len(vehicle_trips)} vehicles")
    
    # Convert to trip format
    trips = []
    for vehicle_id, link_times in vehicle_trips.items():
        path = []
        timestamps = []
        
        for i, (link_id, time) in enumerate(link_times):
            if link_id in link_coords:
                coords = link_coords[link_id]
                
                # Add start point of link
                if len(path) == 0:
                    path.append(coords[0])
                    timestamps.append(time)
                
                # Add end point of link
                path.append(coords[1])
                
                # If we have a next link, use that time, otherwise estimate
                if i + 1 < len(link_times):
                    next_time = link_times[i + 1][1]
                    timestamps.append(next_time)
                else:
                    # Estimate: add ~10 seconds
                    timestamps.append(time + 10)
        
        if len(path) > 1:
            trips.append({
                'id': vehicle_id,
                'path': path,
                'timestamps': timestamps
            })
    
    # Save to JSON
    with open(output_json_path, 'w') as f:
        json.dump(trips, f, indent=2)
    
    print(f"✓ Converted {len(trips)} vehicle trips to {output_json_path}")
    print("\nConversion complete!")
    return trips


def main():
    """
    Main conversion pipeline
    """
    print("=" * 60)
    print("MATSim to Visualization Converter")
    print("=" * 60)
    
    # Step 1: Convert network
    network_xml = "network.xml"
    roads_geojson = "roads.geojson"
    matsim_network_to_geojson(network_xml, roads_geojson)
    
    # Step 2: Convert events to trips
    events_xml = "output_events.xml"
    trips_json = "trips.json"
    matsim_events_to_trips(events_xml, roads_geojson, trips_json)
    
    print("\n" + "=" * 60)
    print("Files generated:")
    print(f"  - {roads_geojson}")
    print(f"  - {trips_json}")
    print("=" * 60)


if __name__ == "__main__":
    main()