"""Daily activity plan generation for MATSim agents."""
from typing import List, Dict
import random


def add_time_variation(base_time: str, max_minutes: int = 30) -> str:
    """Add random variation to a time string."""
    h, m, _ = map(int, base_time.split(":"))
    total_minutes = h * 60 + m
    variation = random.randint(-max_minutes, max_minutes)
    new_minutes = max(0, min(1439, total_minutes + variation))
    return f"{new_minutes // 60:02d}:{new_minutes % 60:02d}:00"


def time_to_seconds(time_str: str) -> int:
    """Convert HH:MM:SS to seconds since midnight."""
    h, m, s = map(int, time_str.split(":"))
    return h * 3600 + m * 60 + s


def generate_daily_plan(agent: Dict) -> List[Dict]:
    """
    Generate a realistic daily activity plan for an agent.

    Plans include:
    - Work/school activities
    - Shopping trips (supermarkets)
    - Healthcare visits (occasional)
    - School drop-offs/pick-ups for parents
    - Leisure activities
    - Public transport usage

    Args:
        agent: Agent dictionary with home/work locations and demographics

    Returns:
        List of activities with timing, locations, and transport modes
    """
    activities = []

    morning_start = add_time_variation("06:30:00", 60)

    activities.append(
        {
            "type": "home",
            "location": agent["home_location"],
            "start_time": "00:00:00",
            "end_time": morning_start,
        }
    )

    has_children = agent.get("children") and len(agent["children"]) > 0

    if has_children:
        dropoff_time = add_time_variation("08:00:00", 20)
        child = agent["children"][0]

        activities.append(
            {
                "type": f'dropoff_{child["school_type"]}',
                "location": child["school_location"],
                "start_time": morning_start,
                "end_time": dropoff_time,
            }
        )

        morning_start = dropoff_time

    if agent.get("employed") and agent.get("work_location"):
        work_start = add_time_variation("09:00:00", 30)
        work_end = add_time_variation("17:00:00", 30)

        activities.append(
            {
                "type": "work",
                "location": agent["work_location"],
                "start_time": work_start,
                "end_time": work_end,
            }
        )

        if random.random() > 0.7 and agent.get("preferred_supermarket"):
            shopping_end = add_time_variation("18:30:00", 20)
            activities.append(
                {
                    "type": "shopping",
                    "location": agent["preferred_supermarket"],
                    "start_time": work_end,
                    "end_time": shopping_end,
                }
            )
            work_end = shopping_end

        if has_children:
            pickup_time = add_time_variation("15:30:00", 20)
            child = agent["children"][0]

            if time_to_seconds(pickup_time) > time_to_seconds(work_end):
                pickup_time = add_time_variation(work_end, 15)

            activities.append(
                {
                    "type": f'pickup_{child["school_type"]}',
                    "location": child["school_location"],
                    "start_time": work_end,
                    "end_time": pickup_time,
                }
            )
            work_end = pickup_time

        activities.append(
            {
                "type": "home",
                "location": agent["home_location"],
                "start_time": work_end,
                "end_time": "23:59:59",
            }
        )

    elif agent["age"] >= 3 and agent["age"] <= 18:
        school_location = agent.get("school_location", agent["home_location"])

        if agent["age"] <= 10:
            school_start = "08:30:00"
            school_end = "15:00:00"
        else:
            school_start = "08:00:00"
            school_end = "15:30:00"

        activities.append(
            {
                "type": "education",
                "location": school_location,
                "start_time": add_time_variation(school_start, 15),
                "end_time": add_time_variation(school_end, 15),
            }
        )

        if (
            agent["age"] >= 16
            and random.random() > 0.6
            and agent.get("preferred_supermarket")
        ):
            activities.append(
                {
                    "type": "shopping",
                    "location": agent["preferred_supermarket"],
                    "start_time": add_time_variation("16:00:00", 30),
                    "end_time": add_time_variation("17:00:00", 30),
                }
            )

        activities.append(
            {
                "type": "home",
                "location": agent["home_location"],
                "start_time": add_time_variation("16:00:00", 60),
                "end_time": "23:59:59",
            }
        )

    elif agent.get("is_student") and agent.get("work_location"):
        uni_start = add_time_variation("10:00:00", 60)
        uni_end = add_time_variation("16:00:00", 60)

        activities.append(
            {
                "type": "education",
                "location": agent["work_location"],
                "start_time": uni_start,
                "end_time": uni_end,
            }
        )

        if random.random() > 0.5 and agent.get("preferred_supermarket"):
            activities.append(
                {
                    "type": "shopping",
                    "location": agent["preferred_supermarket"],
                    "start_time": uni_end,
                    "end_time": add_time_variation("18:00:00", 30),
                }
            )

        activities.append(
            {
                "type": "home",
                "location": agent["home_location"],
                "start_time": add_time_variation("18:00:00", 60),
                "end_time": "23:59:59",
            }
        )

    else:
        if random.random() > 0.6 and agent.get("preferred_supermarket"):
            shopping_start = add_time_variation("10:00:00", 120)
            shopping_end = add_time_variation("11:30:00", 60)

            activities.append(
                {
                    "type": "shopping",
                    "location": agent["preferred_supermarket"],
                    "start_time": shopping_start,
                    "end_time": shopping_end,
                }
            )

            activities.append(
                {
                    "type": "home",
                    "location": agent["home_location"],
                    "start_time": shopping_end,
                    "end_time": "23:59:59",
                }
            )
        else:
            activities.append(
                {
                    "type": "home",
                    "location": agent["home_location"],
                    "start_time": morning_start,
                    "end_time": "23:59:59",
                }
            )

    if random.random() > 0.95 and agent.get("preferred_healthcare"):
        activities.insert(
            -1,
            {
                "type": "healthcare",
                "location": agent["preferred_healthcare"],
                "start_time": add_time_variation("14:00:00", 120),
                "end_time": add_time_variation("15:00:00", 60),
            },
        )

    activities.sort(key=lambda x: time_to_seconds(x["start_time"]))

    return activities
