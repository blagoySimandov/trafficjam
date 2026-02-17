# trafficjam-be/java Patterns

## Stack

- Java + Spring Boot 3.2.2 + Maven
- MatSim 2024.0 (traffic simulation engine)
- OpenAPI: SpringDoc 2.3.0 (Swagger UI at /swagger-ui.html) and Swagger Spec at /api-docs
- Logging: Log4j2 (required by MatSim)

## Conventions

- Packages: lowercase, organized by layer (api, config, service, matsim)
- Constructor injection (no @Autowired)
- Controller → Service → Runner layering
- DTOs: simple POJOs
- OpenAPI annotations on controller methods

## API Design

- Base path: `/api/simulations`
- RESTful endpoints with multipart file upload for simulation input
- SSE for the real-time event streaming of output_events from matsim.
