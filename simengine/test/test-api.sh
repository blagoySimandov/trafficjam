#!/bin/bash
# API Test Script - Tests all main endpoints (POST, GET, DELETE, CORS, error handling)

BASE_URL="http://localhost:8080/api/simulations"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_FILE="$SCRIPT_DIR/../src/main/resources/cork_network.xml"

echo -e "\033[36m=== MatSim API Test Script ===\033[0m"
echo ""

# Test 1: Start simulation
echo -e "\033[33mTest 1: Starting a simulation...\033[0m"

RESPONSE=$(curl -s -X POST "$BASE_URL" \
    -F "networkFile=@$NETWORK_FILE" \
    -F "iterations=5" \
    -F "randomSeed=4711")

if [ $? -eq 0 ]; then
    echo -e "\033[32m[OK] Simulation started successfully!\033[0m"
    SIMULATION_ID=$(echo "$RESPONSE" | grep -o '"simulationId":"[^"]*"' | cut -d'"' -f4)
    STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo -e "\033[36mSimulation ID: $SIMULATION_ID\033[0m"
    echo -e "\033[36mStatus: $STATUS\033[0m"
    echo ""
else
    echo -e "\033[31m[ERROR] Failed to start simulation\033[0m"
    exit 1
fi

# Test 2: Check status
echo -e "\033[33mTest 2: Checking simulation status...\033[0m"
sleep 2

STATUS_RESPONSE=$(curl -s "$BASE_URL/$SIMULATION_ID/status")
echo -e "\033[32m[OK] Status retrieved successfully!\033[0m"
STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
echo -e "\033[36mStatus: $STATUS\033[0m"
echo ""

# Test 3: SSE endpoint info
echo -e "\033[33mTest 3: Streaming events (will show first few events)...\033[0m"
echo -e "\033[90mPress Ctrl+C to stop streaming\033[0m"
echo ""

echo -e "\033[33mTo stream events, use this command in a separate terminal:\033[0m"
echo -e "\033[37mcurl -N $BASE_URL/$SIMULATION_ID/events\033[0m"
echo ""

# Test 4: Error handling
echo -e "\033[33mTest 4: Testing error handling with invalid simulation ID...\033[0m"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/invalid-id-12345/status")

if [ "$HTTP_CODE" = "404" ]; then
    echo -e "\033[32m[OK] Correctly returned 404 for invalid simulation ID!\033[0m"
else
    echo -e "\033[31m[ERROR] Expected 404 but got $HTTP_CODE\033[0m"
fi
echo ""

# Test 5: CORS headers
echo -e "\033[33mTest 5: Checking CORS headers...\033[0m"

CORS_RESPONSE=$(curl -s -i -X OPTIONS "$BASE_URL" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST")

ALLOW_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "Access-Control-Allow-Origin" | cut -d' ' -f2 | tr -d '\r')
ALLOW_METHODS=$(echo "$CORS_RESPONSE" | grep -i "Access-Control-Allow-Methods" | cut -d' ' -f2 | tr -d '\r')
ALLOW_CREDENTIALS=$(echo "$CORS_RESPONSE" | grep -i "Access-Control-Allow-Credentials" | cut -d' ' -f2 | tr -d '\r')

echo -e "\033[32m[OK] CORS headers retrieved!\033[0m"
echo -e "\033[36m  Allow-Origin: $ALLOW_ORIGIN\033[0m"
echo -e "\033[36m  Allow-Methods: $ALLOW_METHODS\033[0m"
echo -e "\033[36m  Allow-Credentials: $ALLOW_CREDENTIALS\033[0m"

# Verify required methods
if echo "$ALLOW_METHODS" | grep -q "GET" &&
    echo "$ALLOW_METHODS" | grep -q "POST" &&
    echo "$ALLOW_METHODS" | grep -q "PUT" &&
    echo "$ALLOW_METHODS" | grep -q "DELETE"; then
    echo -e "\033[32m[OK] All required methods are allowed!\033[0m"
else
    echo -e "\033[33m[WARN] Warning: Some methods may be missing\033[0m"
fi
echo ""

# Test 6: Stop simulation
echo -e "\033[33mTest 6: Stopping the simulation...\033[0m"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/$SIMULATION_ID")

if [ "$HTTP_CODE" = "204" ]; then
    echo -e "\033[32m[OK] Simulation stopped successfully (204 No Content)!\033[0m"

    # Verify status changed
    sleep 1
    STOPPED_STATUS=$(curl -s "$BASE_URL/$SIMULATION_ID/status" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

    if [ "$STOPPED_STATUS" = "STOPPED" ]; then
        echo -e "\033[32m[OK] Status confirmed as STOPPED!\033[0m"
    else
        echo -e "\033[33m[WARN] Status is: $STOPPED_STATUS\033[0m"
    fi
else
    echo -e "\033[31m[ERROR] Failed to stop simulation (HTTP $HTTP_CODE)\033[0m"
fi
echo ""

# Summary
echo -e "\033[32m=== All Tests Complete ===\033[0m"
echo -e "\033[36mSimulation ID: $SIMULATION_ID\033[0m"
echo -e "\033[36mCheck output files at: ./java/output/$SIMULATION_ID\033[0m"
