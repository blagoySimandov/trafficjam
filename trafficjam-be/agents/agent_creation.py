import logging
import random
import uuid

from .models import Building, Child, Adult, Agent, TransportMode
from .geo import calculate_area_wgs84
from .population import estimate_population
from .work_assignment import assign_work_location
from .school_assignment import assign_school_to_child, get_schools_from_buildings
from .agent_attributes import (
    generate_child_age,
    generate_adult_age,
    determine_employment_status,
    determine_transport_preferences,
)
from .config import AgentConfig, config as default_config

logger = logging.getLogger(__name__)


def calculate_population_from_bounds(
    bounds: dict[str, float], agent_config: AgentConfig
) -> int:
    """
    Estimates the total population size for a geographic bounding box.

    Uses the configured `default_population_density` multiplied by the 
    calculated squared kilometer area.

    Args:
        bounds (dict[str, float]): A dictionary containing 'minLat', 'minLng', 
            'maxLat', and 'maxLng' coordinates.
        agent_config (AgentConfig): The dynamic parameters controlling demographic generation.

    Returns:
        int: The estimated raw number of people residing in the area.
    """
    area_km2 = calculate_area_wgs84(bounds)
    return estimate_population(area_km2, agent_config)


def create_child(
    home: Building,
    schools: list[Building],
    kindergartens: list[Building],
) -> Child:
    """
    Instantiates a single synthetic Child agent.

    A child is deterministically assigned an age via a probability distribution,
    which dictates whether they are assigned to a Kindergarten or a typical School.
    Children default to walking for their `preferred_transport`.

    Args:
        home (Building): The residential building assigned to the household.
        schools (list[Building]): All available generic education amenities in the network.
        kindergartens (list[Building]): All available early-years amenities.

    Returns:
        Child: A populated `Child` instance with an assigned school location. 
    """
    age = generate_child_age()

    child = Child(
        id=str(uuid.uuid4()),
        age=age,
        home=home,
        has_car=False,
        uses_public_transport=False,
        preferred_transport=TransportMode.WALK,
    )

    return assign_school_to_child(child, schools, kindergartens)


def create_adult(
    home: Building,
    buildings: list[Building],
    has_transport: bool,
    needs_to_dropoff_children: bool,
    children_ids: list[Child],
    cfg: AgentConfig,
) -> Adult:
    """
    Instantiates a complex adult demographic agent and assigns their daily routines.

    This function determines age-driven employment (student vs worker vs retired), calculates 
    car availability thresholds, and assigns specific work locations for employed agents based on 
    proximity heuristics.

    Args:
        home (Building): The residential base for the agent.
        buildings (list[Building]): All commercial, industrial, or retail buildings for work assignment.
        has_transport (bool): Whether the city network has any valid public transport routes.
        needs_to_dropoff_children (bool): If True, the agent receives a modified morning routine to stop at a school. 
        children_ids (list[Child]): Pointers to the specific children this adult is responsible for dropping off.
        cfg (AgentConfig): Scenario demographic rules (e.g., retirement age).

    Returns:
        Adult: An `Adult` agent ready to have their physical daily plan generated.
    """
    age = generate_adult_age(cfg)
    employed, is_student = determine_employment_status(age, cfg)
    uses_pt, has_car = determine_transport_preferences(
        age, employed, has_transport, needs_to_dropoff_children, cfg
    )

    if has_car:
        preferred_transport = TransportMode.CAR
    elif uses_pt:
        preferred_transport = TransportMode.PUBLIC_TRANSPORT
    else:
        preferred_transport = TransportMode.WALK

    adult = Adult(
        id=str(uuid.uuid4()),
        age=age,
        home=home,
        has_car=has_car,
        uses_public_transport=uses_pt,
        preferred_transport=preferred_transport,
        employed=employed,
        is_student=is_student,
        children=children_ids,
        needs_to_dropoff_children=needs_to_dropoff_children,
    )

    if employed:
        adult = assign_work_location(adult, buildings)

    return adult


