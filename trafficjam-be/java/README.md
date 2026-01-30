# MatSim Java Integration

Java components for running MatSim simulations.

## Structure

```
java/
├── pom.xml                    # Maven dependencies
└── src/main/java/com/trafficjam/matsim/
    ├── MatsimRunner.java      # Main simulation runner
    ├── EventHandler.java      # Event capture
    └── ConfigGenerator.java   # Config file generation
```

## Build

```bash
cd java
mvn clean install
```

## Implementation

These files are skeletons for MatSim integration.
