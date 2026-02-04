from typing import Dict, List
import random


def assign_school_to_child(
    child: Dict, schools: List[Dict], kindergartens: List[Dict]
) -> None:
    age = child["age"]

    if 3 <= age <= 5:
        if kindergartens:
            school = random.choice(kindergartens)
            child["school_location"] = school["position"]
            child["needs_dropoff"] = True
    elif 6 <= age <= 11:
        if schools:
            school = random.choice(schools)
            child["school_location"] = school["position"]
            child["needs_dropoff"] = True
    elif 12 <= age <= 18:
        if schools:
            school = random.choice(schools)
            child["school_location"] = school["position"]
            child["needs_dropoff"] = False


def assign_children_to_parents(agents: List[Dict], building_dicts: List[Dict]) -> None:
    adults = [a for a in agents if 25 <= a["age"] <= 45]
    children = [a for a in agents if 3 <= a["age"] <= 18]

    schools = [b for b in building_dicts if b["type"] == "school"]
    kindergartens = [b for b in building_dicts if b["type"] == "kindergarten"]

    for child in children:
        assign_school_to_child(child, schools, kindergartens)

    children_needing_parents = [c for c in children if c.get("needs_dropoff")]

    for child in children_needing_parents:
        if adults:
            parent = random.choice(adults)

            if "children" not in parent:
                parent["children"] = []

            parent["children"].append(
                {
                    "id": child["id"],
                    "school_location": child.get("school_location"),
                }
            )
