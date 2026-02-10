from typing import Dict, List, Tuple
import random


from models import Building

SUPERMARKET_TAGS = ["supermarket", "convenience"]
HEALTHCARE_TAGS = ["hospital", "clinic", "pharmacy", "doctors", "dentist"]
EDUCATION_TAGS = ["school", "kindergarten"]
RETAIL_TAGS = ["clothes", "shoes", "florist"]
FOOD_TAGS = ["fast_food", "restaurant", "cafe"]


def categorize_work_buildings(buildings: list[Building]) -> dict[str, list[Building]]:
    return {
        "supermarket": [b for b in buildings if b.get_tag("shop") in SUPERMARKET_TAGS],
        "healthcare": [b for b in buildings if b.get_tag("amenity") in HEALTHCARE_TAGS],
        "education": [b for b in buildings if b.get_tag("amenity") in EDUCATION_TAGS],
        "retail": [b for b in buildings if b.get_tag("shop") in RETAIL_TAGS],
        "food": [b for b in buildings if b.get_tag("amenity") in FOOD_TAGS],
    }


def calculate_work_distribution_weights(
    work_categories: dict[str, list[Building]],
) -> Tuple[List[Tuple[str, List[Dict]]], List[float]]:
    base_weights = {
        "supermarket": 0.15,
        "healthcare": 0.15,
        "education": 0.15,
        "retail": 0.40,
        "food": 0.15,
    }

    available_categories = []
    weights = []

    for category, buildings in work_categories.items():
        if buildings:
            available_categories.append((category, buildings))
            weights.append(base_weights[category])

    total_weight = sum(weights)
    if total_weight > 0:
        weights = [w / total_weight for w in weights]

    return available_categories, weights


# NOTE: might have to make it use a loop for all the agents
def assign_work_location(agent: dict, buildings: List[Building]) -> None:
    work_categories = categorize_work_buildings(buildings)
    available_categories, weights = calculate_work_distribution_weights(work_categories)

    if not available_categories:
        return

    category, category_buildings = random.choices(
        available_categories, weights=weights
    )[0]
    work_building = random.choice(category_buildings)

    agent["work_building_id"] = work_building.id
    agent["work_location"] = work_building.position
    agent["work_type"] = category
