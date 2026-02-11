import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class ActivityType(str, Enum):
    HOME = "h"
    WORK = "w"
    EDUCATION = "education"
    SHOPPING = "shopping"
    HEALTHCARE = "healthcare"
    LEISURE = "leisure"


@dataclass
class Activity:
    type: ActivityType
    x: float  # longitude (WGS84) or x coordinate
    y: float  # latitude (WGS84) or y coordinate
    end_time: Optional[str] = None  # HH:MM:SS format, None for last activity
    duration: Optional[str] = None  # HH:MM:SS format

    def to_dict(self) -> dict:
        result = {"type": self.type.value, "x": self.x, "y": self.y}
        if self.end_time:
            result["end_time"] = self.end_time
        if self.duration:
            result["dur"] = self.duration
        return result


@dataclass
class Leg:
    mode: str  # car, pt, walk, bike

    def to_dict(self) -> dict:
        return {"mode": self.mode}


@dataclass
class DailyPlan:
    activities: list[Activity] = field(default_factory=list)
    legs: list[Leg] = field(default_factory=list)

    def add_activity(self, activity: Activity, leg_mode: Optional[str] = None) -> None:
        """Add an activity to the plan, with optional leg before it."""
        if self.activities and leg_mode:
            self.legs.append(Leg(mode=leg_mode))
        self.activities.append(activity)


def format_time(hours: int, minutes: int, seconds: int = 0) -> str:
    """Format time as HH:MM:SS."""
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def format_duration(hours: int, minutes: int, seconds: int = 0) -> str:
    """Format duration as HH:MM:SS."""
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def generate_departure_time_adult() -> str:
    """Generate realistic departure time for adults going to work.

    Peak hours are 7:30-8:30 with weighted distribution.
    """
    rand = random.random()

    if rand < 0.05:
        # Early birds: 6:00-6:30
        hour = 6
        minute = random.randint(0, 29)
    elif rand < 0.15:
        # Early: 6:30-7:00
        hour = 6
        minute = random.randint(30, 59)
    elif rand < 0.35:
        # Pre-peak: 7:00-7:30
        hour = 7
        minute = random.randint(0, 29)
    elif rand < 0.65:
        # Peak: 7:30-8:00 (most common)
        hour = 7
        minute = random.randint(30, 59)
    elif rand < 0.85:
        # Peak: 8:00-8:30
        hour = 8
        minute = random.randint(0, 29)
    elif rand < 0.95:
        # Post-peak: 8:30-9:00
        hour = 8
        minute = random.randint(30, 59)
    else:
        # Late starters: 9:00-9:30
        hour = 9
        minute = random.randint(0, 29)

    second = random.randint(0, 59)
    return format_time(hour, minute, second)


def generate_departure_time_elderly() -> str:
    """Generate departure time for elderly (later start)."""
    hour = random.choices([9, 10, 11], weights=[0.4, 0.4, 0.2])[0]
    minute = random.randint(0, 59)
    return format_time(hour, minute)


def generate_departure_time_school(age: int) -> str:
    """Generate departure time for school based on age.

    Younger children typically leave earlier for dropoff.
    """
    if age < 6:
        # Kindergarten: around 8:00-8:30
        hour = 8
        minute = random.randint(0, 30)
    elif age < 12:
        # Primary school: 8:00-8:30
        hour = 8
        minute = random.randint(0, 30)
    else:
        # Secondary school: 7:30-8:15
        hour = random.choices([7, 8], weights=[0.6, 0.4])[0]
        if hour == 7:
            minute = random.randint(30, 59)
        else:
            minute = random.randint(0, 15)

    return format_time(hour, minute)


def generate_work_duration() -> str:
    """Generate work duration: 7-9 hours with weighted distribution."""
    hours = random.choices([7, 8, 9], weights=[0.25, 0.5, 0.25])[0]
    minutes = random.choice([0, 15, 30, 45])
    return format_duration(hours, minutes)


def generate_school_duration(age: int) -> str:
    """Generate school duration based on age."""
    if age < 6:
        # Kindergarten: 4-6 hours
        hours = random.randint(4, 6)
    elif age < 12:
        # Primary school: 5-6 hours
        hours = random.randint(5, 6)
    else:
        # Secondary school: 6-7 hours
        hours = random.randint(6, 7)

    minutes = random.choice([0, 30])
    return format_duration(hours, minutes)


def generate_shopping_duration() -> str:
    """Generate shopping duration: 30-60 minutes."""
    minutes = random.randint(30, 60)
    return format_duration(0, minutes)


def generate_healthcare_duration() -> str:
    """Generate healthcare visit duration: 30-90 minutes."""
    minutes = random.randint(30, 90)
    return format_duration(0, minutes)


def generate_errand_duration() -> str:
    """Generate general errand duration: 30-120 minutes."""
    minutes = random.randint(30, 120)
    hours = minutes // 60
    minutes = minutes % 60
    return format_duration(hours, minutes)


def should_go_shopping() -> bool:
    """Determine if adult should go shopping after work (~40% chance)."""
    return random.random() < 0.40
