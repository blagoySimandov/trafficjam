from agents.config import AgentConfig
from agents.models import (
    ActivityType,
    Adult,
    Building,
    Child,
    TransportMode,
)
from agents.plans.plan_generator import (
    PLAN_STRATEGIES,
    AdultDropoffWorkStrategy,
    ChildPlanStrategy,
    ElderlyStrategy,
    EmployedAdultStrategy,
    NonEmployedAdultStrategy,
    generate_plan_for_agent,
)

CONFIG = AgentConfig()

BUILDING = Building(
    id="b1",
    osm_id=1,
    position=(8.68, 50.11),
    geometry=[(8.68, 50.11)],
    tags={},
)

SCHOOL = Building(
    id="school1",
    osm_id=2,
    position=(8.69, 50.12),
    geometry=[(8.69, 50.12)],
    tags={},
)

WORK = Building(
    id="work1",
    osm_id=3,
    position=(8.70, 50.13),
    geometry=[(8.70, 50.13)],
    tags={},
)


def make_child(
    *, age: int = 14, school: Building | None = SCHOOL, needs_dropoff: bool = False
) -> Child:
    return Child(
        id="child1",
        age=age,
        home=BUILDING,
        preferred_transport=TransportMode.WALK,
        school=school,
        needs_dropoff=needs_dropoff,
    )


def make_adult(
    *,
    age: int = 35,
    employed: bool = True,
    work: Building | None = WORK,
    needs_to_dropoff_children: bool = False,
    children: list[Child] | None = None,
) -> Adult:
    return Adult(
        id="adult1",
        age=age,
        home=BUILDING,
        preferred_transport=TransportMode.CAR,
        employed=employed,
        work=work,
        needs_to_dropoff_children=needs_to_dropoff_children,
        children=children or [],
    )


class TestChildPlanStrategy:
    strategy = ChildPlanStrategy()

    def test_supports_child(self):
        assert self.strategy.supports(make_child(), CONFIG) is True

    def test_does_not_support_adult(self):
        assert self.strategy.supports(make_adult(), CONFIG) is False

    def test_generate_returns_none_when_needs_dropoff(self):
        child = make_child(needs_dropoff=True)
        assert self.strategy.generate(child, [], CONFIG) is None

    def test_generate_returns_none_when_no_school(self):
        child = make_child(school=None)
        assert self.strategy.generate(child, [], CONFIG) is None

    def test_generate_returns_none_when_too_young(self):
        child = make_child(age=CONFIG.min_independent_school_age - 1)
        assert self.strategy.generate(child, [], CONFIG) is None

    def test_generate_returns_plan_for_independent_child(self):
        child = make_child(age=CONFIG.min_independent_school_age, needs_dropoff=False)
        plan = self.strategy.generate(child, [], CONFIG)
        assert plan is not None
        activity_types = [a.type for a in plan.activities]
        assert ActivityType.HOME in activity_types
        assert ActivityType.EDUCATION in activity_types


class TestAdultDropoffWorkStrategy:
    strategy = AdultDropoffWorkStrategy()

    def _dropoff_adult(self) -> Adult:
        child = make_child(needs_dropoff=True, school=SCHOOL)
        child.needs_dropoff = True
        return make_adult(
            needs_to_dropoff_children=True, employed=True, children=[child]
        )

    def test_supports_adult_with_dropoff_and_work(self):
        assert self.strategy.supports(self._dropoff_adult(), CONFIG) is True

    def test_does_not_support_child(self):
        assert self.strategy.supports(make_child(), CONFIG) is False

    def test_does_not_support_adult_without_dropoff(self):
        adult = make_adult(needs_to_dropoff_children=False)
        assert self.strategy.supports(adult, CONFIG) is False

    def test_does_not_support_unemployed_adult_with_dropoff(self):
        child = make_child(needs_dropoff=True)
        adult = make_adult(
            employed=False, needs_to_dropoff_children=True, children=[child]
        )
        assert self.strategy.supports(adult, CONFIG) is False

    def test_does_not_support_adult_with_child_without_school(self):
        child = make_child(needs_dropoff=True, school=None)
        adult = make_adult(
            needs_to_dropoff_children=True, employed=True, children=[child]
        )
        assert self.strategy.supports(adult, CONFIG) is False

    def test_generate_plan_contains_education_and_work(self):
        plan = self.strategy.generate(self._dropoff_adult(), [], CONFIG)
        assert plan is not None
        activity_types = [a.type for a in plan.activities]
        assert ActivityType.EDUCATION in activity_types
        assert ActivityType.WORK in activity_types


class TestElderlyStrategy:
    strategy = ElderlyStrategy()

    def test_supports_elderly_adult(self):
        adult = make_adult(age=CONFIG.elderly_age_threshold)
        assert self.strategy.supports(adult, CONFIG) is True

    def test_does_not_support_young_adult(self):
        adult = make_adult(age=CONFIG.elderly_age_threshold - 1)
        assert self.strategy.supports(adult, CONFIG) is False

    def test_does_not_support_child(self):
        assert self.strategy.supports(make_child(), CONFIG) is False

    def test_generate_returns_plan(self):
        adult = make_adult(age=CONFIG.elderly_age_threshold)
        plan = self.strategy.generate(adult, [], CONFIG)
        assert plan is not None
        assert plan.activities[0].type == ActivityType.HOME


