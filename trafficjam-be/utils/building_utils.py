from typing import Any, Dict, List
import random
import logging

logger = logging.getLogger(__name__)


def extract_building_dict(building: Any) -> Dict:
    return {
        "id": building.id,
        "osmId": building.osmId,
        "position": building.position,
        "type": building.type,
        "tags": building.tags,
    }


def filter_by_type(buildings: List[Dict], building_types: List[str]) -> List[Dict]:
    return [b for b in buildings if b["type"] in building_types]


def distribute_agents_to_buildings(
    buildings: List[Dict], total_population: int
) -> Dict[str, int]:
    """Distributing how many agents go in a single building while,
    assuming that an apartment can take 3-4 agents"""

    residential_buildings = filter_by_type(buildings, ["apartments", "residential"])

    if not residential_buildings:
        logger.warning("No residential buildings found, distributing uniformly")
        residential_buildings = buildings[: max(1, len(buildings) // 2)]

    distribution = {}
    remaining = total_population

    for i, building in enumerate(residential_buildings):
        if i == len(residential_buildings) - 1:
            distribution[building["id"]] = remaining
        else:
            capacity = random.randint(
                1, max(2, remaining // (len(residential_buildings) - i))
            )
            distribution[building["id"]] = capacity
            remaining -= capacity

    logger.info(
        f"Distributed {total_population} agents to "
        f"{len(residential_buildings)} residential buildings"
    )
    return distribution
