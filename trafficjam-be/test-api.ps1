# MatSim API Test Script for PowerShell
# 
# This script tests all the main API endpoints:
# 1. POST /api/simulations - Start a simulation with file upload
# 2. GET /api/simulations/{id}/status - Check simulation status
# 3. GET /api/simulations/{id}/events - SSE streaming (shows endpoint only)
# 4. DELETE /api/simulations/{id} - Stop a simulation
# 5. Error handling with invalid simulation ID
# 6. CORS headers verification
#
# Usage: .\test-api.ps1

# Configuration
$baseUrl = "http://localhost:8080/api/simulations"
$networkFile = "c:\Users\clanc\Desktop\trafficjam\investigations\matsim-data\cork_network.xml"

Write-Host "=== MatSim API Test Script ===" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Test 1: Start a Simulation (POST /api/simulations)
# Tests: File upload, multipart form data, simulation creation
# ============================================================
Write-Host "Test 1: Starting a simulation..." -ForegroundColor Yellow

# Create multipart form data for file upload
# PowerShell doesn't have built-in multipart support, so we build it manually
$boundary = [System.Guid]::NewGuid().ToString()
$fileBin = [System.IO.File]::ReadAllBytes($networkFile)
$enc = [System.Text.Encoding]::GetEncoding("iso-8859-1")

# Build multipart form body with:
# - networkFile: The MatSim network XML file
# - iterations: Number of simulation iterations (5 for quick test)
# - randomSeed: Random seed for reproducibility
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"networkFile`"; filename=`"cork_network.xml`"",
    "Content-Type: application/xml",
    "",
    $enc.GetString($fileBin),
    "--$boundary",
    "Content-Disposition: form-data; name=`"iterations`"",
    "",
    "5",
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
    
    Write-Host "[OK] Simulation started successfully!" -ForegroundColor Green
    Write-Host "Simulation ID: $($response.simulationId)" -ForegroundColor Cyan
    Write-Host "Status: $($response.status)" -ForegroundColor Cyan
    $simulationId = $response.simulationId
    Write-Host ""
    
    # ============================================================
    # Test 2: Check Status (GET /api/simulations/{id}/status)
    # Tests: Status endpoint, simulation tracking
    # ============================================================
    Write-Host "Test 2: Checking simulation status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2  # Give simulation time to start
    
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/$simulationId/status" -Method Get
    Write-Host "[OK] Status retrieved successfully!" -ForegroundColor Green
    Write-Host "Status: $($statusResponse.status)" -ForegroundColor Cyan
    Write-Host ""
    
    # ============================================================
    # Test 3: Stream Events (GET /api/simulations/{id}/events)
    # Tests: SSE endpoint availability
    # Note: Actual streaming test is in test-sse-full.ps1
    # ============================================================
    Write-Host "Test 3: Streaming events (will show first few events)..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop streaming" -ForegroundColor Gray
    Write-Host ""
    
    # SSE streaming in PowerShell is complex, so we just show the endpoint
    # For actual streaming test, use test-sse-full.ps1
    Write-Host "To stream events, use this command in a separate terminal:" -ForegroundColor Yellow
    Write-Host "curl -N http://localhost:8080/api/simulations/$simulationId/events" -ForegroundColor White
    Write-Host ""
    
    # ============================================================
    # Test 4: Error Handling - Invalid Simulation ID
    # Tests: 404 error handling for non-existent simulations
    # ============================================================
    Write-Host "Test 4: Testing error handling with invalid simulation ID..." -ForegroundColor Yellow
    try {
        $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/invalid-id-12345/status" -Method Get -ErrorAction Stop
        Write-Host "[ERROR] Expected 404 error but got success response!" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "[OK] Correctly returned 404 for invalid simulation ID!" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Write-Host ""
    
    # ============================================================
    # Test 5: CORS Headers (OPTIONS /api/simulations)
    # Tests: CORS configuration for frontend integration
    # ============================================================
    Write-Host "Test 5: Checking CORS headers..." -ForegroundColor Yellow
    try {
        # Send OPTIONS request to check CORS preflight response
        $corsResponse = Invoke-WebRequest -Uri $baseUrl -Method Options `
            -Headers @{
                "Origin" = "http://localhost:3000"
                "Access-Control-Request-Method" = "POST"
            } -UseBasicParsing
        
        $allowOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
        $allowMethods = $corsResponse.Headers["Access-Control-Allow-Methods"]
        $allowCredentials = $corsResponse.Headers["Access-Control-Allow-Credentials"]
        
        Write-Host "[OK] CORS headers retrieved!" -ForegroundColor Green
        Write-Host "  Allow-Origin: $allowOrigin" -ForegroundColor Cyan
        Write-Host "  Allow-Methods: $allowMethods" -ForegroundColor Cyan
        Write-Host "  Allow-Credentials: $allowCredentials" -ForegroundColor Cyan
        
        # Verify all required HTTP methods are allowed
        if ($allowMethods -match "GET.*POST.*PUT.*DELETE") {
            Write-Host "[OK] All required methods are allowed!" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Warning: Some methods may be missing" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR] CORS check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # ============================================================
    # Test 6: Stop Simulation (DELETE /api/simulations/{id})
    # Tests: Simulation control, graceful shutdown
    # ============================================================
    Write-Host "Test 6: Stopping the simulation..." -ForegroundColor Yellow
    try {
        # Send DELETE request to stop the simulation
        Invoke-RestMethod -Uri "$baseUrl/$simulationId" -Method Delete -ErrorAction Stop
        Write-Host "[OK] Simulation stopped successfully (204 No Content)!" -ForegroundColor Green
        
        # Verify status changed to STOPPED
        Start-Sleep -Seconds 1
        $stoppedStatus = Invoke-RestMethod -Uri "$baseUrl/$simulationId/status" -Method Get
        if ($stoppedStatus.status -eq "STOPPED") {
            Write-Host "[OK] Status confirmed as STOPPED!" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Status is: $($stoppedStatus.status)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR] Failed to stop simulation: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # ============================================================
    # Summary
    # ============================================================
    Write-Host "=== All Tests Complete ===" -ForegroundColor Green
    Write-Host "Simulation ID: $simulationId" -ForegroundColor Cyan
    Write-Host "Check output files at: c:\Users\clanc\Desktop\trafficjam\trafficjam-be\java\output\$simulationId" -ForegroundColor Cyan
    
} catch {
    Write-Host "[ERROR] Error occurred!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

