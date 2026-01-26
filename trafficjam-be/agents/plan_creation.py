import logging
from typing import List, Dict, Any
import random
from pathlib import Path
import json

logger = logging.getLogger(__name__)


def add_time_variation(base_time: str, max_minutes: int = 30) -> str:
    """Add random variation to a time string."""
    h, m, s = map(int, base_time.split(':'))
    total_minutes = h * 60 + m
    variation = random.randint(-max_minutes, max_minutes)
    new_minutes = max(0, min(1439, total_minutes + variation))
    return f"{new_minutes // 60:02d}:{new_minutes % 60:02d}:00"


def generate_daily_plan(agent: Dict) -> List[Dict]:
    """
    Generate a realistic daily activity plan for an agent.

    Plans include:
    - Work/school activities
    - Shopping trips (supermarkets)
    - Healthcare visits (occasional)
    - School drop-offs/pick-ups for parents
    - Leisure activities
    - Public transport usage

    Args:
        agent: Agent dictionary with home/work locations and demographics

    Returns:
        List of activities with timing, locations, and transport modes
    """
    activities = []

    morning_start = add_time_variation('06:30:00', 60)

    activities.append({
        'type': 'home',
        'location': agent['home_location'],
        'start_time': '00:00:00',
        'end_time': morning_start
    })

    has_children = agent.get('children') and len(agent['children']) > 0

    if has_children:
        dropoff_time = add_time_variation('08:00:00', 20)
        child = agent['children'][0]

        activities.append({
            'type': f'dropoff_{child["school_type"]}',
            'location': child['school_location'],
            'start_time': morning_start,
            'end_time': dropoff_time
        })

        morning_start = dropoff_time

    if agent.get('employed') and agent.get('work_location'):
        work_start = add_time_variation('09:00:00', 30)
        work_end = add_time_variation('17:00:00', 30)

        activities.append({
            'type': 'work',
            'location': agent['work_location'],
            'start_time': work_start,
            'end_time': work_end
        })

        if random.random() > 0.7 and agent.get('preferred_supermarket'):
            shopping_end = add_time_variation('18:30:00', 20)
            activities.append({
                'type': 'shopping',
                'location': agent['preferred_supermarket'],
                'start_time': work_end,
                'end_time': shopping_end
            })
            work_end = shopping_end

        if has_children:
            pickup_time = add_time_variation('15:30:00', 20)
            child = agent['children'][0]

            if time_to_seconds(pickup_time) > time_to_seconds(work_end):
                pickup_time = add_time_variation(work_end, 15)

            activities.append({
                'type': f'pickup_{child["school_type"]}',
                'location': child['school_location'],
                'start_time': work_end,
                'end_time': pickup_time
            })
            work_end = pickup_time

        activities.append({
            'type': 'home',
            'location': agent['home_location'],
            'start_time': work_end,
            'end_time': '23:59:59'
        })

    elif agent['age'] >= 3 and agent['age'] <= 18:
        school_location = agent.get('school_location', agent['home_location'])

        if agent['age'] <= 10:
            school_start = '08:30:00'
            school_end = '15:00:00'
        else:
            school_start = '08:00:00'
            school_end = '15:30:00'

        activities.append({
            'type': 'education',
            'location': school_location,
            'start_time': add_time_variation(school_start, 15),
            'end_time': add_time_variation(school_end, 15)
        })

        if agent['age'] >= 16 and random.random() > 0.6 and agent.get('preferred_supermarket'):
            activities.append({
                'type': 'shopping',
                'location': agent['preferred_supermarket'],
                'start_time': add_time_variation('16:00:00', 30),
                'end_time': add_time_variation('17:00:00', 30)
            })

        activities.append({
            'type': 'home',
            'location': agent['home_location'],
            'start_time': add_time_variation('16:00:00', 60),
            'end_time': '23:59:59'
        })

    elif agent.get('is_student') and agent.get('work_location'):
        uni_start = add_time_variation('10:00:00', 60)
        uni_end = add_time_variation('16:00:00', 60)

        activities.append({
            'type': 'education',
            'location': agent['work_location'],
            'start_time': uni_start,
            'end_time': uni_end
        })

        if random.random() > 0.5 and agent.get('preferred_supermarket'):
            activities.append({
                'type': 'shopping',
                'location': agent['preferred_supermarket'],
                'start_time': uni_end,
                'end_time': add_time_variation('18:00:00', 30)
            })

        activities.append({
            'type': 'home',
            'location': agent['home_location'],
            'start_time': add_time_variation('18:00:00', 60),
            'end_time': '23:59:59'
        })

    else:
        if random.random() > 0.6 and agent.get('preferred_supermarket'):
            shopping_start = add_time_variation('10:00:00', 120)
            shopping_end = add_time_variation('11:30:00', 60)

            activities.append({
                'type': 'shopping',
                'location': agent['preferred_supermarket'],
                'start_time': shopping_start,
                'end_time': shopping_end
            })

            activities.append({
                'type': 'home',
                'location': agent['home_location'],
                'start_time': shopping_end,
                'end_time': '23:59:59'
            })
        else:
            activities.append({
                'type': 'home',
                'location': agent['home_location'],
                'start_time': morning_start,
                'end_time': '23:59:59'
            })

    if random.random() > 0.95 and agent.get('preferred_healthcare'):
        activities.insert(-1, {
            'type': 'healthcare',
            'location': agent['preferred_healthcare'],
            'start_time': add_time_variation('14:00:00', 120),
            'end_time': add_time_variation('15:00:00', 60)
        })

    activities.sort(key=lambda x: time_to_seconds(x['start_time']))

    return activities


