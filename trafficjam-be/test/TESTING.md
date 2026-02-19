# Testing Guide for PR Reviewers

## Prerequisites

- Docker Desktop installed and running
- Java 17 or higher
- Maven 3.6+
- Python 3.10+ with pip
- A network.xml file for testing (or use the sample from the repo)

## Setup (from a fresh clone)

### 1. Configure environment variables

Database credentials are stored in a `.env` file (not committed to git). From the **project root**:

```bash
cp .env.example .env
```

Then set the following variables in `.env`:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=trafficjam
```

### 2. Start the database

```bash
docker-compose up -d
```

Verify it's running and healthy:
```bash
docker-compose ps
```

Expected: `trafficjam-db-1` with status `Up (healthy)`

### 3. Install Python test dependencies

```bash
cd trafficjam-be
pip install -r requirements.txt
```