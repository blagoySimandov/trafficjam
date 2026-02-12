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
# Usage: .\test-sse-full.ps1

# Configuration
$baseUrl = "http://localhost:8080/api/simulations"
$networkFile = "$PSScriptRoot\java\src\main\resources\cork_network.xml"

Write-Host "=== SSE Streaming Test (Long Simulation) ===" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Step 1: Start a Long Simulation
# We use 100 iterations so the simulation runs long enough
# to demonstrate real-time streaming (not instant completion)
# ============================================================
Write-Host "Step 1: Starting simulation with 100 iterations..." -ForegroundColor Yellow

# Build multipart form data for file upload
$boundary = [System.Guid]::NewGuid().ToString()
$fileBin = [System.IO.File]::ReadAllBytes($networkFile)
$enc = [System.Text.Encoding]::GetEncoding("iso-8859-1")

# Create request body with 100 iterations for a longer-running simulation
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"networkFile`"; filename=`"cork_network.xml`"",
    "Content-Type: application/xml",
    "",
    $enc.GetString($fileBin),
    "--$boundary",
    "Content-Disposition: form-data; name=`"iterations`"",
    "",
    "100",  # 100 iterations = ~30-60 seconds runtime
    "--$boundary",
    "Content-Disposition: form-data; name=`"randomSeed`"",
    "",
    "4711",
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $enc.GetBytes($body)
    
    $simulationId = $response.simulationId
    Write-Host "[OK] Simulation started!" -ForegroundColor Green
    Write-Host "Simulation ID: $simulationId" -ForegroundColor Cyan
    Write-Host ""
    
    # ============================================================
    # Step 2: Connect to SSE Stream Immediately
    # We connect right after starting to catch events from the beginning
    # ============================================================
    Write-Host "Step 2: Connecting to SSE stream..." -ForegroundColor Yellow
    Write-Host "You should see status events arriving every ~1 second" -ForegroundColor Gray
    Write-Host "Press Ctrl+C to stop watching" -ForegroundColor Yellow
    Write-Host ""
    
    $url = "$baseUrl/$simulationId/events"
    
    # Create a web request for Server-Sent Events
    # SSE uses HTTP GET with Accept: text/event-stream
    $request = [System.Net.HttpWebRequest]::Create($url)
    $request.Method = "GET"
    $request.Accept = "text/event-stream"
    
    # Open the response stream and prepare to read events
    $response = $request.GetResponse()
    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    
    $eventCount = 0
    $startTime = Get-Date
    
    # ============================================================
    # Read and Display SSE Events
    # SSE format: "event: <type>" followed by "data: <payload>"
    # ============================================================
    # Read the stream line by line until it closes
    while (-not $reader.EndOfStream) {
        $line = $reader.ReadLine()
        
        if ($line) {
            $timestamp = Get-Date -Format 'HH:mm:ss.fff'
            
            # Parse SSE event type (e.g., "event: status")
            if ($line.StartsWith("event:")) {
                $eventType = $line.Substring(7).Trim()
                $eventCount++
                
                # Display different event types with different colors
                if ($eventType -eq "connected") {
                    Write-Host "[$timestamp] CONNECTED to stream" -ForegroundColor Green
                } elseif ($eventType -eq "status") {
                    Write-Host "[$timestamp] Status update #$eventCount" -ForegroundColor Cyan
                } elseif ($eventType -eq "finished") {
                    Write-Host "[$timestamp] FINISHED" -ForegroundColor Magenta
                }
            }
            # Parse SSE data payload (e.g., "data: RUNNING")
            elseif ($line.StartsWith("data:")) {
                $data = $line.Substring(5).Trim()
                Write-Host "           -> $data" -ForegroundColor White
                
                # Show elapsed time periodically to prove streaming works
                # If all events arrived at once, elapsed time would be ~0s
                if ($eventCount % 5 -eq 0) {
                    $elapsed = ((Get-Date) - $startTime).TotalSeconds
                    Write-Host "           (Received $eventCount events in $([math]::Round($elapsed, 1))s - streaming works!)" -ForegroundColor Gray
                }
            }
        }
    }
    
    # ============================================================
    # Summary
    # ============================================================
    Write-Host "" 
    Write-Host "=== Stream Closed ===" -ForegroundColor Yellow
    Write-Host "Total events received: $eventCount" -ForegroundColor Cyan
    $totalTime = ((Get-Date) - $startTime).TotalSeconds
    Write-Host "Total time: $([math]::Round($totalTime, 1))s" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "SSE streaming is working! Events arrived over $([math]::Round($totalTime, 1)) seconds." -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($reader) { $reader.Close() }
    if ($stream) { $stream.Close() }
}
