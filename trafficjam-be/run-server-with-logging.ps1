# Run Spring Boot server and redirect all output to a log file
# This captures both stdout and stderr in real-time
#
# Usage: .\run-server-with-logging.ps1
#
# This script is recommended for testing and debugging as it:
# - Captures all server output to server-output.log
# - Displays output in the console simultaneously
# - Makes it easier to review server logs after running tests
#
# See TESTING.md for the complete testing guide

$logFile = "server-output.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Clear previous log file and add header
"=== Server started at $timestamp ===" | Out-File $logFile -Encoding UTF8

Write-Host "Starting Spring Boot server..."
Write-Host "All output will be written to: $logFile"
Write-Host "Press Ctrl+C to stop the server"
Write-Host ""

# Suppress Maven/Guice deprecation warnings for sun.misc.Unsafe
# This silences warnings from Maven's internal dependencies
$env:MAVEN_OPTS = "--add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/sun.misc=ALL-UNNAMED"

# Change to java directory and run Maven
# The *>&1 redirects all streams (stdout and stderr) to stdout
# Tee-Object writes to both the file and the console
cd C:\Users\clanc\Desktop\trafficjam\trafficjam-be\java
mvn spring-boot:run *>&1 | Tee-Object -FilePath "C:\Users\clanc\Desktop\trafficjam\trafficjam-be\$logFile" -Append
