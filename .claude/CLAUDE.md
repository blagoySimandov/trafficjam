# Code style
- Do not put any comments in any code unless specifically told to.
- I hate long functions. Each functions should be small, between 5-20 lines of code. Split into smaller functions if needed.
- Always first consider adding a dependency that will make the code smaller, cleaner and more readable when implementing a feature or refactoring code.
- When writing react avoid usage of useEffect as much as possible. Opt for other native hooks and/or useQuery or other react hook Dependencies



# Project specific general stuff
We are building a traffic simulator and have divided the functionality into multiple services.
Each service is a top level folder.
Currently we have
1. map-data-service - This is a fast api service that serves the frontend link and node information so the user can edit the network. For more information for the service use the (TODO:) skill
2. traficjam-be/java (should be renamed in the future) is a java service that wraps MatSim a traffic simulation
engine that we use as the backbone of our project. It serves as output_events.xml that hold information such as when each agent comes and leaves a link. For more information for the service please use the /(TODO:) skill
3. trafficjam-fe - this is our frontend. It has two main presentation layers. 1. The map editor 2. the visualizer.
for more information on the service  and how to write code in it use the /(TODO) skill

## traficjam-fe
This is the frontend of the traffic simulator.
