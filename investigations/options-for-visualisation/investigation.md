# Options for End User Visualisation

## Frame the Problem

Understand what we are trying to achieve.

* Are we certain we are working on the right problem?
* Do we have all the research we need to understand it fully?
* Do we all understand the problem the same way?

Framing the problem brings clarity that makes taking the correct action easier.

---

### Why are we doing this work?

To present complex traffic simulation data in a way that is **clear, interpretable, and convincing for an end user or evaluator**.

While static representations communicate congestion levels, they do not fully convey how traffic *behaves over time*. For the product to meet submission expectations, users must be able to **see traffic movement**, not just infer it from color changes.

---

### What outcome are we looking for?

An interactive frontend that allows end users to:

* Observe traffic conditions across a city
* Scrub through time and see changes unfold
* Understand both congestion *levels* and traffic *flow*
* Experience a smooth, visually credible simulation

The outcome should demonstrate not only correctness, but **depth and completeness of visualisation**.

---

## Propose Solutions

### 1. Road Segment Heatmap

**Description**
Roads are colored based on traffic metrics such as speed, volume, or congestion.

**Pros**

* Very clear and intuitive
* Scales well to entire cities
* Excellent performance
* Easy to interpret at a glance

**Cons**

* Feels static even when animated
* Does not show direction or flow
* Lacks visual realism

**Regardless of these advantages, a heatmap alone is not sufficient.**
On its own, it does not meet the visual or experiential standard required for a strong product submission.

---

### 2. Grouped Vehicle Animation

**Description**
Animated markers represent groups of vehicles moving along road segments.

**Pros**

* Clearly shows traffic flow and direction
* Adds realism and visual credibility
* Makes temporal changes obvious
* Strong impact for demonstrations and evaluation

**Cons**

* Higher implementation complexity
* Increased CPU/GPU usage
* Requires careful performance management

**Despite these costs, this must be implemented.**
Without visible vehicle movement, the product lacks the depth and clarity expected for submission. The added complexity is justified by the improvement in user understanding and perceived quality.

---

### 3. Combined Heatmap + Grouped Animation

**Description**
A heatmap provides city-wide context while grouped vehicle animations convey movement and flow.

**Pros**

* Best balance of clarity and realism
* Scales to large areas while remaining engaging
* Communicates both congestion intensity and dynamics

**Cons**

* Most complex option
* Requires thoughtful UX design

**This combination represents the minimum acceptable standard.**
Regardless of cost or complexity, this approach is required for the product to be considered complete and submission-ready.

---

## Recommendation

Implement a **combined road heatmap and grouped vehicle animation** approach.

---

### Recommendation Rationale

* Heatmaps alone communicate *where* congestion exists
* Animated vehicle groups communicate *how* traffic behaves
* Submission-quality products must demonstrate both
* The additional technical cost is outweighed by:

  * Improved clarity
  * Stronger evaluation impact
  * Higher perceived completeness

In short:
**Even with performance and development tradeoffs, animated traffic flow is not optional. It is required for the product to be good enough for submission.**

Next step is to see how exactly the agents can be animated. This would require analysing the data they hold after a matsim simulation and translating that to position them on an edge and how fast they would move between nodes at that edge.
