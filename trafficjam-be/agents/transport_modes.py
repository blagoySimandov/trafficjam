from typing import Dict
import random


def get_transport_mode(agent: Dict, activity_type: str) -> str:
    # TODO: give a car to ~60-70% of the people above 18/20
    """
    Determine transport mode based on agent characteristics and activity.

    Args:
        agent: Agent dictionary with demographics
        activity_type: Type of activity being traveled to

    Returns:
        Transport mode: 'car', 'pt' (public transport), 'walk', 'bike'
    """
    if agent.get("uses_public_transport"):
        if random.random() > 0.8:
            return "pt"

    if agent["age"] < 16:
        if random.random() > 0.7:
            return "walk"
        else:
            return "car"

    if agent["age"] >= 16 and agent["age"] <= 25:
        if agent.get("is_student"):
            modes = ["pt", "bike", "walk", "car"]
            weights = [0.4, 0.2, 0.2, 0.2]
            return random.choices(modes, weights=weights)[0]

    if agent["age"] >= 65:
        if agent.get("has_car"):
            modes = ["car", "pt", "walk"]
            weights = [0.5, 0.3, 0.2]
            return random.choices(modes, weights=weights)[0]
        else:
            modes = ["pt", "walk"]
            weights = [0.6, 0.4]
            return random.choices(modes, weights=weights)[0]

    if activity_type in ["shopping", "healthcare"]:
        if agent.get("has_car"):
            modes = ["car", "pt", "walk"]
            weights = [0.6, 0.2, 0.2]
            return random.choices(modes, weights=weights)[0]
        else:
            modes = ["pt", "walk"]
            weights = [0.7, 0.3]
            return random.choices(modes, weights=weights)[0]

    if agent.get("has_car"):
        return "car"

    return "pt"
