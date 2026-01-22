# MATSim Scoring Explained (Chapter 14)

## How Scoring Actually Works

MATSim's scoring system is essentially a **utility function** that evaluates how "good" an agent's day plan was. Think of it as assigning points (positive and negative) for everything an agent does during their simulated day.

### The Basic Formula

For each agent's plan, the total score is:

**Total Score = Sum of all activity scores + Sum of all travel scores**

### 1\. Activity Scoring (The Good Stuff)

Activities **earn positive points** based on:

* **Performing the activity**: Uses a logarithmic function that rewards spending time at activities, but with diminishing returns
  * Formula: `βperf × typical_duration × ln(actual_duration / t0)`
  * The longer you stay (up to a point), the better, but staying twice as long doesn't give twice the score
* **Penalties for timing issues**:
  * **Late arrival**: Negative points if you arrive after the latest acceptable time (e.g., arriving late to work)
  * **Waiting**: If you arrive before a place opens and have to wait
  * **Leaving too early**: If you don't stay long enough

**Key Parameters**:

* `βperf` (performing): Default is **+6 utils/hour** - rewards time spent at activities
* Each activity type needs a "typical duration" defined in the config (e.g., work = 8 hours, home = 12 hours)

### 2\. Travel Scoring (The Bad Stuff)

Travel **costs negative points** because it's time not spent doing activities:

**Travel Disutility = Mode constant + Travel time cost + Money cost + Distance cost**

Where:

* **Mode constant**: Fixed penalty/bonus for using a mode (can make transit more/less attractive)
* **Travel time**: `βtrav,mode × time` (usually negative, e.g., -6 utils/hour for car)
* **Money costs**: `βmoney × (tolls + fares + distance costs)`
* **Distance costs**: Can penalize longer trips for modes like walking

**Key insight**: Even if `βtrav,car = 0`, traveling by car still has an **implicit cost** because:

* Time spent traveling = time NOT spent at activities
* You're losing the `βperf` points you could have earned

### 3\. The Optimization Loop

Over iterations, each agent:

1. Tries different plans (routes, departure times, modes, destinations)
2. Gets scored after executing each plan
3. Tends to select plans with higher scores
4. Eventually converges to a "best" daily schedule

---

## Is This Valid for Your Use Cases?

**Yes, with some caveats:**

### **Good for our use cases:**

1. **City Planning & Traffic Flow**
   * Realistic representation of congestion effects (travel times increase → scores decrease → people adapt routes/times)
   * Captures peak spreading (people shift departure times to avoid congestion)
   * Shows real competition for road space
2. **Event Planning**
   * Can model how special events affect traffic patterns
   * Shows how people reschedule activities around events
   * Captures realistic route choice changes
3. **Smart City Integration**
   * Can model behavioral responses to pricing, new transit, road changes
   * Shows how people trade off time, money, and convenience
   * Realistic mode choice modeling

### **Limitations to be aware of:**

1. **Default scoring doesn't capture everything**:
   * No explicit comfort/crowding for transit (unless you add extensions)
   * No weather effects
   * No social preferences
   * No habit/inertia (people adapt "too rationally")
2. **Calibration is crucial**:
   * Default values are based on European studies
   * You'll need to calibrate to match your city's actual mode shares and traffic patterns
   * Requires real-world data (traffic counts, travel surveys) for validation

---

## Should You Change the Scoring? How?

### **When to Keep Default Scoring:**

* Initial exploratory runs
* Comparing relative impacts of interventions
* When you don't have local behavioral data

### **When to Customize Scoring:**

#### **Scenario 1: Match Local Travel Behavior**

If your modal split doesn't match reality:

xml

```
<module name="scoring">
    <parameterset type="scoringParameters">
        <!-- Adjust mode constants to calibrate mode shares -->
        <parameterset type="modeParams">
            <param name="mode" value="car"/>
            <param name="constant" value="0.0"/>  <!-- Baseline -->
        </parameterset>
        <parameterset type="modeParams">
            <param name="mode" value="pt"/>
            <param name="constant" value="-2.0"/>  <!-- Make PT less attractive -->
        </parameterset>
        <parameterset type="modeParams">
            <param name="mode" value="bike"/>
            <param name="constant" value="1.0"/>  <!-- Make bike more attractive -->
        </parameterset>
    </parameterset>
</module>
```

#### **Scenario 2: Model Pricing/Tolls**

For smart city congestion pricing:

xml

```
<param name="marginalUtilityOfMoney" value="1.0"/>
<!-- Then add road pricing via the roadpricing contrib -->
<!-- Agents will respond to prices based on their value of time -->
```

#### **Scenario 3: Custom Event Impacts**

For event planning, you might want to add custom scoring via code:

java

```
// Example: Add custom scoring for events
public class EventScoringFunction implements ScoringFunction {
    
    @Override
    public void handleEvent(Event event) {
        // Add custom penalties for congestion near event venues
        if (isNearEventVenue(event) && isDuringEventTime(event)) {
            score -= congestionPenalty;
        }
    }
    
    // ... other methods
}

// Register in your main script:
controler.setScoringFunctionFactory(new ScoringFunctionFactory() {
    @Override
    public ScoringFunction createNewScoringFunction(Person person) {
        return new EventScoringFunction();
    }
});
```

#### **Scenario 4: Differentiate User Groups**

For smart city analysis with different populations:

xml

```
<!-- Subpopulation: Commuters -->
<parameterset type="scoringParameters">
    <param name="subpopulation" value="commuters"/>
    <param name="performing" value="6.0"/>
    <parameterset type="modeParams">
        <param name="mode" value="car"/>
        <param name="marginalUtilityOfTraveling_util_hr" value="-4.0"/>
    </parameterset>
</parameterset>

<!-- Subpopulation: Delivery vehicles -->
<parameterset type="scoringParameters">
    <param name="subpopulation" value="freight"/>
    <param name="performing" value="12.0"/>  <!-- Higher value of time -->
    <!-- ... -->
</parameterset>
```

---

## Practical Recommendations for Your Use Cases

### **Start Simple:**

1. Use default scoring initially
2. Calibrate mode constants to match observed mode shares
3. Validate against traffic counts

### **For Different Statistics You Want:**

| **Analysis Goal** | **Scoring Modification** |
| -- | -- |
| **Reduce car usage** | Increase car travel time cost OR add distance costs OR decrease PT constant |
| **Analyze toll impacts** | Set realistic `marginalUtilityOfMoney` based on local income data |
| **Event traffic management** | Add custom scoring for event-related congestion/parking |
| **Transit improvements** | Adjust PT travel time costs, add comfort factors |
| **Equity analysis** | Use income-dependent `βmoney` (see Section 14.4) |
| **Time-of-day policies** | Add time-varying road pricing or opening hours |

### **Key Files to Modify:**

1. **config.xml** - For basic parameter adjustments
2. **Custom Java code** - For complex behavioral models (see Chapter 25)
3. **Events handlers** - To add new metrics without changing scoring

---

## Bottom Line

The default MATSim scoring is **well-suited for our use cases** as a starting point. It provides:

* Realistic congestion responses
* Reasonable mode choice behavior
* Valid time-of-day patterns

The documentation (Chapter 25) and code examples show how to extend scoring for your specific needs without breaking the core MATSim functionality.
