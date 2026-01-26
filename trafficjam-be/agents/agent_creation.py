import logging
from typing import List, Dict, Optional, Tuple
import math
import random

logger = logging.getLogger(__name__)


def detect_country_and_city(bounds: Dict[str, float]) -> Tuple[str, str, str]:
    """
    Detect country and city from geographic bounds using reverse geocoding.

    Args:
        bounds: Dictionary with 'north', 'south', 'east', 'west' keys

    Returns:
        Tuple of (country_name, country_code, city_name)
    """
    try:
        import reverse_geocode

        center_lat = (bounds['north'] + bounds['south']) / 2
        center_lon = (bounds['east'] + bounds['west']) / 2

        coordinates = (center_lat, center_lon)
        location = reverse_geocode.search([coordinates])[0]

        country_name = location.get('country', 'Unknown')
        country_code = location.get('country_code', 'UNK')
        city_name = location.get('city', 'Unknown City')

        logger.info(f"Detected location: {city_name}, {country_name} ({country_code})")
        return country_name, country_code, city_name

    except ImportError:
        logger.warning("reverse_geocode not installed, using default country detection")
        center_lat = (bounds['north'] + bounds['south']) / 2

        if 51.0 <= center_lat <= 55.5:
            return "Ireland", "IRL", "Unknown City"
        elif 49.0 <= center_lat <= 59.0:
            return "United Kingdom", "GBR", "Unknown City"
        else:
            return "Unknown", "UNK", "Unknown City"
    except Exception as e:
        logger.error(f"Error detecting country: {e}")
        return "Unknown", "UNK", "Unknown City"