class TestEmployedAdultStrategy:
    strategy = EmployedAdultStrategy()

    def test_supports_employed_adult(self):
        assert self.strategy.supports(make_adult(employed=True), CONFIG) is True

    def test_does_not_support_unemployed_adult(self):
        assert self.strategy.supports(make_adult(employed=False), CONFIG) is False

    def test_does_not_support_child(self):
        assert self.strategy.supports(make_child(), CONFIG) is False

    def test_generate_plan_contains_work(self):
        plan = self.strategy.generate(make_adult(), [], CONFIG)
        assert plan is not None
        activity_types = [a.type for a in plan.activities]
        assert ActivityType.WORK in activity_types


class TestNonEmployedAdultStrategy:
    strategy = NonEmployedAdultStrategy()

    def test_supports_unemployed_adult(self):
        assert self.strategy.supports(make_adult(employed=False), CONFIG) is True

    def test_supports_employed_adult_as_fallback(self):
        assert self.strategy.supports(make_adult(employed=True), CONFIG) is True

    def test_does_not_support_child(self):
        assert self.strategy.supports(make_child(), CONFIG) is False

    def test_generate_returns_none_for_employed(self):
        assert self.strategy.generate(make_adult(employed=True), [], CONFIG) is None

    def test_generate_returns_none_for_elderly(self):
        adult = make_adult(employed=False, age=CONFIG.elderly_age_threshold)
        assert self.strategy.generate(adult, [], CONFIG) is None

    def test_generate_returns_plan_for_non_employed(self):
        adult = make_adult(employed=False, age=CONFIG.elderly_age_threshold - 1)
        plan = self.strategy.generate(adult, [], CONFIG)
        assert plan is not None


class TestPlanStrategyRegistry:
    def test_registry_order_child_before_adults(self):
        child_idx = next(
            i for i, s in enumerate(PLAN_STRATEGIES) if isinstance(s, ChildPlanStrategy)
        )
        adult_idx = next(
            i
            for i, s in enumerate(PLAN_STRATEGIES)
            if isinstance(s, EmployedAdultStrategy)
        )
        assert child_idx < adult_idx

    def test_dropoff_strategy_before_employed_strategy(self):
        dropoff_idx = next(
            i
            for i, s in enumerate(PLAN_STRATEGIES)
            if isinstance(s, AdultDropoffWorkStrategy)
        )
        employed_idx = next(
            i
            for i, s in enumerate(PLAN_STRATEGIES)
            if isinstance(s, EmployedAdultStrategy)
        )
        assert dropoff_idx < employed_idx

    def test_elderly_strategy_before_employed_strategy(self):
        elderly_idx = next(
            i for i, s in enumerate(PLAN_STRATEGIES) if isinstance(s, ElderlyStrategy)
        )
        employed_idx = next(
            i
            for i, s in enumerate(PLAN_STRATEGIES)
            if isinstance(s, EmployedAdultStrategy)
        )
        assert elderly_idx < employed_idx

    def test_non_employed_strategy_is_last(self):
        assert isinstance(PLAN_STRATEGIES[-1], NonEmployedAdultStrategy)

    def test_all_strategy_types_present(self):
        types = {type(s) for s in PLAN_STRATEGIES}
        assert types == {
            ChildPlanStrategy,
            AdultDropoffWorkStrategy,
            ElderlyStrategy,
            EmployedAdultStrategy,
            NonEmployedAdultStrategy,
        }


class TestGeneratePlanForAgent:
    def test_child_gets_child_plan(self):
        child = make_child(age=CONFIG.min_independent_school_age, needs_dropoff=False)
        plan = generate_plan_for_agent(child, [], CONFIG)
        assert plan is not None
        assert ActivityType.EDUCATION in [a.type for a in plan.activities]

    def test_employed_adult_with_dropoff_gets_dropoff_plan(self):
        child = make_child(needs_dropoff=True, school=SCHOOL)
        adult = make_adult(needs_to_dropoff_children=True, children=[child])
        plan = generate_plan_for_agent(adult, [], CONFIG)
        assert plan is not None
        activity_types = [a.type for a in plan.activities]
        assert ActivityType.WORK in activity_types
        assert ActivityType.EDUCATION in activity_types

    def test_elderly_gets_elderly_plan(self):
        adult = make_adult(age=CONFIG.elderly_age_threshold, employed=False)
        plan = generate_plan_for_agent(adult, [], CONFIG)
        assert plan is not None

    def test_employed_adult_gets_work_plan(self):
        adult = make_adult(employed=True, needs_to_dropoff_children=False)
        plan = generate_plan_for_agent(adult, [], CONFIG)
        assert plan is not None
        assert ActivityType.WORK in [a.type for a in plan.activities]

    def test_independent_child_below_min_age_returns_none(self):
        child = make_child(
            age=CONFIG.min_independent_school_age - 1, needs_dropoff=False
        )
        plan = generate_plan_for_agent(child, [], CONFIG)
        assert plan is None

    def test_plan_starts_and_ends_at_home(self):
        adult = make_adult(employed=True)
        plan = generate_plan_for_agent(adult, [], CONFIG)
        assert plan is not None
        assert plan.activities[0].type == ActivityType.HOME
        assert plan.activities[-1].type == ActivityType.HOME

    def test_activities_and_legs_are_consistent(self):
        adult = make_adult(employed=True)
        plan = generate_plan_for_agent(adult, [], CONFIG)
        assert plan is not None
        assert len(plan.transport) == len(plan.activities) - 1
