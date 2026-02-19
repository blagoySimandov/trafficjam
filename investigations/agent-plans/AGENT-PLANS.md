# Agent Creation Overview

Generates a synthetic population of people with daily travel plans, exported as MATSim-compatible XML for traffic simulation.

---

## Pipeline

```
POST /plan_creation
        │
        ▼
calculate_population_from_bounds()   ← area km² × country density
        │
        ▼
create_household() × N               ← grouped by household, not individual
        │
        ├── create_child()  × 0-3
        └── create_adult()  × 1-2
              │
              ├── assign_school_to_child()
              └── assign_work_location()
        │
        ▼
generate_plan_for_agent()            ← per-agent based on profile
        │
        ▼
MATSimXMLWriter                      ← plans_v4.dtd XML
```

---

## Why Households, Not Individuals

Agents are generated in family units so children and parents can be coupled. A parent's plan is shaped by whether they have kids to drop off — you can't model that if agents are independent.

Only the first adult in a household gets dropoff duty to avoid two parents making the same school trip.

---

## Population Size

```python
area_km2 = haversine_area(bounds)
population = area_km2 × country_density[country_code]
num_households = population / 2.5
```

Country-level average densities are used (not urban density) so suburban areas don't get oversaturated. Ireland defaults to 70 people/km².

---

## Household Composition

```python
num_children = random.choices([0, 1, 2, 3], weights=[0.3, 0.35, 0.25, 0.1])
num_adults   = random.choices([1, 2],       weights=[0.3, 0.7])
```

- 30% childless households, 70% two-parent — roughly matches Western demographic norms
- Three-child households are rare (10%) to match declining birth rates

---

## School Assignment

| Age   | Facility           | Needs Dropoff? |
|-------|--------------------|----------------|
| 0–2   | None               | —              |
| 3–5   | Kindergarten       | Yes            |
| 6–11  | Primary school     | Yes            |
| 12–17 | Secondary school   | No             |

Under-12s need dropoff so a parent trip is generated. Teens travel independently, which keeps parent plans simpler and reflects real behaviour.

---

## Work Assignment

Workplaces are selected by category with weighted probability:

| Category     | Weight | Reasoning                          |
|--------------|--------|------------------------------------|
| Retail       | 40%    | Most buildings, most employees     |
| Supermarket  | 15%    | High footfall, fewer buildings     |
| Healthcare   | 15%    | Consistent demand                  |
| Education    | 15%    | School staff                       |
| Food service | 15%    | Cafes, restaurants, fast food      |

If a category has no buildings in the area, its weight is redistributed across available ones.

---

## Transport Preferences

Assigned per-agent based on age and circumstances:

| Condition                  | Rule                              |
|----------------------------|-----------------------------------|
| Has dropoff duty           | 85% chance of owning a car        |
| Age 16–25 (young adult)    | 60% use public transport          |
| Age 65+ (elderly)          | 40% use public transport          |
| Employed, no special case  | 30% use public transport          |

Transport mode for a specific leg is then decided at plan generation time by `transport_modes.py`, which applies a decision tree on top of preferences (e.g., shopping trips bias toward car).

---

## Plan Types

Each agent gets one plan, selected by profile:

| Profile                        | Plan                                      |
|--------------------------------|-------------------------------------------|
| Parent + employed              | Home → School → Work → School → Home     |
| Employed adult                 | Home → Work → (Shopping 40%) → Home      |
| Unemployed, working age        | Home → Errand → Home                     |
| Elderly (65+)                  | Home → Shopping or Healthcare → Home     |
| Teen (12–17, independent)      | Home → School → Home                     |
| Child under 12                 | No independent plan (travels with parent)|

Children under 12 produce no XML person entry — their trip is implicit in the parent's school leg.

---

## Departure Times

Departure times follow a bell curve peaking at 07:30–08:00 to simulate morning rush hour. Elderly agents depart 09:00–11:00 to reflect retirees avoiding peak traffic.

```
06:00  5%
06:30 10%
07:00 20%
07:30 30%  ← peak
08:00 20%
08:30 10%
09:00  5%
```

---

## XML Output

Each agent becomes a `<person>` in `plans_v4.dtd` format:

```xml
<person id="uuid">
  <plan selected="yes">
    <act type="home" x="53.34" y="-6.26" end_time="07:45:00"/>
    <leg mode="car"/>
    <act type="work" x="53.33" y="-6.25" dur="08:00:00"/>
    <leg mode="car"/>
    <act type="home" x="53.34" y="-6.26"/>
  </plan>
</person>
```

The first activity uses `end_time` (when to leave), subsequent activities use `dur` (how long to stay). MATSim derives the full schedule from these.

---

## Constraints

- `MAX_AGENTS = 1000` — caps total population to prevent memory issues on large map areas
- `DEFAULT_AMENITY_RADIUS = 2 km` — search radius when looking for nearby facilities
- Immutable agent updates via Pydantic `model_copy()` — prevents mutation bugs during assignment steps
