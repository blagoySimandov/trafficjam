# [frontend-visualization-example]()

# Frame the Problem

Understand what we are trying to achieve.

- Are we certain we are working on the right problem?
- Do we have all the research we need to understand it fully?
- Do we all understand the problem the same way?

Framing the problem brings clarity that makes taking the correct action easier.

---

### Why are we doing this work?

To start seeing how to visualize the map and agents for the user, once we get a proper osm map with agents running. Experimenting with Deck GL and Mapbox in order to see how they would look for the end user.
Seeing what kind of features can be implemented on the frontend, and also what a basic GUI looks like

### What outcome are we looking for?

A working and basic GUI for the end user, that uses sample MATSim data, along with a map and agents running on the screen. Ideally also has some small features, like pausing etc.

### What does the code do

Code has an html file, with javascript and css with it. There is also json files for data, and xml files to simulate matsim output data. I haven't used matsim at all yet, so the xml files were generated from claude and might not be considered a suitable example.
* index.html - connects to deck gl, MapLibre, and Mapbox, and just has some of the frontend features like pausing and timeline etc. (generated with AI)
* styles.css - is just a css file
* main.js
    * this contains all the javascript that draws the map, roads and agents, firstly at the top you'll notice a bit about connecting to maplibre and a camera. What this does is it connects to maplibre which is a literal map of the world and an existing framework for showing a map to the user. It is technically creating the whole world on the screen in front of you, and i made it center on to cork, so when we do start drawing roads on cork it might be helpful idk. But also its not rendering the rest of the world unless you zoom out. Also also, i turned off the entire map that it gives so that we input our own for it to draw, but its still using a latitude and longitude system. It was originally isometric 2.5d style, which means that evidently that probably won't be that difficult to do should we choose to - but i chose top down just cause i think its neater, and also easier to debug. 
    * it loads data from specifically the roads.geojson for the roads, and trips.json for the agents movement. this is because i assume once we start matsimming up the place, we will obviously be converting the output data it gives (the xml file stuff) and geojson is a good format to store it in, whether or not its a file or a database.
    * the rest of the stuff is just UI and drawing stuff, not much to read into (its AI genned ofc)
* network.xml and output_events.xml - these are the sample matsim output files i asked claude to generate me. nothing else to say about them
* matsim_converter.py - this is a python script that takes the xml files, and converts them to json - so once we get proper matsim output files, this should also scale to it and convert those to readable formats for my UI to use

### Recommendation Rationale

Anyways, i think this is a good start, especially if we want to start experimenting more with MATSim, and trying to visualize it. it's a good base for creating roads and agents onto the screen. The main purpose of all this was just to see what deck gl was capable of (also mapbox and maplibre) and to just see how it would be used if we were to get matsim output data. Hopefully we can convert this investigation into something useful once we start building the proper frontend that connects to other code we use. 

### Next Steps
#### (In Order of Priority)

Next steps in my opinion is to get a functioning and proper map of Cork (as that is the assumed starting city) and get all the data for it specifically for the frontend along with sample agents and see how the visualization would work:
* user experience
* computation power

Also i think something important to do will be to visualize buildings or just something in the dead space.

And then perhaps as well adding other visualization features like heatmaps for congestion, or other cool things (stats and graphs perhaps?)
From my understanding as well, there will be no map editing happening here, as map editing is happening onto the matsim part of the program.

Another possible next step in this direction would be to just start figuring out a way to make it so we can input roads of some sort (like user types 'cork' and then suddenly the map of cork appears on the screen) but i assume that would be a lategame thing since we aren't doing any business here, and all that road stuff would happen on matsim.
