import random
from haversine import haversine
from datetime import time

from models import Agent, Adult, Child, Building, TransportMode
from models import (
    Activity,
    DailyPlan,
    ActivityType,
)
from .activity_scheduler import (
    generate_departure_time_adult,
    generate_departure_time_school,
    generate_work_duration,
    generate_school_duration,
    generate_errand_duration,
    should_go_shopping,
)


def _transport_mode_to_string(mode: TransportMode) -> str:
    mode_map = {
        TransportMode.CAR: "car",
        TransportMode.PUBLIC_TRANSPORT: "pt",
        TransportMode.WALK: "walk",
        TransportMode.BIKE: "bike",
    }
    return mode_map.get(mode, "walk")


def _find_nearby_shopping(
    home: Building, buildings: list[Building], max_distance_m: float = 2000
) -> Building | None:
    """Find a nearby shopping location (supermarket/retail)."""
    home_lon, home_lat = home.position

    shopping_buildings = []
    for b in buildings:
        if b.type in ["supermarket", "retail", "shop", "commercial"]:
            b_lon, b_lat = b.position
            distance = haversine((home_lat, home_lon), (b_lat, b_lon))
            if distance <= max_distance_m:
                shopping_buildings.append((b, distance))

    # Also check tags for shop types
    for b in buildings:
        if b.get_tag("shop") or b.get_tag("amenity") == "marketplace":
            b_lon, b_lat = b.position
            distance = haversine((home_lat, home_lon), (b_lat, b_lon))
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


def generate_plan_adult_dropoff_work(adult: Adult) -> DailyPlan | None:
    child_with_school = next((c for c in adult.children if c.school is not None), None)
    if not child_with_school:
        return None

    school = child_with_school.school
    home = adult.home
    work = adult.work
    mode = _transport_mode_to_string(adult.preferred_transport)

    plan = DailyPlan()

    home_lon, home_lat = home.position
    if school:  # TODO: this check feels redundante since should be checked before this func call
        school_lon, school_lat = school.position
        dropoff_duration = time(minute=random.randint(10, 15))
        plan.add_activity(
            Activity(
                type=ActivityType.EDUCATION,
                location=(school_lon, school_lat),
                duration=dropoff_duration,
            ),
            leg_mode=mode,
        )

        pickup_duration = time(minute=random.randint(10, 15))
        plan.add_activity(
            Activity(
                type=ActivityType.EDUCATION,
                location=(school_lon, school_lat),
                duration=pickup_duration,
            ),
            leg_mode=mode,
        )

    if work:
        work_lon, work_lat = work.position

        work_duration = generate_work_duration()
        plan.add_activity(
            Activity(
                type=ActivityType.WORK,
                location=(work_lon, work_lat),
                duration=work_duration,
            ),
            leg_mode=mode,
        )

    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            location=(home_lon, home_lat),
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_adult_work_shopping(
    adult: Adult, buildings: list[Building]
) -> DailyPlan | None:
    if not adult.employed or not adult.work:  # TODO: this check is also redundant
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
            location=(home_lon, home_lat),
            end_time=departure_time,
        )
    )

    # Work
    work_duration = generate_work_duration()
    plan.add_activity(
        Activity(
            type=ActivityType.WORK,
            location=(work_lon, work_lat),
            duration=work_duration,
        ),
        leg_mode=mode,
    )

    # Maybe shopping
    if should_go_shopping():
        shopping_location = _find_nearby_shopping(home, buildings)
        if shopping_location:
            shop_lon, shop_lat = shopping_location.position
            shopping_duration = generate_errand_duration()
            plan.add_activity(
                Activity(
                    type=ActivityType.SHOPPING,
                    location=(shop_lon, shop_lat),
                    duration=shopping_duration,
                ),
                leg_mode=mode,
            )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            location=(home_lon, home_lat),
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_adult_work_only(adult: Adult) -> DailyPlan | None:
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
            location=(home_lon, home_lat),
            end_time=departure_time,
        )
    )

    # Work
    work_duration = generate_work_duration()
    plan.add_activity(
        Activity(
            type=ActivityType.WORK,
            location=(work_lon, work_lat),
            duration=work_duration,
        ),
        leg_mode=mode,
    )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            location=(home_lon, home_lat),
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_child(child: Child) -> DailyPlan | None:
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
            location=(home_lon, home_lat),
            end_time=departure_time,
        )
    )

    # School
    school_duration = generate_school_duration(child.age)
    plan.add_activity(
        Activity(
            type=ActivityType.EDUCATION,
            location=(school_lon, school_lat),
            duration=school_duration,
        ),
        leg_mode=mode,
    )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            location=(home_lon, home_lat),
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_non_employed(
    adult: Adult, buildings: list[Building]
) -> DailyPlan | None:
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
    departure_time = generate_departure_time_adult()
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            location=(home_lon, home_lat),
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
                location=(shop_lon, shop_lat),
                duration=errand_duration,
            ),
            leg_mode=mode,
        )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            location=(home_lon, home_lat),
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_elderly(adult: Adult, buildings: list[Building]) -> DailyPlan | None:
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
    departure_time = generate_departure_time_adult()
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            location=(home_lon, home_lat),
            end_time=departure_time,
        )
    )

    shopping_location = _find_nearby_shopping(home, buildings)
    if shopping_location:
        shop_lon, shop_lat = shopping_location.position
        errand_duration = generate_errand_duration()

        # Elderly more likely to do healthcare visits
        activity_type = (
            ActivityType.HEALTHCARE if random.random() < 0.3 else ActivityType.SHOPPING
        )

        plan.add_activity(
            Activity(
                type=activity_type,
                location=(shop_lon, shop_lat),
                duration=errand_duration,
            ),
            leg_mode=mode,
        )

    # Return home
    plan.add_activity(
        Activity(
            type=ActivityType.HOME,
            location=(home_lon, home_lat),
        ),
        leg_mode=mode,
    )

    return plan


def generate_plan_for_agent(
    agent: Agent, buildings: list[Building]
) -> DailyPlan | None:
    if isinstance(agent, Child):
        return generate_plan_child(agent)

    if isinstance(agent, Adult):
        if agent.needs_to_dropoff_children and agent.employed and agent.children:
            return generate_plan_adult_dropoff_work(agent)

        if agent.age >= 65:
            return generate_plan_elderly(agent, buildings)

        if agent.employed:
            # Randomly choose between work-only and work+shopping
            if agent.needs_to_dropoff_children:
                return generate_plan_adult_dropoff_work(agent)
            else:
                return generate_plan_adult_work_shopping(agent, buildings)

        # Non-employed, non-elderly
        return generate_plan_non_employed(agent, buildings)

    return None
