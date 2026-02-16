import random

from models import Building, Child


def assign_school_to_child(
    child: Child, schools: list[Building], kindergartens: list[Building]
) -> Child:
    age = child.age
    school = None
    needs_dropoff = False

    if 3 <= age <= 5:
        if kindergartens:
            school = random.choice(kindergartens)
            needs_dropoff = True
    elif 6 <= age <= 11:
        if schools:
            school = random.choice(schools)
            needs_dropoff = True
    elif 12 <= age <= 17:
        if schools:
            school = random.choice(schools)
            needs_dropoff = False

    return child.model_copy(update={"school": school, "needs_dropoff": needs_dropoff})


def get_schools_from_buildings(
    buildings: list[Building],
) -> tuple[list[Building], list[Building]]:
    schools = [b for b in buildings if b.type == "school"]
    kindergartens = [b for b in buildings if b.type == "kindergarten"]
    return schools, kindergartens