def time_to_seconds(time_str: str) -> int:
    """Convert HH:MM:SS to seconds since midnight."""
    h, m, s = map(int, time_str.split(':'))
    return h * 3600 + m * 60 + s


def get_transport_mode(agent: Dict, activity_type: str) -> str:
    """
    Determine transport mode based on agent characteristics and activity.

    Args:
        agent: Agent dictionary with demographics
        activity_type: Type of activity being traveled to

    Returns:
        Transport mode: 'car', 'pt' (public transport), 'walk', 'bike'
    """
    if agent.get('uses_public_transport'):
        if random.random() > 0.8:
            return 'pt'

    if agent['age'] < 16:
        if random.random() > 0.7:
            return 'walk'
        else:
            return 'car'

    if agent['age'] >= 16 and agent['age'] <= 25:
        if agent.get('is_student'):
            modes = ['pt', 'bike', 'walk', 'car']
            weights = [0.4, 0.2, 0.2, 0.2]
            return random.choices(modes, weights=weights)[0]

    if agent['age'] >= 65:
        if agent.get('has_car'):
            modes = ['car', 'pt', 'walk']
            weights = [0.5, 0.3, 0.2]
            return random.choices(modes, weights=weights)[0]
        else:
            modes = ['pt', 'walk']
            weights = [0.6, 0.4]
            return random.choices(modes, weights=weights)[0]

    if activity_type in ['shopping', 'healthcare']:
        if agent.get('has_car'):
            modes = ['car', 'pt', 'walk']
            weights = [0.6, 0.2, 0.2]
            return random.choices(modes, weights=weights)[0]
        else:
            modes = ['pt', 'walk']
            weights = [0.7, 0.3]
            return random.choices(modes, weights=weights)[0]

    if agent.get('has_car'):
        return 'car'

    return 'pt'


