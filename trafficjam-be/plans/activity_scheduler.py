import random
from datetime import time


def generate_departure_time_adult() -> time:
    rand = random.random()

    if rand < 0.05:
        hour = 6
        minute = random.randint(0, 29)
    elif rand < 0.15:
        hour = 6
        minute = random.randint(30, 59)
    elif rand < 0.35:
        hour = 7
        minute = random.randint(0, 29)
    elif rand < 0.65:
        hour = 7
        minute = random.randint(30, 59)
    elif rand < 0.85:
        hour = 8
        minute = random.randint(0, 29)
    elif rand < 0.95:
        hour = 8
        minute = random.randint(30, 59)
    else:
        hour = 9
        minute = random.randint(0, 29)

    return time(hour=hour, minute=minute)


def generate_departure_time_school(age: int) -> time:
    if age < 6:
        hour = 8
        minute = random.randint(0, 30)
    elif age < 12:
        hour = 8
        minute = random.randint(0, 30)
    else:
        hour = random.choices([7, 8], weights=[0.6, 0.4])[0]
        if hour == 7:
            minute = random.randint(30, 59)
        else:
            minute = random.randint(0, 15)

    return time(hour=hour, minute=minute)


def generate_work_duration() -> time:
    hour = random.choices([7, 8, 9], weights=[0.25, 0.5, 0.25])[0]
    minute = random.choice([0, 15, 30, 45])

    return time(hour=hour, minute=minute)


def generate_school_duration(age: int) -> time:
    if age < 6:
        hour = random.randint(4, 6)
    elif age < 12:
        hour = random.randint(5, 6)
    else:
        hour = random.randint(6, 7)

    minute = random.choice([0, 30])
    return time(hour=hour, minute=minute)


def generate_errand_duration() -> time:
    minute = random.randint(60, 120)
    hours = minute // 60
    minute = minute % 60
    return time(hour=hours, minute=minute)


def should_go_shopping() -> bool:  # NOTE: might not need that
    return random.random() < 0.40
