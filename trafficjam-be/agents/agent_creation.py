import logging
from typing import Any, List, Dict


from models import Building
from utils.geo import calculate_area_wgs84, calculate_area_projected
from utils.population import estimate_population
from utils.building_utils import distribute_agents_to_buildings
from agents.work_assignment import assign_work_location
from agents.school_assignment import assign_children_to_parents
from agents.agent_attributes import (
    generate_age_distribution,
    assign_employment_status,
    assign_transport_mode,
    assign_amenity_preferences,
)

logger = logging.getLogger(__name__)


def calculate_population_from_bounds(
    bounds: Dict[str, float], crs: str, country_code: str
) -> int:
    if crs != "EPSG:4326":
        area_km2 = calculate_area_projected(bounds)
    else:
        logger.warning("Using WGS84 coordinates, falling back to Haversine")
        area_km2 = calculate_area_wgs84(bounds)

    return estimate_population(area_km2, country_code)


def create_single_agent(
    agent_id: int,
    building: Building,
    buildings: List[Building],
    country_name: str,
    country_code: str,
    city_name: str,
    has_transport: bool,
) -> Dict:
    age = generate_age_distribution()

    agent = {
        "id": f"agent_{agent_id}",
        "home_building_id": building.id,
        "home_location": building.position,
        "age": age,
        "country": country_name,
        "country_code": country_code,
        "city": city_name,
    }

    assign_employment_status(agent)
    assign_transport_mode(agent, has_transport)

    if agent["employed"]:
        assign_work_location(agent, buildings)

    assign_amenity_preferences(agent, buildings)

    return agent


def create_agents_from_network(
    bounds: Dict[str, float],
    buildings: List[Any],
    transport_routes: List[Dict],
    crs: str = "EPSG:4326",
    country_code: str = "UNK",
    country_name: str = "UNK",  # TODO: figure out if you can make it always available
) -> List[Dict]:
    """
    Creates realistic MATSim agents with:
    - Diverse work locations (supermarkets, hospitals, schools, retail)
    - Parent-child relationships with school drop-offs
    - Public transport usage (students, elderly, some workers)
    - Shopping and errands (supermarkets, healthcare visits)
    - Age-based demographics and behaviors

    Args:
        bounds: Geographic bounds (in projected CRS for meters, or WGS84)
        buildings: List of buildings from OSM
        transport_routes: Public transport routes
        crs: Coordinate reference system code (e.g., "EPSG:2157")
        country_code: ISO3 country code (e.g., "IRL")
        country_name: Country name (e.g., "Ireland")

    Returns:
        List of agent dictionaries with home/work locations and demographics
    """
    city_name = "Unknown"

    total_population = calculate_population_from_bounds(bounds, crs, country_code)

    logger.info(f"Creating {total_population} agents for {city_name}, {country_name}")

    agent_distribution = distribute_agents_to_buildings(buildings, total_population)

    agents = []
    agent_id = 1
    has_transport = len(transport_routes) > 0

    for building_id, count in agent_distribution.items():
        building = next((b for b in buildings if b.id == building_id), None)
        if not building:
            continue

        for _ in range(count):
            agent = create_single_agent(
                agent_id,
                building,
                buildings,
                country_name,
                country_code,
                city_name,
                has_transport,
            )
            agents.append(agent)
            agent_id += 1

    assign_children_to_parents(agents, buildings)

    logger.info(f"Created {len(agents)} agents with realistic behaviors")
    logger.info(f"  - Employed: {len([a for a in agents if a.get('employed')])}")
    logger.info(f"  - Students: {len([a for a in agents if a.get('is_student')])}")
    logger.info(
        f"  - Public transport users: {len([a for a in agents if a.get('uses_public_transport')])}"
    )
    logger.info(
        f"  - Parents with children: {len([a for a in agents if a.get('children')])}"
    )

    return agents
