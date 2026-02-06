import logging

logger = logging.getLogger(__name__)

POPULATION_DENSITY = {
    "IRL": 70,
    "GBR": 275,
    "USA": 36,
    "DEU": 240,
    "FRA": 119,
    "NLD": 508,
    "BEL": 383,
    "ESP": 94,
    "PRT": 111,
    "ITA": 200,
}

DEFAULT_DENSITY = 100


def get_population_density(country_code: str) -> int:
    return POPULATION_DENSITY.get(country_code, DEFAULT_DENSITY)


def estimate_population(area_km2: float, country_code: str) -> int:
    density = get_population_density(country_code)
    estimated_pop = int(area_km2 * density)
    logger.info(
        f"Estimated population: {estimated_pop} "
        f"(area: {area_km2:.2f} km², density: {density}/km²)"
    )
    return estimated_pop
