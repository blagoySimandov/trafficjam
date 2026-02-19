# [Visualize data using SimWrapper]()

# Frame the Problem

Understand what we are trying to achieve.

SimWrapper is a potential visualization tool for MATSim data, but we haven't thoroughly evaluated whether it meets our specific needs. Before investing development effort, we need to understand:

What SimWrapper actually provides

Whether it fits our visualization architecture

Whether the learning curve is worth it

What customization limits exist

How it compares to maintaining our custom solution
Framing the problem brings clarity that makes taking the correct action easier.

---

### Why are we doing this work?

Seeing if it's worth integrating SimWrapper in any capacity into our project, or if it's bait

### What outcome are we looking for?

A robust and functional data visualization tool, that can easily take output from MATSim and visualize the data using graphs along with statistical analysis.

### what does simwrapper do
it creates a localhost website that can hold a bunch of data visualizations and also has like a dashboard where you can view all of the files, like the xml files and it visualizes it for you (but we dont care about that part cause we are doing it with react in a more polished way) we just want the data visualization stuff including the automation.

### Recommendation

So look, the situation is that Simwrapper is actually very handy. It already has the MATSim stuff premade, so we can reuse code.
It's actually so handy for the graphs and stuff, cause its made for reading the geographic data that we use, whether or not we feed it straight from MATSim and use the xml output files - or if we want to use the converted geojson ones - both are completely okay and require no particular effort to feed in. So in terms of data visualization for statistical analysis it is very pog. Examples of graphs ive made:
- pie chart for what modes of transports people use
- box plot for what the duration of transports per vehicle type
- heatmap for modes of transport vs time of day
- line graph for transport vs time of day (when is rush hour basically)
- sankey diagram which we can use to see if people start with walk and then go home with bus eg
- stacked bar chart for mode of transport vs time of day again

in terms of integrating it into our project: it should be absolutely perfect, it is extremely compatible with MATSim, and would automatically create all the files needed itself. 

### N.B.
so far it looks really good in terms of locally hosting with the dummy matsim data in an isolated environment, but im going to further investigate in a new pr by integrating it with our frontend and backend, and using the java code it has on the documentation to automate it with MATSim and start doing funky graphs and stuff

My final verdict is:
it looks good and i think we should use it - but will look further into it to confirm