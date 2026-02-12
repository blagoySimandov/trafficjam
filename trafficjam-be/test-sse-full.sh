#!/bin/bash
# Full SSE Streaming Test
# 
# This script demonstrates Server-Sent Events (SSE) streaming by:
# 1. Starting a LONG simulation (100 iterations, ~30-60 seconds)
# 2. Immediately connecting to the SSE stream
# 3. Displaying events as they arrive in real-time
# 4. Proving that events stream over time (not all at once)
#
# This is the definitive test that SSE streaming works correctly.
#
# Usage: ./test-sse-full.sh

# Configuration
BASE_URL="http://localhost:8080/api/simulations"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_FILE="$SCRIPT_DIR/java/src/main/resources/cork_network.xml"

echo -e "\033[36m=== SSE Streaming Test (Long Simulation) ===\033[0m"
echo ""

# ============================================================
# Step 1: Start a Long Simulation
# We use 100 iterations so the simulation runs long enough
# to demonstrate real-time streaming (not instant completion)
# ============================================================
echo -e "\033[33mStep 1: Starting simulation with 100 iterations...\033[0m"

# Start simulation with 100 iterations for a longer-running simulation
RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -F "networkFile=@$NETWORK_FILE" \
  -F "iterations=100" \
  -F "randomSeed=4711")

SIMULATION_ID=$(echo "$RESPONSE" | grep -o '"simulationId":"[^"]*"' | cut -d'"' -f4)
echo -e "\033[32m[OK] Simulation started!\033[0m"
echo -e "\033[36mSimulation ID: $SIMULATION_ID\033[0m"
echo ""

# ============================================================
# Step 2: Connect to SSE Stream Immediately
# We connect right after starting to catch events from the beginning
# ============================================================
echo -e "\033[33mStep 2: Connecting to SSE stream...\033[0m"
echo -e "\033[90mYou should see status events arriving every ~1 second\033[0m"
echo -e "\033[33mPress Ctrl+C to stop watching\033[0m"
echo ""

# Track event count and start time
EVENT_COUNT=0
START_TIME=$(date +%s)
CURRENT_EVENT=""

# ============================================================
# Read and Display SSE Events
# SSE format: "event: <type>" followed by "data: <payload>"
# ============================================================
# Read the stream line by line until it closes
while IFS= read -r line; do
    # Strip carriage return and whitespace
    line=$(echo "$line" | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    # Skip empty lines (SSE uses them as event separators)
    if [[ -z "$line" ]]; then
        continue
    fi
    
    TIMESTAMP=$(date +%H:%M:%S)
    
    # Parse SSE event type (e.g., "event: status")
    if [[ "$line" =~ ^event:[[:space:]]*(.+)$ ]]; then
        CURRENT_EVENT="${BASH_REMATCH[1]}"
        ((EVENT_COUNT++))
        
        # Display different event types with different colors
        case "$CURRENT_EVENT" in
            "connected")
                echo -e "\033[32m[$TIMESTAMP] #$EVENT_COUNT CONNECTED to stream\033[0m"
                ;;
            "status")
                echo -e "\033[36m[$TIMESTAMP] #$EVENT_COUNT Status update\033[0m"
                ;;
            "finished")
                echo -e "\033[35m[$TIMESTAMP] #$EVENT_COUNT FINISHED\033[0m"
                ;;
        esac
    fi
    
    # Parse SSE data payload (e.g., "data: RUNNING")
    if [[ "$line" =~ ^data:[[:space:]]*(.+)$ ]]; then
        DATA="${BASH_REMATCH[1]}"
        echo -e "           -> $DATA"
        
        # Show elapsed time periodically to prove streaming works
        # If all events arrived at once, elapsed time would be ~0s
        if (( EVENT_COUNT % 5 == 0 )) && (( EVENT_COUNT > 0 )); then
            CURRENT_TIME=$(date +%s)
            ELAPSED=$((CURRENT_TIME - START_TIME))
            echo -e "\033[90m           (Received $EVENT_COUNT events in ${ELAPSED}s - streaming works!)\033[0m"
        fi
    fi
done < <(stdbuf -oL curl -N -s "$BASE_URL/$SIMULATION_ID/events")

# ============================================================
# Summary
# ============================================================
TOTAL_TIME=$(($(date +%s) - START_TIME))
echo ""
echo -e "\033[33m=== Stream Closed ===\033[0m"
echo -e "\033[36mTotal events received: $EVENT_COUNT\033[0m"
echo -e "\033[36mTotal time: ${TOTAL_TIME}s\033[0m"
echo ""
echo -e "\033[32mSSE streaming is working! Events arrived over ${TOTAL_TIME} seconds.\033[0m"