def create_matsim_population_xml(agents: List[Dict], output_path: str) -> str:
    """
    Create MATSim population XML file with realistic activity plans and transport modes.

    Args:
        agents: List of agent dictionaries
        output_path: Path to save the XML file

    Returns:
        Path to created file
    """
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE population SYSTEM "http://www.matsim.org/files/dtd/population_v6.dtd">',
        '<population>',
    ]

    mode_stats = {'car': 0, 'pt': 0, 'walk': 0, 'bike': 0}

    for agent in agents:
        xml_lines.append(f'  <person id="{agent["id"]}">')

        age = agent.get('age', 30)
        employed = agent.get('employed', False)
        has_car = agent.get('has_car', True)

        xml_lines.append(f'    <attributes>')
        xml_lines.append(f'      <attribute name="age" class="java.lang.Integer">{age}</attribute>')
        xml_lines.append(f'      <attribute name="employed" class="java.lang.Boolean">{str(employed).lower()}</attribute>')
        xml_lines.append(f'      <attribute name="has_car" class="java.lang.Boolean">{str(has_car).lower()}</attribute>')
        xml_lines.append(f'    </attributes>')

        activities = generate_daily_plan(agent)

        xml_lines.append(f'    <plan selected="yes">')

        for i, activity in enumerate(activities):
            lat, lon = activity['location']

            if i < len(activities) - 1:
                xml_lines.append(
                    f'      <activity type="{activity["type"]}" '
                    f'x="{lon}" y="{lat}" end_time="{activity["end_time"]}" />'
                )

                mode = get_transport_mode(agent, activity['type'])
                mode_stats[mode] = mode_stats.get(mode, 0) + 1

                xml_lines.append(f'      <leg mode="{mode}" />')
            else:
                xml_lines.append(
                    f'      <activity type="{activity["type"]}" '
                    f'x="{lon}" y="{lat}" />'
                )

        xml_lines.append('    </plan>')
        xml_lines.append('  </person>')

    xml_lines.append('</population>')

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(xml_lines))

    logger.info(f"Created MATSim population file: {output_path}")
    logger.info(f"Transport mode distribution: {mode_stats}")
    return output_path


def create_matsim_network_xml(
    nodes: List[Dict],
    links: List[Dict],
    bounds: Dict[str, float],
    output_path: str,
    crs: str = "EPSG:4326"
) -> str:
    """
    Create MATSim network XML file from OSM data.

    Args:
        nodes: List of traffic nodes (coordinates in projected CRS)
        links: List of traffic links (coordinates in projected CRS)
        bounds: Geographic bounds (in projected CRS)
        output_path: Path to save the XML file
        crs: Coordinate reference system

    Returns:
        Path to created file
    """
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE network SYSTEM "http://www.matsim.org/files/dtd/network_v2.dtd">',
        '<network name="osm-network">',
        '  <attributes>',
        f'    <attribute name="coordinateReferenceSystem" class="java.lang.String">{crs}</attribute>',
        '  </attributes>',
        '  <nodes>',
    ]

    for node in nodes:
        x, y = node['position']
        xml_lines.append(f'    <node id="{node["id"]}" x="{x}" y="{y}" />')

    xml_lines.append('  </nodes>')
    xml_lines.append('  <links>')

    highway_speeds = {
        'motorway': 110,
        'trunk': 100,
        'primary': 80,
        'secondary': 60,
        'tertiary': 50,
        'residential': 30,
        'service': 20,
        'unclassified': 40,
    }

    highway_capacity = {
        'motorway': 2000,
        'trunk': 1800,
        'primary': 1500,
        'secondary': 1200,
        'tertiary': 1000,
        'residential': 600,
        'service': 300,
        'unclassified': 800,
    }

    for link in links:
        highway_type = link['tags'].get('highway', 'unclassified')

        maxspeed_kmh = link['tags'].get('maxspeed', highway_speeds.get(highway_type, 50))
        freespeed_ms = maxspeed_kmh / 3.6

        lanes = link['tags'].get('lanes', 1)

        capacity = highway_capacity.get(highway_type, 800) * lanes

        geometry = link['geometry']
        length = calculate_link_length(geometry, crs)

        xml_lines.append(
            f'    <link id="{link["id"]}" from="{link["from_node"]}" to="{link["to_node"]}" '
            f'length="{length:.2f}" freespeed="{freespeed_ms:.2f}" '
            f'capacity="{capacity}" permlanes="{lanes}" />'
        )

    xml_lines.append('  </links>')
    xml_lines.append('</network>')

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(xml_lines))

    logger.info(f"Created MATSim network file: {output_path}")
    return output_path


