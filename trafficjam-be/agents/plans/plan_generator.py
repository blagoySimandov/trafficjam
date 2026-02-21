import random
from datetime import time

from haversine import haversine

from models import (
    Agent,
    Adult,
    Child,
    Building,
    TransportMode,
    Activity,
    DailyPlan,
    ActivityType,
)
from .activity_scheduler import (
    generate_departure_time_adult,
    generate_departure_time_elderly,
    generate_departure_time_school,
    generate_work_duration,
    generate_school_duration,
    generate_errand_duration,
    should_go_shopping,
)
from ..config import config
from constants import SHOP_TYPES


def _get_mode(agent: Agent) -> str:
    return {
        TransportMode.CAR: "car",
        TransportMode.PUBLIC_TRANSPORT: "pt",
        TransportMode.WALK: "walk",
        TransportMode.BIKE: "bike",
    }.get(agent.preferred_transport, "walk")


def _add(
    plan: DailyPlan,
    activity_type: ActivityType,
    position: tuple[float, float],
    leg_mode: str | None = None,
    end_time: time | None = None,
    duration: time | None = None,
) -> None:
    plan.add_activity(
        Activity(
            type=activity_type, location=position, end_time=end_time, duration=duration
        ),
        leg_mode=leg_mode,
    )


def _find_nearby_shopping(
    home: Building, buildings: list[Building], max_dist: float = config.max_shopping_distance_km
) -> Building | None:
    home_pos = (home.position[1], home.position[0])

    shops = []
    for b in buildings:
        is_shop = b.type in SHOP_TYPES
        has_tag = b.get_tag("shop") or b.get_tag("amenity") == "marketplace"
        if is_shop or has_tag:
            b_pos = (b.position[1], b.position[0])
            dist = haversine(home_pos, b_pos)
            if dist <= max_dist:
                shops.append((b, dist))

    if not shops:
        return None

    shops.sort(key=lambda x: x[1])
    return random.choice(shops[: min(5, len(shops))])[0]


def generate_plan_adult_dropoff_work(adult: Adult) -> DailyPlan:
    child = adult.children[0]
    mode = _get_mode(adult)
    plan = DailyPlan()

    assert child.school is not None
    assert adult.work is not None

    _add(
        plan,
        ActivityType.HOME,
        adult.home.position,
        end_time=generate_departure_time_school(child.age),
    )
    _add(
        plan,
        ActivityType.EDUCATION,
        child.school.position,
        mode,
        duration=time(minute=random.randint(config.child_dropoff_min_minutes, config.child_dropoff_max_minutes)),
    )
    _add(
        plan,
        ActivityType.WORK,
        adult.work.position,
        mode,
        duration=generate_work_duration(),
    )
    _add(
        plan,
        ActivityType.EDUCATION,
        child.school.position,
        mode,
        duration=time(minute=random.randint(config.child_dropoff_min_minutes, config.child_dropoff_max_minutes)),
    )
    _add(plan, ActivityType.HOME, adult.home.position, mode)

    return plan


def generate_plan_adult_work(
    adult: Adult, buildings: list[Building], with_shopping: bool = True
) -> DailyPlan | None:
    if not adult.employed or not adult.work:
        return None

    mode = _get_mode(adult)
    plan = DailyPlan()

    _add(
        plan,
        ActivityType.HOME,
        adult.home.position,
        end_time=generate_departure_time_adult(),
    )
    _add(
        plan,
        ActivityType.WORK,
        adult.work.position,
        mode,
        duration=generate_work_duration(),
    )

    if with_shopping and should_go_shopping():
        shop = _find_nearby_shopping(adult.home, buildings)
        if shop:
            _add(
                plan,
                ActivityType.SHOPPING,
                shop.position,
                mode,
                duration=generate_errand_duration(),
            )

    _add(plan, ActivityType.HOME, adult.home.position, mode)

    return plan


def generate_plan_child(child: Child) -> DailyPlan | None:
    if child.needs_dropoff or not child.school or child.age < config.min_independent_school_age:
        return None

    mode = _get_mode(child)
    plan = DailyPlan()

    _add(
        plan,
        ActivityType.HOME,
        child.home.position,
        end_time=generate_departure_time_school(child.age),
    )
    _add(
        plan,
        ActivityType.EDUCATION,
        child.school.position,
        mode,
        duration=generate_school_duration(child.age),
    )
    _add(plan, ActivityType.HOME, child.home.position, mode)

    return plan


def _generate_errand_plan(
    adult: Adult, buildings: list[Building], healthcare_chance: float = 0.0
) -> DailyPlan:
    mode = _get_mode(adult)
    plan = DailyPlan()

    _add(
        plan,
        ActivityType.HOME,
        adult.home.position,
        end_time=generate_departure_time_elderly(),
    )

    shop = _find_nearby_shopping(adult.home, buildings)
    if shop:
        act_type = (
            ActivityType.HEALTHCARE
            if healthcare_chance > 0 and random.random() < healthcare_chance
            else ActivityType.SHOPPING
        )
        _add(plan, act_type, shop.position, mode, duration=generate_errand_duration())

    _add(plan, ActivityType.HOME, adult.home.position, mode)

    return plan


def generate_plan_non_employed(
    adult: Adult, buildings: list[Building]
) -> DailyPlan | None:
    if adult.employed or adult.age >= config.elderly_age_threshold:
        return None
    return _generate_errand_plan(adult, buildings)


def generate_plan_elderly(adult: Adult, buildings: list[Building]) -> DailyPlan | None:
    if adult.age < config.elderly_age_threshold:
        return None
    return _generate_errand_plan(adult, buildings, healthcare_chance=config.healthcare_chance)


def generate_plan_for_agent(
    agent: Agent, buildings: list[Building]
) -> DailyPlan | None:
    if isinstance(agent, Child):
        return generate_plan_child(agent)

    if isinstance(agent, Adult):
        if (
            agent.needs_to_dropoff_children
            and agent.employed
            and agent.children
            and agent.children[0].school
        ):
            return generate_plan_adult_dropoff_work(agent)
        if agent.age >= config.elderly_age_threshold:
            return generate_plan_elderly(agent, buildings)
        if agent.employed:
            return generate_plan_adult_work(agent, buildings)
        return generate_plan_non_employed(agent, buildings)

    return None
