import random
from datetime import time

from .config import (
    config,
    ADULT_DEPARTURE_CUMULATIVE_PROBS,
    ELDERLY_DEPARTURE_HOURS,
    ELDERLY_DEPARTURE_WEIGHTS,
    WORK_HOURS,
    WORK_HOURS_WEIGHTS,
    WORK_MINUTES_CHOICES,
    SCHOOL_DEPARTURE_HOURS,
    SCHOOL_DEPARTURE_WEIGHTS,
)


def generate_departure_time_adult() -> time:
    rand = random.random()
    p = ADULT_DEPARTURE_CUMULATIVE_PROBS

    if rand < p[0]:
        hour, minute = 6, random.randint(0, 29)
    elif rand < p[1]:
        hour, minute = 6, random.randint(30, 59)
    elif rand < p[2]:
        hour, minute = 7, random.randint(0, 29)
    elif rand < p[3]:
        hour, minute = 7, random.randint(30, 59)
    elif rand < p[4]:
        hour, minute = 8, random.randint(0, 29)
    elif rand < p[5]:
        hour, minute = 8, random.randint(30, 59)
    else:
        hour, minute = 9, random.randint(0, 29)

    return time(hour, minute)


def generate_departure_time_elderly() -> time:
    hour = random.choices(ELDERLY_DEPARTURE_HOURS, weights=ELDERLY_DEPARTURE_WEIGHTS)[0]
    return time(hour, random.randint(0, 59))


def generate_departure_time_school(age: int) -> time:
    if age < config.min_independent_school_age:
        hour, minute = 8, random.randint(0, 30)
    else:
        hour = random.choices(SCHOOL_DEPARTURE_HOURS, weights=SCHOOL_DEPARTURE_WEIGHTS)[0]
        minute = random.randint(30, 59) if hour == 7 else random.randint(0, 15)

    return time(hour, minute)


def generate_work_duration() -> time:
    hours = random.choices(WORK_HOURS, weights=WORK_HOURS_WEIGHTS)[0]
    minutes = random.choice(WORK_MINUTES_CHOICES)
    return time(hours, minutes)


def generate_school_duration(age: int) -> time:
    if age < config.kindergarten_age:
        hours = random.randint(4, 6)
    elif age < config.min_independent_school_age:
        hours = random.randint(5, 6)
    else:
        hours = random.randint(6, 7)

    return time(hours, random.choice([0, 30]))


def generate_errand_duration() -> time:
    total_minutes = random.randint(config.errand_min_minutes, config.errand_max_minutes)
    return time(total_minutes // 60, total_minutes % 60)


def should_go_shopping() -> bool:
    return random.random() < config.shopping_probability
