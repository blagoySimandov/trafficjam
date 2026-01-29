from typing import Dict, List
import random


def generate_age_distribution() -> int:
    return random.choices(
        [random.randint(0, 17), random.randint(18, 64), random.randint(65, 90)],
        weights=[0.2, 0.65, 0.15],
    )[0]


def assign_employment_status(agent: Dict) -> None:
    age = agent["age"]

    if 18 <= age < 65:
        agent["employed"] = random.random() > 0.1
        agent["is_student"] = 18 <= age <= 25 and random.random() > 0.3
    else:
        agent["employed"] = False
        agent["is_student"] = False


def assign_transport_mode(agent: Dict, has_transport: bool) -> None:
    age = agent["age"]

    if 16 <= age <= 25:
        agent["uses_public_transport"] = has_transport and random.random() > 0.4
    elif age >= 65:
        agent["uses_public_transport"] = has_transport and random.random() > 0.6
    elif not agent.get("employed"):
        agent["uses_public_transport"] = has_transport and random.random() > 0.5
    else:
        agent["uses_public_transport"] = has_transport and random.random() > 0.7

    agent["has_car"] = not agent["uses_public_transport"] or (
        age >= 25 and random.random() > 0.3
    )


def assign_amenity_preferences(agent: Dict, buildings: List[Dict]) -> None:
    supermarkets = [b for b in buildings if b["type"] == "supermarket"]
    if supermarkets:
        agent["preferred_supermarket"] = random.choice(supermarkets)["position"]

    hospitals = [b for b in buildings if b["type"] in ["hospital", "clinic", "doctors"]]
    if hospitals:
        agent["preferred_healthcare"] = random.choice(hospitals)["position"]