def calculate_link_length(geometry: List[List[float]], crs: str = "EPSG:4326") -> float:
    """
    Calculate length of a link in meters.
    Uses Euclidean distance for projected CRS, Haversine for WGS84.

    Args:
        geometry: List of [x, y] coordinates (projected) or [lat, lon] (WGS84)
        crs: Coordinate reference system

    Returns:
        Length in meters
    """
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).parent.parent))
    from utils.coordinates import euclidean_distance
    import math

    if crs != "EPSG:4326":
        # Use Euclidean distance for projected coordinates (already in meters)
        total_length = 0
        for i in range(len(geometry) - 1):
            coord1 = tuple(geometry[i])
            coord2 = tuple(geometry[i + 1])
            total_length += euclidean_distance(coord1, coord2)
        return total_length
    else:
        # Fallback: Use Haversine for WGS84
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371000
            phi1, phi2 = math.radians(lat1), math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lon2 - lon1)
            a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
            return 2 * R * math.asin(math.sqrt(a))

        total_length = 0
        for i in range(len(geometry) - 1):
            lat1, lon1 = geometry[i]
            lat2, lon2 = geometry[i + 1]
            total_length += haversine(lat1, lon1, lat2, lon2)
        return total_length


def create_matsim_config_xml(
    city_name: str,
    country_code: str,
    output_path: str,
    crs: str = "EPSG:4326"
) -> str:
    """
    Create MATSim configuration XML file.

    Args:
        city_name: Name of the city
        country_code: Country code
        output_path: Path to save the XML file

    Returns:
        Path to created file
    """
    xml_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE config SYSTEM "http://www.matsim.org/files/dtd/config_v2.dtd">
<config>
    <module name="global">
        <param name="coordinateSystem" value="{crs}" />
    </module>

    <module name="network">
        <param name="inputNetworkFile" value="network.xml" />
    </module>

    <module name="plans">
        <param name="inputPlansFile" value="population.xml" />
    </module>

    <module name="controler">
        <param name="outputDirectory" value="./simulation_output/{city_name}_{country_code}" />
        <param name="firstIteration" value="0" />
        <param name="lastIteration" value="10" />
        <param name="writeEventsInterval" value="10" />
        <param name="writePlansInterval" value="10" />
    </module>

    <module name="qsim">
        <param name="startTime" value="00:00:00" />
        <param name="endTime" value="30:00:00" />
        <param name="flowCapacityFactor" value="1.0" />
        <param name="storageCapacityFactor" value="1.0" />
    </module>

    <module name="strategy">
        <param name="maxAgentPlanMemorySize" value="5" />
        <parameterset type="strategysettings">
            <param name="strategyName" value="BestScore" />
            <param name="weight" value="0.9" />
        </parameterset>
        <parameterset type="strategysettings">
            <param name="strategyName" value="ReRoute" />
            <param name="weight" value="0.1" />
        </parameterset>
    </module>
