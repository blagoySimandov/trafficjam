#!/bin/bash
# Run Spring Boot server and redirect all output to a log file
# This captures both stdout and stderr in real-time
#
# Usage: ./run-server-with-logging.sh
#
# This script is recommended for testing and debugging as it:
# - Captures all server output to server-output.log
# - Displays output in the console simultaneously
# - Makes it easier to review server logs after running tests
#
# See TESTING.md for the complete testing guide

LOG_FILE="server-output.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Clear previous log file and add header
echo "=== Server started at $TIMESTAMP ===" > "$LOG_FILE"

echo "Starting Spring Boot server..."
echo "All output will be written to: $LOG_FILE"
echo "Press Ctrl+C to stop the server"
echo ""

# Suppress Maven/Guice deprecation warnings for sun.misc.Unsafe
# This silences warnings from Maven's internal dependencies
export MAVEN_OPTS="--add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/sun.misc=ALL-UNNAMED"

# Change to java directory and run Maven
# Use tee to write to both the file and the console
cd ./java
mvn spring-boot:run 2>&1 | tee -a "../$LOG_FILE"