def create_household(
    home: Building,
    buildings: list[Building],
    schools: list[Building],
    kindergartens: list[Building],
    has_transport: bool,
    cfg: AgentConfig,
) -> list[Agent]:
    num_children = random.choices([0, 1, 2, 3], weights=[0.3, 0.35, 0.25, 0.1])[0]
    num_adults = random.choices([1, 2], weights=[0.3, 0.7])[0]

    children = [create_child(home, schools, kindergartens) for _ in range(num_children)]

    children_needing_dropoff = [c for c in children if c.needs_dropoff]
    children_ids = [c for c in children_needing_dropoff]

    adults: list[Adult] = []
    for i in range(num_adults):
        is_dropper = (i == 0) and len(children_needing_dropoff) > 0
        adult = create_adult(
            home,
            buildings,
            has_transport,
            is_dropper,
            children_ids if is_dropper else [],
            cfg,
        )
        adults.append(adult)

    household: list[Agent] = [*adults, *children]
    return household


def create_agents_from_network(
    bounds: dict[str, float],
    buildings: list[Building],
    transport_routes: list,
    country_code: str = "IRL",
    agent_config: AgentConfig | None = None,
    max_agents: int = 1000,
) -> list[Agent]:
    """
    The main macro-entrypoint for synthesizing a MATSim population from a static network.

    1. Scans the network geometries for residential spaces to act as 'homes'.
    2. Scans for educational facilities (`schools`, `kindergartens`).
    3. Iteratively generates households of randomized sizes (Adults + Children) targeting
       the `max_agents` limit or the calculated geographical density limit (whichever is lower).
    
    This function acts as the bridge between standard GIS data (like OpenStreetMap points)
    and the required statistical behavioural inputs for a traffic simulation.

    Args:
        bounds (dict[str, float]): The geographical lat/lng bounding box of the selected map.
        buildings (list[Building]): Flattened list of all buildings with their functional tags.
        transport_routes (list): Array of parsed public transport line identifiers.
        country_code (str, optional): Currently unused, but positioned for census-based localized demographics. Defaults to "IRL".
        agent_config (AgentConfig | None, optional): Override the default probabilities. Defaults to None.
        max_agents (int, optional): The upper cap of agents to prevent JVM memory exhaustion on the server. Defaults to 1000.

    Returns:
        list[Agent]: A flat list containing every generated `Child` and `Adult` instance, complete 
            with their assigned homes, workplaces, transport modes, and dependents.
    """
    cfg = agent_config or default_config
    total_population = calculate_population_from_bounds(bounds, cfg)
    total_population = min(total_population, max_agents)
    logger.info(f"Creating ~{total_population} agents for {country_code}")

    residential_buildings = [
        b for b in buildings if b.type in [None, "residential", "apartments", "house"]
    ]
    if not residential_buildings:
        residential_buildings = buildings

    schools, kindergartens = get_schools_from_buildings(buildings)
    has_transport = len(transport_routes) > 0

    agents: list[Agent] = []
    avg_household_size = 2.5
    num_households = int(total_population / avg_household_size)

    for _ in range(num_households):
        home = random.choice(residential_buildings)
        household = create_household(
            home, buildings, schools, kindergartens, has_transport, cfg
        )
        agents.extend(household)

    children = [a for a in agents if isinstance(a, Child)]
    adults = [a for a in agents if isinstance(a, Adult)]
    employed = [a for a in adults if a.employed]
    parents = [a for a in adults if a.needs_to_dropoff_children]

    logger.info(f"Created {len(agents)} agents in {num_households} households")
    logger.info(f"  - Children: {len(children)}")
    logger.info(f"  - Adults: {len(adults)}")
    logger.info(f"  - Employed: {len(employed)}")
    logger.info(f"  - Parents with dropoff duty: {len(parents)}")

    return agents