</config>'''

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(xml_content)

    logger.info(f"Created MATSim config file: {output_path}")
    return output_path


def get_next_try_number(user_id: str, city_name: str, country_code: str, base_dir: Path) -> int:
    """
    Get the next try number for a user's city simulation.

    Args:
        user_id: User identifier
        city_name: City name (cleaned)
        country_code: Country code
        base_dir: Base directory for tries

    Returns:
        Next try number (1-indexed)
    """
    pattern = f"{user_id}_{city_name}_{country_code}_try*"
    existing_tries = list(base_dir.glob(pattern))

    if not existing_tries:
        return 1

    try_numbers = []
    for try_path in existing_tries:
        try:
            try_num = int(try_path.name.split('_try')[-1])
            try_numbers.append(try_num)
        except (ValueError, IndexError):
            continue

    return max(try_numbers) + 1 if try_numbers else 1


def save_network_snapshot(output_dir: Path, network_data: Any, bounds: Dict[str, float]) -> str:
    """
    Save a snapshot of the network data (map state) that was used for this try.

    This allows users to see exactly what map configuration produced these results.

    Args:
        output_dir: Directory to save snapshot
        network_data: The network data from the request
        bounds: Geographic bounds

    Returns:
        Path to snapshot file
    """
    snapshot = {
        'bounds': bounds,
        'building_count': len(network_data.buildings or []),
        'node_count': len(network_data.nodes or []),
        'link_count': len(network_data.links or []),
        'transport_route_count': len(network_data.transportRoutes or []),
        'buildings': [
            {
                'id': b.id,
                'osmId': b.osmId,
                'position': b.position,
                'type': b.type,
                'tags': b.tags
            }
            for b in (network_data.buildings or [])
        ],
        'nodes': [
            {
                'id': n.id,
                'osmId': n.osmId,
                'position': n.position,
                'connectionCount': n.connectionCount
            }
            for n in (network_data.nodes or [])
        ],
        'links': [
            {
                'id': l.id,
                'osmId': l.osmId,
                'from_node': l.from_node,
                'to_node': l.to_node,
                'tags': l.tags
            }
            for l in (network_data.links or [])
        ]
    }

    snapshot_path = output_dir / "network_snapshot.json"
    with open(snapshot_path, 'w', encoding='utf-8') as f:
        json.dump(snapshot, f, indent=2)

    logger.info(f"Saved network snapshot to {snapshot_path}")
    return str(snapshot_path)


def create_matsim_plans(
    agents: List[Dict],
    bounds: Dict[str, float],
    user_id: str = "default_user",
    network_data: Any = None
) -> Dict[str, Any]:
    """
    Create all MATSim input files for a user's try.

    Files are stored per user/city/try combination:
    - temp_tries/{user_id}_{city}_{country}_try{N}/
      - population.xml
      - config.xml
      - network_snapshot.json (map state that was used)

    Future: Will be uploaded to GCS bucket instead of temp storage.

    Args:
        agents: List of agents with locations and demographics
        bounds: Geographic bounds
        user_id: User identifier (email, session ID, etc.)
        network_data: Original network data for snapshot

    Returns:
        Dictionary with file paths and try information
    """
    city_name = agents[0].get('city', 'unknown') if agents else 'unknown'
    country_code = agents[0].get('country_code', 'UNK') if agents else 'UNK'

    city_clean = city_name.replace(' ', '_').replace('/', '_').lower()
    user_clean = user_id.replace('@', '_').replace('.', '_').replace(' ', '_').lower()

    base_dir = Path("temp_tries")
    base_dir.mkdir(parents=True, exist_ok=True)

    try_number = get_next_try_number(user_clean, city_clean, country_code, base_dir)

    try_name = f"{user_clean}_{city_clean}_{country_code}_try{try_number}"
    output_dir = base_dir / try_name
    output_dir.mkdir(parents=True, exist_ok=True)

    files = {}

    population_path = output_dir / "population.xml"
    files['population'] = create_matsim_population_xml(agents, str(population_path))

    config_path = output_dir / "config.xml"
    files['config'] = create_matsim_config_xml(city_name, country_code, str(config_path))

    if network_data:
        snapshot_path = save_network_snapshot(output_dir, network_data, bounds)
        files['network_snapshot'] = snapshot_path

    files['try_number'] = try_number
    files['try_name'] = try_name
    files['output_dir'] = str(output_dir)

    logger.info(f"Created try {try_number} for user '{user_id}' in {output_dir}")
    logger.info(f"Files created: {list(files.keys())}")
    logger.info(f"Future: This will be uploaded to GCS bucket at: gs://trafficjam-tries/{try_name}/")

    return files
