import random
from datetime import time


def generate_departure_time_adult() -> time:
    rand = random.random()

    if rand < 0.05:
        hour, minute = 6, random.randint(0, 29)
    elif rand < 0.15:
        hour, minute = 6, random.randint(30, 59)
    elif rand < 0.35:
        hour, minute = 7, random.randint(0, 29)
    elif rand < 0.65:
        hour, minute = 7, random.randint(30, 59)
    elif rand < 0.85:
        hour, minute = 8, random.randint(0, 29)
    elif rand < 0.95:
        hour, minute = 8, random.randint(30, 59)
    else:
        hour, minute = 9, random.randint(0, 29)

    return time(hour, minute)


def generate_departure_time_elderly() -> time:
    hour = random.choices([9, 10, 11], weights=[0.4, 0.4, 0.2])[0]
    return time(hour, random.randint(0, 59))


def generate_departure_time_school(age: int) -> time:
    if age < 12:
        hour, minute = 8, random.randint(0, 30)
    else:
        hour = random.choices([7, 8], weights=[0.6, 0.4])[0]
        minute = random.randint(30, 59) if hour == 7 else random.randint(0, 15)

    return time(hour, minute)


def generate_work_duration() -> time:
    hours = random.choices([7, 8, 9], weights=[0.25, 0.5, 0.25])[0]
    minutes = random.choice([0, 15, 30, 45])
    return time(hours, minutes)


def generate_school_duration(age: int) -> time:
    if age < 6:
        hours = random.randint(4, 6)
    elif age < 12:
        hours = random.randint(5, 6)
    else:
        hours = random.randint(6, 7)

    return time(hours, random.choice([0, 30]))


def generate_errand_duration() -> time:
    total_minutes = random.randint(30, 120)
    return time(total_minutes // 60, total_minutes % 60)


def should_go_shopping() -> bool:
    return random.random() < 0.40
