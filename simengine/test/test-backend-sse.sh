#!/bin/bash
# Test Script for Backend SSE Streaming (Unified Flow)
# This script:
# 1. Starts a simulation via the Python backend (port 8000)
#    (The backend creates the Run in DB and calls the SimEngine)
# 2. Streams events from the Python backend SSE endpoint

BE_URL="http://localhost:8000"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NETWORK_FILE="$SCRIPT_DIR/../src/main/resources/cork_network.xml"
SCENARIO_ID="test-scenario-$(date +%s)"
ITERATIONS=2

echo -e "\033[36m=== Backend SSE Streaming Test (Unified Flow) ===\033[0m"
echo ""

# Step 1: Start Simulation via Python Backend
echo -e "\033[33mStep 1: Starting Simulation via Python Backend...\033[0m"
START_RESPONSE=$(curl -s -X POST "$BE_URL/scenarios/$SCENARIO_ID/runs/start" \
    -F "networkFile=@$NETWORK_FILE" \
    -F "iterations=$ITERATIONS")

echo "START_RESPONSE: $START_RESPONSE"

RUN_ID=$(echo "$START_RESPONSE" | grep -o '"run_id":"[^"]*"' | cut -d'"' -f4)
SIM_ID=$(echo "$START_RESPONSE" | grep -o '"simulation_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$RUN_ID" ] || [ -z "$SIM_ID" ]; then
    echo -e "\033[31m[ERROR] Failed to start simulation via backend. Is the Python service running on $BE_URL?\033[0m"
    exit 1
fi
echo -e "\033[32m[OK] Simulation started! RUN_ID: $RUN_ID, SIM_ID: $SIM_ID\033[0m"
echo ""

# Step 2: Stream events from Python Backend
echo -e "\033[33mStep 2: Connecting to Python Backend SSE stream...\033[0m"
echo -e "\033[90mEndpoint: $BE_URL/scenarios/$SCENARIO_ID/runs/$RUN_ID/events/stream\033[0m"
echo -e "\033[33mPress Ctrl+C to stop watching\033[0m"
echo ""

EVENT_COUNT=0
START_TIME=$(date +%s)

# Read SSE stream line by line
while IFS= read -r line; do
    # Strip whitespace and carriage returns
    line=$(echo "$line" | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

    if [[ -z "$line" ]]; then
        continue
    fi

    TIMESTAMP=$(date +%H:%M:%S)

    if [[ "$line" =~ ^event:[[:space:]]*(.+)$ ]]; then
        CURRENT_EVENT="${BASH_REMATCH[1]}"
        ((EVENT_COUNT++))
        echo -e "\033[36m[$TIMESTAMP] Event: $CURRENT_EVENT\033[0m"
    fi

    if [[ "$line" =~ ^data:[[:space:]]*(.+)$ ]]; then
        DATA="${BASH_REMATCH[1]}"
        echo -e "           Data: $DATA"
        
        # Limit to 20 events for the test script
        if [ $EVENT_COUNT -ge 20 ]; then
            echo -e "\033[32mReceived $EVENT_COUNT events. Stopping test.\033[0m"
            break
        fi
    fi
done < <(stdbuf -oL curl -N -s "$BE_URL/scenarios/$SCENARIO_ID/runs/$RUN_ID/events/stream")

echo ""
echo -e "\033[32mBackend SSE streaming test completed.\033[0m"
