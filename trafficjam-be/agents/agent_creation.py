import logging
import random
import uuid

from models import Building, Child, Adult, Agent, TransportMode
from utils.geo import calculate_area_wgs84
from utils.population import estimate_population
from agents.work_assignment import assign_work_location
from agents.school_assignment import assign_school_to_child, get_schools_from_buildings
from agents.agent_attributes import (
    generate_child_age,
    generate_adult_age,
    determine_employment_status,
    determine_transport_preferences,
)

logger = logging.getLogger(__name__)


def calculate_population_from_bounds(
    bounds: dict[str, float], country_code: str
) -> int:
    area_km2 = calculate_area_wgs84(bounds)
    return estimate_population(area_km2, country_code)


def create_child(
    home: Building,
    schools: list[Building],
    kindergartens: list[Building],
) -> Child:
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
) -> Adult:
    age = generate_adult_age()
    employed, is_student = determine_employment_status(age)
    uses_pt, has_car = determine_transport_preferences(
        age, employed, has_transport, needs_to_dropoff_children
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
        )
        adults.append(adult)

    household: list[Agent] = [*adults, *children]
    return household


def create_agents_from_network(
    bounds: dict[str, float],
    buildings: list[Building],
    transport_routes: list,
    country_code: str = "IRL",
) -> list[Agent]:
    total_population = calculate_population_from_bounds(bounds, country_code)
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
            home, buildings, schools, kindergartens, has_transport
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