def estimate_population_from_bounds(bounds: Dict[str, float], country_code: str) -> int:
    """
    Estimate population for the area based on bounds and country.

    This uses simple heuristics. For production, integrate with WorldPop API/data.

    Args:
        bounds: Geographic bounds
        country_code: ISO3 country code

    Returns:
        Estimated population for the area
    """
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in km between two coordinates."""
        R = 6371
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
        return 2 * R * math.asin(math.sqrt(a))

    north, south = bounds['north'], bounds['south']
    east, west = bounds['east'], bounds['west']

    height_km = haversine_distance(south, west, north, west)
    width_km = haversine_distance(south, west, south, east)
    area_km2 = height_km * width_km

    density_map = {
        'IRL': 70,
        'GBR': 275,
        'USA': 36,
        'DEU': 240,
        'FRA': 119,
        'NLD': 508,
        'BEL': 383,
    }

    density = density_map.get(country_code, 100)

    estimated_pop = int(area_km2 * density)
    logger.info(f"Estimated population: {estimated_pop} (area: {area_km2:.2f} km�, density: {density}/km�)")

    return estimated_pop


def fetch_worldpop_data(bounds: Dict[str, float], country_code: str) -> Optional[any]:
    """
    Fetch WorldPop raster data for the specified bounds.

    This is a placeholder for WorldPop integration. In production:
    1. Download country-specific GeoTIFF from WorldPop
    2. Use rasterio to crop to bounds
    3. Sample population density values

    Args:
        bounds: Geographic bounds
        country_code: ISO3 country code

    Returns:
        Population raster data or None
    """
    try:
        import httpx
        import rasterio
        from rasterio.windows import from_bounds

        logger.info(f"Fetching WorldPop data for {country_code}")

        return None

    except ImportError:
        logger.warning("rasterio not installed, using estimated population")
        return None
    except Exception as e:
        logger.error(f"Error fetching WorldPop data: {e}")
        return None


def distribute_agents_to_buildings(
    buildings: List[Dict],
    total_population: int
) -> Dict[str, int]:
    """
    Distribute population to buildings based on their types.

    Args:
        buildings: List of building dictionaries
        total_population: Total population to distribute

    Returns:
        Dictionary mapping building_id to number of agents
    """
    residential_buildings = [b for b in buildings if b['type'] in ['apartments', 'residential']]

    if not residential_buildings:
        logger.warning("No residential buildings found, distributing uniformly")
        residential_buildings = buildings[:max(1, len(buildings) // 2)]

    distribution = {}
    remaining = total_population

    for i, building in enumerate(residential_buildings):
        if i == len(residential_buildings) - 1:
            distribution[building['id']] = remaining
        else:
            capacity = random.randint(1, max(2, remaining // (len(residential_buildings) - i)))
            distribution[building['id']] = capacity
            remaining -= capacity

    logger.info(f"Distributed {total_population} agents to {len(residential_buildings)} residential buildings")
    return distribution


def assign_work_location(agent: Dict, building_dicts: List[Dict]) -> None:
    """
    Assign realistic work locations based on agent age and demographics.

    Work types:
    - Supermarket workers
    - Healthcare workers (hospitals, clinics)
    - Retail workers
    - Office workers
    - School staff
    - Service workers
    """
    supermarkets = [b for b in building_dicts if b['type'] == 'supermarket']
    hospitals = [b for b in building_dicts if b['type'] in ['hospital', 'clinic', 'doctors']]
    schools = [b for b in building_dicts if b['type'] in ['school', 'kindergarten']]
    retail = [b for b in building_dicts if b['type'] == 'retail']

    all_work_buildings = supermarkets + hospitals + schools + retail

    if not all_work_buildings:
        return

    weights = []
    if supermarkets:
        weights.append(0.15)
    else:
        weights.append(0)

    if hospitals:
        weights.append(0.20)
    else:
        weights.append(0)

    if schools:
        weights.append(0.15)
    else:
        weights.append(0)

    if retail:
        weights.append(0.50)
    else:
        weights.append(0)

    total_weight = sum(weights)
    if total_weight == 0:
        return

    weights = [w/total_weight for w in weights]

    work_categories = []
    if supermarkets:
        work_categories.append(('supermarket', supermarkets))
    if hospitals:
        work_categories.append(('healthcare', hospitals))
    if schools:
        work_categories.append(('education', schools))
    if retail:
        work_categories.append(('retail', retail))

    category, buildings = random.choices(work_categories, weights=weights)[0]
    work_building = random.choice(buildings)

    agent['work_building_id'] = work_building['id']
    agent['work_location'] = work_building['position']
    agent['work_type'] = category


def assign_children(agents: List[Dict], building_dicts: List[Dict]) -> None:
    """
    Create parent-child relationships and assign school locations.

    - Children aged 3-5 go to kindergarten
    - Children aged 6-18 go to school
    - Parents drop off/pick up young children (3-10)
    """
    adults = [a for a in agents if a['age'] >= 25 and a['age'] <= 45]
    children = [a for a in agents if a['age'] >= 3 and a['age'] <= 18]

    schools = [b for b in building_dicts if b['type'] == 'school']
    kindergartens = [b for b in building_dicts if b['type'] == 'kindergarten']

    for child in children:
        if child['age'] >= 3 and child['age'] <= 5:
            if kindergartens:
                school = random.choice(kindergartens)
                child['school_location'] = school['position']
                child['school_type'] = 'kindergarten'
                child['needs_dropoff'] = True
        elif child['age'] >= 6 and child['age'] <= 10:
            if schools:
                school = random.choice(schools)
                child['school_location'] = school['position']
                child['school_type'] = 'school'
                child['needs_dropoff'] = True
        elif child['age'] >= 11 and child['age'] <= 18:
            if schools:
                school = random.choice(schools)
                child['school_location'] = school['position']
                child['school_type'] = 'school'
                child['needs_dropoff'] = False

    children_needing_parents = [c for c in children if c.get('needs_dropoff')]

    for child in children_needing_parents:
        if adults:
            parent = random.choice(adults)

            if 'children' not in parent:
                parent['children'] = []

            parent['children'].append({
                'id': child['id'],
                'school_location': child.get('school_location'),
                'school_type': child.get('school_type')
            })


def create_agents_from_network(
    bounds: Dict[str, float],
    buildings: List[Dict],
    nodes: List[Dict],
    links: List[Dict],
    transport_routes: List[Dict],
    crs: str = "EPSG:4326",
    country_code: str = "UNK",
    country_name: str = "Unknown"
) -> List[Dict]:
    """
    Create MATSim agents from network data and population estimates.

    Creates realistic agents with:
    - Diverse work locations (supermarkets, hospitals, schools, retail)
    - Parent-child relationships with school drop-offs
    - Public transport usage (students, elderly, some workers)
    - Shopping and errands (supermarkets, healthcare visits)
    - Age-based demographics and behaviors

    Args:
        bounds: Geographic bounds in projected CRS (meters)
        buildings: List of buildings from OSM (coordinates in projected CRS)
        nodes: Traffic nodes (coordinates in projected CRS)
        links: Traffic links (coordinates in projected CRS)
        transport_routes: Public transport routes (coordinates in projected CRS)
        crs: Coordinate reference system code (e.g., "EPSG:2157")
        country_code: ISO3 country code (e.g., "IRL")
        country_name: Country name (e.g., "Ireland")

    Returns:
        List of agent dictionaries with home/work locations and demographics
    """
    # Country info is provided by frontend, no reverse geocoding needed
    city_name = "Unknown City"  # Could be enhanced later if needed

    # Calculate area using projected coordinates (already in meters)
    if crs != "EPSG:4326":
        # Use projected bounds for accurate area calculation
        width_m = bounds['east'] - bounds['west']
        height_m = bounds['north'] - bounds['south']
        area_m2 = width_m * height_m
        area_km2 = area_m2 / 1_000_000

        # Population density by country (people per km²)
        density_map = {
            'IRL': 70,
            'GBR': 275,
            'USA': 36,
            'DEU': 240,
            'FRA': 119,
            'NLD': 508,
            'BEL': 383,
            'ESP': 94,
            'PRT': 111,
            'ITA': 200,
        }
        density = density_map.get(country_code, 100)
        total_population = int(area_km2 * density)
        logger.info(f"Estimated population: {total_population} (area: {area_km2:.2f} km², density: {density}/km²)")
    else:
        # Fallback for WGS84 (shouldn't happen in normal flow)
        logger.warning("Using WGS84 coordinates, falling back to simple estimation")
        total_population = 5000

    num_agents = min(total_population, 10000)

    logger.info(f"Creating {num_agents} agents for {city_name}, {country_name}")

    building_dicts = [
        {
            'id': b.id,
            'osmId': b.osmId,
            'position': b.position,
            'type': b.type,
            'tags': b.tags
        }
        for b in buildings
    ]

    agent_distribution = distribute_agents_to_buildings(building_dicts, num_agents)

    agents = []
    agent_id = 1

    for building_id, count in agent_distribution.items():
        building = next((b for b in building_dicts if b['id'] == building_id), None)
        if not building:
            continue

        for _ in range(count):
            age = random.choices(
                [random.randint(0, 17), random.randint(18, 64), random.randint(65, 90)],
                weights=[0.2, 0.65, 0.15]
            )[0]

            agent = {
                'id': f'agent_{agent_id}',
                'home_building_id': building_id,
                'home_location': building['position'],
                'age': age,
                'country': country_name,
                'country_code': country_code,
                'city': city_name
            }

            if age >= 18 and age < 65:
                agent['employed'] = random.random() > 0.1
                agent['is_student'] = age >= 18 and age <= 25 and random.random() > 0.3
            else:
                agent['employed'] = False
                agent['is_student'] = False

            has_transport = len(transport_routes) > 0

            if age >= 16 and age <= 25:
                agent['uses_public_transport'] = has_transport and random.random() > 0.4
            elif age >= 65:
                agent['uses_public_transport'] = has_transport and random.random() > 0.6
            elif not agent.get('employed'):
                agent['uses_public_transport'] = has_transport and random.random() > 0.5
            else:
                agent['uses_public_transport'] = has_transport and random.random() > 0.7

            agent['has_car'] = not agent['uses_public_transport'] or (age >= 25 and random.random() > 0.3)

            if agent['employed']:
                assign_work_location(agent, building_dicts)

            supermarkets = [b for b in building_dicts if b['type'] == 'supermarket']
            if supermarkets:
                agent['preferred_supermarket'] = random.choice(supermarkets)['position']

            hospitals = [b for b in building_dicts if b['type'] in ['hospital', 'clinic', 'doctors']]
            if hospitals:
                agent['preferred_healthcare'] = random.choice(hospitals)['position']

            agents.append(agent)
            agent_id += 1

    assign_children(agents, building_dicts)

    logger.info(f"Created {len(agents)} agents with realistic behaviors")
    logger.info(f"  - Employed: {len([a for a in agents if a.get('employed')])}")
    logger.info(f"  - Students: {len([a for a in agents if a.get('is_student')])}")
    logger.info(f"  - Public transport users: {len([a for a in agents if a.get('uses_public_transport')])}")
    logger.info(f"  - Parents with children: {len([a for a in agents if a.get('children')])}")

    return agents
