# [Feature Investigation](https://linear.app/traffic-jam/issue/TRA-6/investigation-research-what-are-plausible-features-we-can-implement)

# Frame the Problem

What feature are we trying to achieve?
What is the problem we are trying to solve?

---

### What outcome are we looking for?

To have a minimal set of features that we want to implement.
They should be in the scope of the project.

## Proposed features

A list of proposed features ordered by importance.

1. Real-World Map Data Integration
   Description: Load and render road networks from OpenStreetMap (OSM) data including roads, intersections, traffic signals, speed limits, and lane information.

2. Interactive Simulation Engine
   Description: Run the simulation with real-time visual updates and interactive controls (play, pause, speed)
   Be able to modify the network topology and traffic conditions.
   Add bridges, intersections, and other road elements such as traffic signals, speed limits, and lanes.

3. Intelligent Bots for Simulation
   Description: Create intelligent bots that can navigate the road network and interact with other vehicles.
   The amount of things here are endless, we should focus first on a minimal set of features and make sure
   the system is expandable.

4. Zero setup "drop a pin" style simulation in the browser
   Description: Allow users to create a simulation with minimal setup.

5. Different Views for the same Simulation
   Allow for different ways to visualize the data so we can better understand the system.

6. AI "Impact Report" to summarize how changes have affected the simulation

## Things to consider

We need to research the complexity of each of these features.
This must be done after [TRA-5: \[Investigation\] Research available traffic engines](https://linear.app/traffic-jam/issue/TRA-5/investigation-research-available-traffic-engines) is completed since that research might allow us to skip a lot of the work.
