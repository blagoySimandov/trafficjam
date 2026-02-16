# map-data-service Patterns

## Stack

- Python 3.13 + FastAPI
- HTTP client: httpx (async)
- Validation: Pydantic v2
- Geo: pyproj
- Dependencies: requirements.txt

## Conventions

- Functions: snake_case, private prefixed with `*`
- Models: PascalCase Pydantic classes
- Files: snake_case
- Type hints on all functions
- Async throughout for I/O
- Small pure functions for parsing/transforming

## API Design

- Pydantic models for request validation and response serialization
- Errors: HTTPException with appropriate status codes
