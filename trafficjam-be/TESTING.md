# Testing Guide for PR Reviewers

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- A network.xml file for testing (or use the sample from the repo)

## Quick Start

### 1. Build and Test
```bash
cd trafficjam-be/java
mvn clean test
```

Expected: `BUILD SUCCESS`

### 2. Start the Server

**Open a terminal and start the server (leave it running):**

**PowerShell (Windows):**
```powershell
cd trafficjam-be
.\run-server-with-logging.ps1
```

**Bash (Linux/Mac/WSL):**
```bash
cd trafficjam-be
./run-server.sh
```

This will:
- Start the Spring Boot server on port 8080 (Note: there will be some warnings that can be ignored)
- Log all output to `server-output.log`
- Display output in the console
- **Keep this terminal open** - the server runs continuously

Expected output:
```
Started Application in ~2 seconds
Tomcat started on port 8080 (http)
```

### 3. Run Basic API Tests

**Open a NEW terminal window and run:**

**PowerShell (Windows):**
```powershell
cd trafficjam-be
powershell -ExecutionPolicy Bypass -File .\test-api.ps1
```

**Bash (Linux/Mac/WSL):**
```bash
cd trafficjam-be
./test-api.sh
```

This automated test script will:
- ✅ Start a simulation (5 iterations)
- ✅ Check simulation status
- ✅ Test error handling (invalid simulation ID)
- ✅ Verify CORS headers
- ✅ Stop the simulation

Expected: All tests pass with `[OK]` messages in green

### 4. Run SSE Streaming Test

**In the same terminal, run:**

**PowerShell (Windows):**
```powershell
powershell -ExecutionPolicy Bypass -File .\test-sse-full.ps1
```

**Bash (Linux/Mac/WSL):**
```bash
./test-sse-full.sh
```

This will:
- ✅ Start a long simulation (100 iterations, ~30-60 seconds)
- ✅ Connect to the SSE stream immediately
- ✅ Display events arriving in real-time
- ✅ Prove that Server-Sent Events are working correctly

Expected output:
```
[12:15:01] #1 CONNECTED to stream
           -> connected
[12:15:02] #2 Status update
           -> RUNNING
[12:15:03] #3 Status update
           -> RUNNING
...
(Received 5 events in 5s - streaming works!)
...
[12:16:30] #100 Status update
           -> COMPLETED
[12:16:30] #101 FINISHED
           -> COMPLETED

=== Stream Closed ===
Total events received: 101
Total time: 90s
```
           -> RUNNING
[09:15:25.234] Status update #2
           -> RUNNING
...
[09:16:45.678] FINISHED
           -> COMPLETED
```

---

## File Verification

### Check Output Files

After a simulation completes, verify files are created:

```bash
# Windows
dir trafficjam-be\java\output\{simulationId}

# Linux/Mac
ls -la trafficjam-be/java/output/{simulationId}
```

**Expected files:**
- `output_events.xml.gz`
- `output_plans.xml.gz`
- `output_network.xml.gz`
- `scorestats.txt`
- `stopwatch.txt`

---

## Code Review Checklist

### Configuration
- [ ] `WebConfig.java` - CORS properly configured
- [ ] `application.properties` - Temp/output directories configured

### DTOs
- [ ] `SimulationRequest.java` - Has default values (iterations=10, seed=4711)
- [ ] `SimulationResponse.java` - Contains simulationId and status
- [ ] `SimulationStatusResponse.java` - Contains simulationId, status, error

### Service Layer
- [ ] `SimulationService.java` - Handles file uploads correctly
- [ ] Uses default-plans.xml for MVP (no user-uploaded plans)
- [ ] SSE streaming polls status every second
- [ ] Proper error handling for non-existent simulations

### Controller
- [ ] `SimulationController.java` - All endpoints properly annotated
- [ ] Multipart file upload configured
- [ ] SSE emitter has 30-minute timeout
- [ ] Proper HTTP status codes returned

### Resources
- [ ] `default-plans.xml` - Valid empty MatSim plans file
- [ ] `config-template.xml` - Contains all required placeholders

---

## Common Issues

### Issue: "Simulation not found" error
**Cause:** Simulation ID doesn't exist or was already cleaned up  
**Fix:** Use a valid simulation ID from a recent POST request

### Issue: SSE stream closes immediately
**Cause:** Simulation already completed or invalid ID  
**Fix:** Start a new simulation and connect to SSE stream quickly

### Issue: "Population is empty" error
**Cause:** default-plans.xml not found or invalid  
**Fix:** Verify `src/main/resources/default-plans.xml` exists

---

## Performance Testing

For reviewers who want to test with longer simulations:

```bash
curl -X POST http://localhost:8080/api/simulations \
  -F "networkFile=@large-network.xml" \
  -F "iterations=100"
```

Monitor memory usage and verify:
- Application doesn't crash
- SSE stream remains stable
- Output files are created correctly

---

## Questions?

If you encounter any issues during testing, please comment on the PR with:
1. The exact command you ran
2. The error message or unexpected behavior
3. Your environment (OS, Java version, Maven version)
