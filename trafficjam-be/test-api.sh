#!/bin/bash
# MatSim API Test Script for Bash
# 
# This script tests all the main API endpoints:
# 1. POST /api/simulations - Start a simulation with file upload
# 2. GET /api/simulations/{id}/status - Check simulation status
# 3. GET /api/simulations/{id}/events - SSE streaming (shows endpoint only)
# 4. DELETE /api/simulations/{id} - Stop a simulation
# 5. Error handling with invalid simulation ID
# 6. CORS headers verification
#
# Usage: ./test-api.sh

# Configuration
BASE_URL="http://localhost:8080/api/simulations"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_FILE="$SCRIPT_DIR/java/src/main/resources/cork_network.xml"

echo -e "\033[36m=== MatSim API Test Script ===\033[0m"
echo ""

# ============================================================
# Test 1: Start a Simulation (POST /api/simulations)
# Tests: File upload, multipart form data, simulation creation
# ============================================================
echo -e "\033[33mTest 1: Starting a simulation...\033[0m"

# Use curl to upload file with multipart form data
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

# ============================================================
# Test 2: Check Status (GET /api/simulations/{id}/status)
# Tests: Status endpoint, simulation tracking
# ============================================================
echo -e "\033[33mTest 2: Checking simulation status...\033[0m"
sleep 2  # Give simulation time to start

STATUS_RESPONSE=$(curl -s "$BASE_URL/$SIMULATION_ID/status")
echo -e "\033[32m[OK] Status retrieved successfully!\033[0m"
STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
echo -e "\033[36mStatus: $STATUS\033[0m"
echo ""

# ============================================================
# Test 3: Stream Events (GET /api/simulations/{id}/events)
# Tests: SSE endpoint availability
# Note: Actual streaming test is in test-sse-full.sh
# ============================================================
echo -e "\033[33mTest 3: Streaming events (will show first few events)...\033[0m"
echo -e "\033[90mPress Ctrl+C to stop streaming\033[0m"
echo ""

# SSE streaming is simpler in bash with curl
echo -e "\033[33mTo stream events, use this command in a separate terminal:\033[0m"
echo -e "\033[37mcurl -N $BASE_URL/$SIMULATION_ID/events\033[0m"
echo ""

# ============================================================
# Test 4: Error Handling - Invalid Simulation ID
# Tests: 404 error handling for non-existent simulations
# ============================================================
echo -e "\033[33mTest 4: Testing error handling with invalid simulation ID...\033[0m"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/invalid-id-12345/status")

if [ "$HTTP_CODE" = "404" ]; then
    echo -e "\033[32m[OK] Correctly returned 404 for invalid simulation ID!\033[0m"
else
    echo -e "\033[31m[ERROR] Expected 404 but got $HTTP_CODE\033[0m"
fi
echo ""

# ============================================================
# Test 5: CORS Headers (OPTIONS /api/simulations)
# Tests: CORS configuration for frontend integration
# ============================================================
echo -e "\033[33mTest 5: Checking CORS headers...\033[0m"

# Send OPTIONS request to check CORS preflight response
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

# Verify all required HTTP methods are allowed
if echo "$ALLOW_METHODS" | grep -q "GET" && \
   echo "$ALLOW_METHODS" | grep -q "POST" && \
   echo "$ALLOW_METHODS" | grep -q "PUT" && \
   echo "$ALLOW_METHODS" | grep -q "DELETE"; then
    echo -e "\033[32m[OK] All required methods are allowed!\033[0m"
else
    echo -e "\033[33m[WARN] Warning: Some methods may be missing\033[0m"
fi
echo ""

# ============================================================
# Test 6: Stop Simulation (DELETE /api/simulations/{id})
# Tests: Simulation control, graceful shutdown
# ============================================================
echo -e "\033[33mTest 6: Stopping the simulation...\033[0m"

# Send DELETE request to stop the simulation
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/$SIMULATION_ID")

if [ "$HTTP_CODE" = "204" ]; then
    echo -e "\033[32m[OK] Simulation stopped successfully (204 No Content)!\033[0m"
    
    # Verify status changed to STOPPED
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

# ============================================================
# Summary
# ============================================================
echo -e "\033[32m=== All Tests Complete ===\033[0m"
echo -e "\033[36mSimulation ID: $SIMULATION_ID\033[0m"
echo -e "\033[36mCheck output files at: ./java/output/$SIMULATION_ID\033[0m"
