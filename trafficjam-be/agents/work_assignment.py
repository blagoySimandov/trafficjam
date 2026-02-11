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


def assign_work_location(agent: Adult, buildings: list[Building]) -> Adult:
    work_categories = categorize_work_buildings(buildings)
    # Filter to non-empty categories, pair with buildings
    available = [(cat, bldgs) for cat, bldgs in work_categories.items() if bldgs]
    if not available:
        return agent

    # Get weights for available categories only
    weights = [WORK_CATEGORY_WEIGHTS[cat] for cat, _ in available]

    # random.choices handles non-normalized weights automatically
    category, category_buildings = random.choices(available, weights=weights)[0]

    agent.work = random.choice(category_buildings)
    agent.work_type = category
    return agent
