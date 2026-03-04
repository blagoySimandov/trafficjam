import logging

from .config import AgentConfig

logger = logging.getLogger(__name__)


def get_population_density(agent_config: AgentConfig) -> int:
    return agent_config.default_population_density


def estimate_population(area_km2: float, agent_config: AgentConfig) -> int:
    density = get_population_density(agent_config)
    estimated_pop = int(area_km2 * density)
    logger.info(
        f"Estimated population: {estimated_pop} "
        f"(area: {area_km2:.2f} km², density: {density}/km²)"
    )
    return estimated_pop
