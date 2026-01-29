from typing import Dict, List, Tuple
import random


def categorize_work_buildings(buildings: List[Dict]) -> Dict[str, List[Dict]]:
    return {
        "supermarket": [b for b in buildings if b["type"] == "supermarket"],
        "healthcare": [
            b for b in buildings if b["type"] in ["hospital", "clinic", "doctors"]
        ],
        "education": [b for b in buildings if b["type"] in ["school", "kindergarten"]],
        "retail": [b for b in buildings if b["type"] == "retail"],
    }


def calculate_work_distribution_weights(
    work_categories: Dict[str, List[Dict]],
) -> Tuple[List[Tuple[str, List[Dict]]], List[float]]:
    base_weights = {
        "supermarket": 0.15,
        "healthcare": 0.20,
        "education": 0.15,
        "retail": 0.50,
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


def assign_work_location(agent: Dict, buildings: List[Dict]) -> None:
    work_categories = categorize_work_buildings(buildings)
    available_categories, weights = calculate_work_distribution_weights(work_categories)

    if not available_categories:
        return

    category, category_buildings = random.choices(
        available_categories, weights=weights
    )[0]
    work_building = random.choice(category_buildings)

    agent["work_building_id"] = work_building["id"]
    agent["work_location"] = work_building["position"]
    agent["work_type"] = category
