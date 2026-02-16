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
mvn clean install
```

## Development

Ensure JDK 17 and Maven are installed to build and run the service. The OpenAPI schema is automatically generated at runtime; you can view the interactive documentation at `/swagger-ui.html` or download the raw spec from `/api-docs`.

## Implementation

These files are skeletons for MatSim integration.
