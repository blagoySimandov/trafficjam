import logging

from .config import POPULATION_DENSITY
from .models import PlannerConfig

logger = logging.getLogger(__name__)


def get_population_density(country_code: str, config: PlannerConfig) -> int:
    return POPULATION_DENSITY.get(country_code, config.population_density)


def estimate_population(area_km2: float, country_code: str, config: PlannerConfig) -> int:
    density = get_population_density(country_code, config)
    estimated_pop = int(area_km2 * density)
    logger.info(
        f"Estimated population: {estimated_pop} "
        f"(area: {area_km2:.2f} km², density: {density}/km²)"
    )
    return estimated_pop
