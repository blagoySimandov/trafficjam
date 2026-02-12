#!/bin/bash
# Start Spring Boot server with output logging to server-output.log

LOG_FILE="server-output.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "=== Server started at $TIMESTAMP ===" > "$LOG_FILE"

echo "Starting Spring Boot server..."
echo "All output will be written to: $LOG_FILE"
echo "Press Ctrl+C to stop the server"
echo ""

# Run Maven and log output
cd ./java
mvn spring-boot:run 2>&1 | tee -a "../$LOG_FILE"
