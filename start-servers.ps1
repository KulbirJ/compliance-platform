# Start Compliance Platform Servers
# This script starts both the backend (port 3000) and frontend (port 5173) servers

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  Compliance Platform Startup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if ports are already in use
$backendPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($backendPort) {
    Write-Host "`n[WARNING] Backend port 3000 is already in use" -ForegroundColor Yellow
    $response = Read-Host "Stop existing process? (y/n)"
    if ($response -eq 'y') {
        Stop-Process -Id $backendPort.OwningProcess -Force
        Write-Host "[OK] Stopped existing backend process" -ForegroundColor Green
        Start-Sleep -Seconds 1
    } else {
        Write-Host "[ERROR] Cannot start - port already in use" -ForegroundColor Red
        exit 1
    }
}

if ($frontendPort) {
    Write-Host "`n[WARNING] Frontend port 5173 is already in use" -ForegroundColor Yellow
    $response = Read-Host "Stop existing process? (y/n)"
    if ($response -eq 'y') {
        Stop-Process -Id $frontendPort.OwningProcess -Force
        Write-Host "[OK] Stopped existing frontend process" -ForegroundColor Green
        Start-Sleep -Seconds 1
    } else {
        Write-Host "[ERROR] Cannot start - port already in use" -ForegroundColor Red
        exit 1
    }
}

# Start Backend Server
Write-Host "`n[STARTING] Backend Server..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "packages\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server' -ForegroundColor Green; node src/server.js"
Write-Host "   Backend starting on http://localhost:3000" -ForegroundColor Gray

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "`n[STARTING] Frontend Server..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "packages\frontend-standalone"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server' -ForegroundColor Green; pnpm dev"
Write-Host "   Frontend starting on http://localhost:5173" -ForegroundColor Gray

# Wait and verify servers are running
Write-Host "`n[WAITING] Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$backend = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$frontend = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  Server Status" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

if ($backend) {
    Write-Host "[OK] Backend:  RUNNING" -ForegroundColor Green
    Write-Host "     http://localhost:3000/api" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Backend:  NOT RUNNING" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "[OK] Frontend: RUNNING" -ForegroundColor Green
    Write-Host "     http://localhost:5173" -ForegroundColor Gray
    Write-Host "     http://localhost:5173/risks (Risk Register)" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Frontend: NOT RUNNING" -ForegroundColor Red
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in server windows to stop" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
