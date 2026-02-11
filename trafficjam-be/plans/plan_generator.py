import random
from typing import Optional
from math import radians, sin, cos, sqrt, atan2

from models import Agent, Adult, Child, Building, TransportMode
from .activity_scheduler import (
    Activity,
    DailyPlan,
    ActivityType,
    generate_departure_time_adult,
    generate_departure_time_elderly,
    generate_departure_time_school,
    generate_work_duration,
    generate_school_duration,
    generate_shopping_duration,
    generate_errand_duration,
    should_go_shopping,
)


def _transport_mode_to_string(mode: TransportMode) -> str:
    """Convert TransportMode enum to MATSim mode string."""
    mode_map = {
        TransportMode.CAR: "car",
        TransportMode.PUBLIC_TRANSPORT: "pt",
        TransportMode.WALK: "walk",
        TransportMode.BIKE: "bike",
    }
    return mode_map.get(mode, "walk")


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in meters."""
    R = 6371000  # Earth radius in meters

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)

    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(
        delta_lon / 2
    ) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def _find_nearby_shopping(
    home: Building, buildings: list[Building], max_distance_m: float = 2000
) -> Optional[Building]:
    """Find a nearby shopping location (supermarket/retail)."""
    home_lon, home_lat = home.position

    shopping_buildings = []
    for b in buildings:
        if b.type in ["supermarket", "retail", "shop", "commercial"]:
            b_lon, b_lat = b.position
            distance = _haversine_distance(home_lat, home_lon, b_lat, b_lon)
            if distance <= max_distance_m:
                shopping_buildings.append((b, distance))

    # Also check tags for shop types
    for b in buildings:
        if b.get_tag("shop") or b.get_tag("amenity") == "marketplace":
            b_lon, b_lat = b.position
            distance = _haversine_distance(home_lat, home_lon, b_lat, b_lon)
            if distance <= max_distance_m:
                if b not in [sb[0] for sb in shopping_buildings]:
                    shopping_buildings.append((b, distance))

    if not shopping_buildings:
        return None

    # Weight by inverse distance (closer is more likely)
    shopping_buildings.sort(key=lambda x: x[1])
    # Take one of the closest 5
    candidates = shopping_buildings[: min(5, len(shopping_buildings))]
    return random.choice(candidates)[0]


def generate_plan_adult_dropoff_work(
    adult: Adult, buildings: list[Building]
) -> Optional[DailyPlan]:
    """Generate plan: home -> school -> work -> school -> home.

    For employed adults who need to drop off children.
    """
    if not adult.employed or not adult.work or not adult.needs_to_dropoff_children:
        return None

    if not adult.children:
        return None

    # Get the first child's school (they typically go to the same school)
    child_with_school = next(
        (c for c in adult.children if c.school is not None), None
    )
    if not child_with_school:
        return None

    school = child_with_school.school
    home = adult.home
    work = adult.work
    mode = _transport_mode_to_string(adult.preferred_transport)

    home_lon, home_lat = home.position
    school_lon, school_lat = school.position
    work_lon, work_lat = work.position

    plan = DailyPlan()

    # Morning: home -> school
    departure_time = generate_departure_time_school(child_with_school.age)
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
            end_time=departure_time,
        )
    )

    # Quick dropoff at school (10-15 min)
    dropoff_duration = f"00:{random.randint(10, 15):02d}:00"
    plan.add_activity(
        Activity(
            type=ActivityType.EDUCATION,
            x=school_lon,
            y=school_lat,
            duration=dropoff_duration,
        ),
        leg_mode=mode,
    )

    # Work
    work_duration = generate_work_duration()
    plan.add_activity(
        Activity(
            type=ActivityType.WORK,
            x=work_lon,
            y=work_lat,
            duration=work_duration,
        ),
        leg_mode=mode,
    )

    # Pickup from school (10-15 min)
    pickup_duration = f"00:{random.randint(10, 15):02d}:00"
    plan.add_activity(
        Activity(
            type=ActivityType.EDUCATION,
            x=school_lon,
            y=school_lat,
            duration=pickup_duration,
        ),
        leg_mode=mode,
    )

    # Return home (no end_time for last activity)
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_adult_work_shopping(
    adult: Adult, buildings: list[Building]
) -> Optional[DailyPlan]:
    """Generate plan: home -> work -> shopping (sometimes) -> home.

    For employed adults without children dropoff duty.
    ~40% chance to go shopping after work.
    """
    if not adult.employed or not adult.work:
        return None

    home = adult.home
    work = adult.work
    mode = _transport_mode_to_string(adult.preferred_transport)

    home_lon, home_lat = home.position
    work_lon, work_lat = work.position

    plan = DailyPlan()

    # Morning: leave home
    departure_time = generate_departure_time_adult()
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
            end_time=departure_time,
        )
    )

    # Work
    work_duration = generate_work_duration()
    plan.add_activity(
        Activity(
            type=ActivityType.WORK,
            x=work_lon,
            y=work_lat,
            duration=work_duration,
        ),
        leg_mode=mode,
    )

    # Maybe shopping
    if should_go_shopping():
        shopping_location = _find_nearby_shopping(home, buildings)
        if shopping_location:
            shop_lon, shop_lat = shopping_location.position
            shopping_duration = generate_shopping_duration()
            plan.add_activity(
                Activity(
                    type=ActivityType.SHOPPING,
                    x=shop_lon,
                    y=shop_lat,
                    duration=shopping_duration,
                ),
                leg_mode=mode,
            )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_adult_work_only(adult: Adult) -> Optional[DailyPlan]:
    """Generate plan: home -> work -> home.

    Simple work commute for employed adults.
    """
    if not adult.employed or not adult.work:
        return None

    home = adult.home
    work = adult.work
    mode = _transport_mode_to_string(adult.preferred_transport)

    home_lon, home_lat = home.position
    work_lon, work_lat = work.position

    plan = DailyPlan()

    # Morning
    departure_time = generate_departure_time_adult()
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
            end_time=departure_time,
        )
    )

    # Work
    work_duration = generate_work_duration()
    plan.add_activity(
        Activity(
            type=ActivityType.WORK,
            x=work_lon,
            y=work_lat,
            duration=work_duration,
        ),
        leg_mode=mode,
    )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_child(child: Child) -> Optional[DailyPlan]:
    """Generate plan: home -> school -> home.

    For children aged 12-17 who travel independently.
    Children needing dropoff are handled by their parent's plan.
    """
    if child.needs_dropoff or not child.school:
        return None

    if child.age < 12:
        return None

    home = child.home
    school = child.school
    mode = _transport_mode_to_string(child.preferred_transport)

    home_lon, home_lat = home.position
    school_lon, school_lat = school.position

    plan = DailyPlan()

    # Morning
    departure_time = generate_departure_time_school(child.age)
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
            end_time=departure_time,
        )
    )

    # School
    school_duration = generate_school_duration(child.age)
    plan.add_activity(
        Activity(
            type=ActivityType.EDUCATION,
            x=school_lon,
            y=school_lat,
            duration=school_duration,
        ),
        leg_mode=mode,
    )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_non_employed(
    adult: Adult, buildings: list[Building]
) -> Optional[DailyPlan]:
    """Generate plan: home -> shopping/healthcare -> home.

    For non-employed adults (not elderly).
    """
    if adult.employed or adult.age >= 65:
        return None

    home = adult.home
    mode = _transport_mode_to_string(adult.preferred_transport)

    home_lon, home_lat = home.position

    plan = DailyPlan()

    # Later departure
    departure_time = generate_departure_time_elderly()  # Similar timing
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
            end_time=departure_time,
        )
    )

    # Shopping or other errand
    shopping_location = _find_nearby_shopping(home, buildings)
    if shopping_location:
        shop_lon, shop_lat = shopping_location.position
        errand_duration = generate_errand_duration()
        plan.add_activity(
            Activity(
                type=ActivityType.SHOPPING,
                x=shop_lon,
                y=shop_lat,
                duration=errand_duration,
            ),
            leg_mode=mode,
        )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_elderly(
    adult: Adult, buildings: list[Building]
) -> Optional[DailyPlan]:
    """Generate plan: home (late) -> errands -> home.

    For adults aged 65+.
    """
    if adult.age < 65:
        return None

    home = adult.home
    mode = _transport_mode_to_string(adult.preferred_transport)

    home_lon, home_lat = home.position

    plan = DailyPlan()

    # Late start
    departure_time = generate_departure_time_elderly()
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
            end_time=departure_time,
        )
    )

    # Errands (shopping, healthcare, etc.)
    shopping_location = _find_nearby_shopping(home, buildings)
    if shopping_location:
        shop_lon, shop_lat = shopping_location.position
        errand_duration = generate_errand_duration()

        # Elderly more likely to do healthcare visits
        activity_type = (
            ActivityType.HEALTHCARE
            if random.random() < 0.3
            else ActivityType.SHOPPING
        )

        plan.add_activity(
            Activity(
                type=activity_type,
                x=shop_lon,
                y=shop_lat,
                duration=errand_duration,
            ),
            leg_mode=mode,
        )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            x=home_lon,
            y=home_lat,
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_for_agent(
    agent: Agent, buildings: list[Building]
) -> Optional[DailyPlan]:
    """Generate a daily plan for an agent based on their type and attributes."""

    if isinstance(agent, Child):
        return generate_plan_child(agent)

    if isinstance(agent, Adult):
        # Priority order for adults
        if agent.needs_to_dropoff_children and agent.employed:
            return generate_plan_adult_dropoff_work(agent, buildings)

        if agent.age >= 65:
            return generate_plan_elderly(agent, buildings)

        if agent.employed:
            # Randomly choose between work-only and work+shopping
            if agent.needs_to_dropoff_children:
                return generate_plan_adult_dropoff_work(agent, buildings)
            else:
                return generate_plan_adult_work_shopping(agent, buildings)

        # Non-employed, non-elderly
        return generate_plan_non_employed(agent, buildings)

    return None
