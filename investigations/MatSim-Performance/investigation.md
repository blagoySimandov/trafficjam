# MATSim Performance and Configuration Schema Investigation

### Do we have all the research we need to understand it fully?

Nearly there but not quite. We've got solid performance numbers and config knowledge. Still missing:

* Link stats format - might be better than events for our visualizer
* Real OSM network testing - we've only used the simple test network

### Do we all understand the problem the same way?

Should do now. We're building:  OSM->Map Editor → MATSim → Visualizer. Need to validate MATSim can sit in the middle without being a bottleneck.

## Why are we doing this work?

To validate that MATSim is viable for our traffic simulation tool before we commit to building the entire system around it. If it's too slow or gives us shit data, we need to know now, not after we've built everything.

## What outcome are we looking for?

Concrete answers on:

* Can MATSim run fast enough for "real-time" use (user makes change, waits reasonable time, sees results)
* What configuration do we use (mesoscopic vs microscopic, number of agents, etc.)
* What data format do we get from MATSim and how do we feed it to our visualizer
* Schema/contract definitions so frontend and backend teams can work in parallel

## Propose Solutions

After testing both microscopic and mesoscopic I found that they had nearly identical runtimes when tested on 1GB of ram for the same number of agents 100,1,000,10,000.

I think going with microscopic will allow us to have more freedom with choices we want to make with the visualiser but it might also add to the complexity so the choice is ours which one we want regardless of performance

### Microscopic times
<img width="1024" height="768" alt="MicroStopwatch100" src="https://github.com/user-attachments/assets/76d4611f-177e-480d-8df0-8233a82440a3" />
<img width="1024" height="768" alt="MicroStopwatch1k" src="https://github.com/user-attachments/assets/f10d25dc-36fe-4b5d-b37a-bbc4e3b67937" />
<img width="1024" height="768" alt="Microstopwatch10K" src="https://github.com/user-attachments/assets/b77d093b-164c-43e9-aa4d-3424a73107dd" />






### Mesoscopic times
<img width="1024" height="768" alt="stopwatch100" src="https://github.com/user-attachments/assets/f3e2c824-1483-4357-ac3b-bda3a6d7f767" />
<img width="1024" height="768" alt="stopwatch1,000" src="https://github.com/user-attachments/assets/276040cf-f76f-4b76-bc81-3b946ad005bc" />
<img width="1024" height="768" alt="stopwatch10,000" src="https://github.com/user-attachments/assets/8cac1bff-5fa2-4944-855d-64d2f85bbd7f" />


## Recommendation

**Go with whichever is best for the visualiser regardless of matsim performance**

Below is code to add to the config to choose between microscopic and mesoscopic

```
<module name="qsim">
		<param name="mainMode" value="car" />
		<param name="flowCapacityFactor" value="1.0" />
		<param name="storageCapacityFactor" value="1.0" />
		<!-- Mesoscopic -->
		<!-- <param name="trafficDynamics" value="kinematicWaves" /> -->
		<!-- Microscopic -->
		<param name="trafficDynamics" value="queue" /> 
	</module>
```

## Recommendation Rationale

I think the time is decent enough. It seems that there is one second of overhead on the first iteration which drops to around 0.5 seconds every iteration after and the time scales decently even though I'm multiplying the agent size by 10

100 agents = 24 seconds

1000 agents = 40 seconds

1000 agents = 70 seconds

**Before finalizing, we need to:**

* Look at link stats as alternative data source
* Test with real OSM network to confirm performance holds

## **Here is an explanation of all of the MatSim file outputs aswell summarised from the documentation**

# MATSim Output Files Summary

## Always Generated (Every Run)

* **Log File** General simulation log with all info. Used for debugging crashes or checking what happened during the run.
* **Warnings and Errors Log File** Filtered log with only warnings and errors. Check this first if something looks dodgy - easier than digging through the full log.
* **Score Statistics** (scorestats.png, scorestats.txt) Shows how well agents' plans are performing each iteration. Tracks average best, worst, executed, and overall scores. Useful for seeing if the simulation is converging.
* **Leg Travel Distance Statistics** (traveldistancestats.png, traveldistancestats.txt) Same as score stats but for travel distances instead of scores.
* **Stopwatch** (stopwatch.png, stopwatch.txt) Performance metrics - how long each iteration took (replanning time, simulation time, etc.). This is what you used to get your 2.4s, 4s, 7s numbers.

## Generated Per Iteration

* **Events File** (e.g., 10.events.xml.gz) The big one. Records every single action - activity starts/ends, vehicles entering/leaving traffic, link changes, etc. This is what you'll feed to your visualizer. Size: \~2MB compressed for 10k agents.
* **Plans File** (e.g., 10.plans.xml.gz) Updated agent plans with scores after that iteration. Shows how agents have adapted their routes.
* **Leg Histogram** (e.g., 10.legHistogram_car.png, 10.legHistogram.txt) Number of agents arriving, departing, or traveling per time period. Generated per transport mode (car, bike, walk, etc.) and overall. Shows traffic flow over time.
* **Trip Durations** (e.g., 10.tripdurations.txt) Trip counts and durations broken down by activity pairs (home→work, work→home, etc.) and time bins.
* **Link Stats** (e.g., 10.linkstats.txt.gz) Hourly traffic counts and travel times for every link in the network. Good for showing congestion on specific road segments. Might be more efficient than events file for your visualizer.

[AgentCreation.py](https://uploads.linear.app/244a06c6-8d11-4310-a6a7-037762d701a1/9a2e169b-bd8a-4649-a96c-ed13d9c6c8af/05cdf447-78f8-4373-ac81-d7afd5248bf0)

[output.zip](https://uploads.linear.app/244a06c6-8d11-4310-a6a7-037762d701a1/b17cff82-bb58-4adb-9aec-511619708470/2ab3f81e-1163-48ff-bea7-eebdd7958fd0)

I have also attached the full outputs of the microscopic 100 agents and a python script i made to randomly generate agents
