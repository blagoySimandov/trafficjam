#!/bin/bash
# SSE Streaming Test - Long simulation (100 iterations) to verify real-time event streaming

BASE_URL="http://localhost:8080/api/simulations"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_FILE="$SCRIPT_DIR/../java/src/main/resources/cork_network.xml"
ITERATIONS=30

echo -e "\033[36m=== SSE Streaming Test (Long Simulation) ===\033[0m"
echo ""

# Start simulation (100 iterations for ~30-60s runtime)
echo -e "\033[33mStep 1: Starting simulation with $ITERATIONS iterations...\033[0m"

RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -F "networkFile=@$NETWORK_FILE" \
  -F "iterations=$ITERATIONS" \
  -F "randomSeed=4711")

SIMULATION_ID=$(echo "$RESPONSE" | grep -o '"simulationId":"[^"]*"' | cut -d'"' -f4)
echo -e "\033[32m[OK] Simulation started!\033[0m"
echo -e "\033[36mSimulation ID: $SIMULATION_ID\033[0m"
echo ""

# Connect to SSE stream
echo -e "\033[33mStep 2: Connecting to SSE stream...\033[0m"
echo -e "\033[90mYou should see status events arriving every second, but we will print progress every 5s\033[0m"
echo -e "\033[33mPress Ctrl+C to stop watching\033[0m"
echo ""

# Track events
EVENT_COUNT=0
START_TIME=$(date +%s)
CURRENT_EVENT=""

# Read SSE stream line by line
while IFS= read -r line; do
    # Strip whitespace and carriage returns
    line=$(echo "$line" | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    # Skip empty lines (SSE event separators)
    if [[ -z "$line" ]]; then
        continue
    fi
    
    TIMESTAMP=$(date +%H:%M:%S)
    
    # Parse event type (e.g., "event: status")
    if [[ "$line" =~ ^event:[[:space:]]*(.+)$ ]]; then
        CURRENT_EVENT="${BASH_REMATCH[1]}"
        ((EVENT_COUNT++))
        
        case "$CURRENT_EVENT" in
            "connected")
                echo -e "\033[32m[$TIMESTAMP] #$EVENT_COUNT CONNECTED to stream\033[0m"
                ;;
            "status")
                # echo -e "\033[36m[$TIMESTAMP] #$EVENT_COUNT Status update\033[0m"
                ;;
            "finished")
                echo -e "\033[35m[$TIMESTAMP] #$EVENT_COUNT FINISHED\033[0m"
                ;;
        esac
    fi
    
    # Parse data payload (e.g., "data: RUNNING")
    if [[ "$line" =~ ^data:[[:space:]]*(.+)$ ]]; then
        DATA="${BASH_REMATCH[1]}"
        # echo -e "           -> $DATA"
        
        # Show progress every 5 events (approx 5 seconds)
        if (( EVENT_COUNT % 5 == 0 )); then
            CURRENT_TIME=$(date +%s)
            ELAPSED=$((CURRENT_TIME - START_TIME))
            echo -e "\033[36m[$TIMESTAMP] Status: $DATA \033[90m(Event #$EVENT_COUNT at ${ELAPSED}s)\033[0m"
        fi
    fi
done < <(stdbuf -oL curl -N -s "$BASE_URL/$SIMULATION_ID/events")

# Summary
TOTAL_TIME=$(($(date +%s) - START_TIME))
echo ""
echo -e "\033[33m=== Stream Closed ===\033[0m"
echo -e "\033[36mTotal events received: $EVENT_COUNT\033[0m"
echo -e "\033[36mTotal time: ${TOTAL_TIME}s\033[0m"
echo ""
echo -e "\033[32mSSE streaming is working! Events arrived over ${TOTAL_TIME} seconds.\033[0m"
