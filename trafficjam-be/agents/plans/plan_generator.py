import random
from datetime import time

from haversine import haversine

from ..models import (
    Agent,
    Adult,
    Child,
    Building,
    HotspotConfig,
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
from ..config import AgentConfig
from .strategies import PlanStrategy
from ..constants import SHOP_TYPES


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


def _minutes_to_time(minutes: int) -> time:
    return time(hour=minutes // 60, minute=minutes % 60)


def _find_nearby_shopping(
    home: Building, buildings: list[Building], agent_config: AgentConfig
) -> Building | None:
    home_pos = (home.position[1], home.position[0])

    shops = []
    for b in buildings:
        is_shop = b.type in SHOP_TYPES
        has_tag = b.get_tag("shop") or b.get_tag("amenity") == "marketplace"
        if is_shop or has_tag:
            b_pos = (b.position[1], b.position[0])
            dist = haversine(home_pos, b_pos)
            if dist <= agent_config.max_shopping_distance_km:
                shops.append((b, dist))

    if not shops:
        return None

    shops.sort(key=lambda x: x[1])
    return random.choice(shops[: min(5, len(shops))])[0]


def generate_plan_adult_dropoff_work(
    adult: Adult, agent_config: AgentConfig
) -> DailyPlan:
    child = adult.children[0]
    mode = _get_mode(adult)
    plan = DailyPlan()

    assert child.school is not None
    assert adult.work is not None

    _add(
        plan,
        ActivityType.HOME,
        adult.home.position,
        end_time=generate_departure_time_school(child.age, agent_config),
    )
    _add(
        plan,
        ActivityType.EDUCATION,
        child.school.position,
        mode,
        duration=time(
            minute=random.randint(
                agent_config.child_dropoff_min_minutes,
                agent_config.child_dropoff_max_minutes,
            )
        ),
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
        duration=time(
            minute=random.randint(
                agent_config.child_dropoff_min_minutes,
                agent_config.child_dropoff_max_minutes,
            )
        ),
    )
    _add(plan, ActivityType.HOME, adult.home.position, mode)

    return plan


def generate_plan_adult_work(
    adult: Adult,
    buildings: list[Building],
    agent_config: AgentConfig,
    with_shopping: bool = True,
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

    if with_shopping and should_go_shopping(agent_config):
        shop = _find_nearby_shopping(adult.home, buildings, agent_config)
        if shop:
            _add(
                plan,
                ActivityType.SHOPPING,
                shop.position,
                mode,
                duration=generate_errand_duration(agent_config),
            )

    _add(plan, ActivityType.HOME, adult.home.position, mode)

    return plan


def generate_plan_child(
    child: Child,
    agent_config: AgentConfig,
) -> DailyPlan | None:
    if (
        child.needs_dropoff
        or not child.school
        or child.age < agent_config.min_independent_school_age
    ):
        return None

    mode = _get_mode(child)
    plan = DailyPlan()

    _add(
        plan,
        ActivityType.HOME,
        child.home.position,
        end_time=generate_departure_time_school(child.age, agent_config),
    )
    _add(
        plan,
        ActivityType.EDUCATION,
        child.school.position,
        mode,
        duration=generate_school_duration(child.age, agent_config),
    )
    _add(plan, ActivityType.HOME, child.home.position, mode)

    return plan


def _generate_errand_plan(
    adult: Adult,
    buildings: list[Building],
    agent_config: AgentConfig,
    healthcare_chance: float = 0.0,
) -> DailyPlan:
    mode = _get_mode(adult)
    plan = DailyPlan()

    _add(
        plan,
        ActivityType.HOME,
        adult.home.position,
        end_time=generate_departure_time_elderly(),
    )

    shop = _find_nearby_shopping(adult.home, buildings, agent_config)
    if shop:
        act_type = (
            ActivityType.HEALTHCARE
            if healthcare_chance > 0 and random.random() < healthcare_chance
            else ActivityType.SHOPPING
        )
        _add(
            plan,
            act_type,
            shop.position,
            mode,
            duration=generate_errand_duration(agent_config),
        )

    _add(plan, ActivityType.HOME, adult.home.position, mode)

    return plan


def generate_plan_non_employed(
    adult: Adult, buildings: list[Building], agent_config: AgentConfig
) -> DailyPlan | None:
    if adult.employed or adult.age >= agent_config.elderly_age_threshold:
        return None
    return _generate_errand_plan(adult, buildings, agent_config)


def generate_plan_elderly(
    adult: Adult, buildings: list[Building], agent_config: AgentConfig
) -> DailyPlan | None:
    if adult.age < agent_config.elderly_age_threshold:
        return None
    return _generate_errand_plan(
        adult, buildings, agent_config, healthcare_chance=agent_config.healthcare_chance
    )


def _get_agent_type(agent: Agent, agent_config: AgentConfig) -> str:
    if isinstance(agent, Child):
        return "older_child"
    assert isinstance(agent, Adult)
    if agent.age >= agent_config.elderly_age_threshold:
        return "elderly"
    if agent.employed:
        return "employed_adult"
    return "non_employed_adult"


def _get_hotspot_timing(agent_type: str, start_time_str: str | None) -> str | None:
    if start_time_str is None:
        return None
    h, m = map(int, start_time_str.split(":"))
    mins = h * 60 + m
    if agent_type == "employed_adult":
        if mins < 7 * 60 + 30:
            return "morning"
        if mins >= 16 * 60:
            return "evening"
        return None
    if agent_type == "older_child":
        if mins < 7 * 60 + 30:
            return "morning"
        if mins >= 14 * 60 + 30:
            return "evening"
        return None
    if mins < 9 * 60:
        return "morning"
    if mins < 17 * 60:
        return "daytime"
    return "evening"


def _compute_departure_time(hotspot: HotspotConfig) -> time:
    h, m = map(int, hotspot.startTime.split(":"))  # type: ignore[union-attr]
    departure_mins = max(0, h * 60 + m - random.randint(15, 45))
    return _minutes_to_time(departure_mins)


def _compute_dwell_time(hotspot: HotspotConfig) -> time:
    sh, sm = map(int, hotspot.startTime.split(":"))  # type: ignore[union-attr]
    eh, em = map(int, hotspot.endTime.split(":"))  # type: ignore[union-attr]
    return _minutes_to_time(max(5, (eh * 60 + em) - (sh * 60 + sm)))


def _insert_hotspot_into_plan(
    plan: DailyPlan, building: Building, hotspot: HotspotConfig, mode: str, timing: str
) -> None:
    departure = _compute_departure_time(hotspot)
    dwell = _compute_dwell_time(hotspot)
    activity = Activity(
        type=ActivityType.LEISURE, location=building.position, duration=dwell
    )
    if timing in ("morning", "daytime"):
        plan.prepend_activity_after_home(activity, departure, mode)
    elif timing == "evening":
        plan.append_evening_visit(activity, departure, mode)


def _append_hotspot_visit(
    plan: DailyPlan, buildings: list[Building], agent_type: str, mode: str
) -> None:
    eligible: list[tuple[Building, str]] = []
    for b in buildings:
        if not b.hotspot or b.hotspot.trafficPercentage <= 0:
            continue
        if not b.hotspot.startTime or not b.hotspot.endTime:
            continue
        if b.hotspot.agentTypes and agent_type not in b.hotspot.agentTypes:
            continue
        timing = _get_hotspot_timing(agent_type, b.hotspot.startTime)
        if timing is None:
            continue
        eligible.append((b, timing))
    if not eligible:
        return
    total = sum(b.hotspot.trafficPercentage for b, _ in eligible if b.hotspot) / 100.0
    if random.random() > min(total, 1.0):
        return
    weights = [b.hotspot.trafficPercentage for b, _ in eligible if b.hotspot]
    selected_building, selected_timing = random.choices(eligible, weights=weights)[0]
    if selected_building.hotspot:
        _insert_hotspot_into_plan(
            plan, selected_building, selected_building.hotspot, mode, selected_timing
        )


class ChildPlanStrategy:
    def supports(self, agent: Agent, config: AgentConfig) -> bool:
        return isinstance(agent, Child)

    def generate(
        self, agent: Agent, buildings: list[Building], config: AgentConfig
    ) -> DailyPlan | None:
        return generate_plan_child(agent, config)  # type: ignore[arg-type]


class AdultDropoffWorkStrategy:
    def supports(self, agent: Agent, config: AgentConfig) -> bool:
        return (
            isinstance(agent, Adult)
            and agent.needs_to_dropoff_children
            and agent.employed
            and bool(agent.children)
            and agent.children[0].school is not None
        )

    def generate(
        self, agent: Agent, buildings: list[Building], config: AgentConfig
    ) -> DailyPlan | None:
        return generate_plan_adult_dropoff_work(agent, config)  # type: ignore[arg-type]


class ElderlyStrategy:
    def supports(self, agent: Agent, config: AgentConfig) -> bool:
        return isinstance(agent, Adult) and agent.age >= config.elderly_age_threshold

    def generate(
        self, agent: Agent, buildings: list[Building], config: AgentConfig
    ) -> DailyPlan | None:
        return generate_plan_elderly(agent, buildings, config)  # type: ignore[arg-type]


class EmployedAdultStrategy:
    def supports(self, agent: Agent, config: AgentConfig) -> bool:
        return isinstance(agent, Adult) and agent.employed

    def generate(
        self, agent: Agent, buildings: list[Building], config: AgentConfig
    ) -> DailyPlan | None:
        return generate_plan_adult_work(agent, buildings, config)  # type: ignore[arg-type]


class NonEmployedAdultStrategy:
    def supports(self, agent: Agent, config: AgentConfig) -> bool:
        return isinstance(agent, Adult)

    def generate(
        self, agent: Agent, buildings: list[Building], config: AgentConfig
    ) -> DailyPlan | None:
        return generate_plan_non_employed(agent, buildings, config)  # type: ignore[arg-type]


PLAN_STRATEGIES: list[PlanStrategy] = [
    ChildPlanStrategy(),
    AdultDropoffWorkStrategy(),
    ElderlyStrategy(),
    EmployedAdultStrategy(),
    NonEmployedAdultStrategy(),
]


def generate_plan_for_agent(
    agent: Agent, buildings: list[Building], agent_config: AgentConfig
) -> DailyPlan | None:
    strategy = next(
        (s for s in PLAN_STRATEGIES if s.supports(agent, agent_config)), None
    )
    plan = strategy.generate(agent, buildings, agent_config) if strategy else None
    if plan is not None:
        _append_hotspot_visit(
            plan, buildings, _get_agent_type(agent, agent_config), _get_mode(agent)
        )
    return plan
