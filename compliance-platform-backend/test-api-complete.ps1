# Complete API Testing Script
# Make sure server is running: npm start

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Compliance Platform API Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET
    Write-Host "   [PASS] Health check passed" -ForegroundColor Green
    Write-Host "   Status: $($health.message)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure server is running: npm start" -ForegroundColor Yellow
    exit 1
}

# Test 2: Register New User
Write-Host "`n2. Registering New User..." -ForegroundColor Yellow
$registerBody = @{
    username = "testuser$(Get-Random -Maximum 9999)"
    email = "testuser$(Get-Random -Maximum 9999)@example.com"
    password = "Secure123"
    fullName = "Test User"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json"
    
    Write-Host "   [PASS] Registration successful" -ForegroundColor Green
    Write-Host "   Username: $($registerResponse.data.user.username)" -ForegroundColor Cyan
    Write-Host "   Email: $($registerResponse.data.user.email)" -ForegroundColor Cyan
    Write-Host "   User ID: $($registerResponse.data.user.id)" -ForegroundColor Gray
    
    $token = $registerResponse.data.token
    $testEmail = ($registerBody | ConvertFrom-Json).email
    $testPassword = ($registerBody | ConvertFrom-Json).password
    
} catch {
    Write-Host "   [FAIL] Registration failed" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $error = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($error.message)" -ForegroundColor Red
        if ($error.errors) {
            $error.errors | ForEach-Object {
                Write-Host "   - $($_.field): $($_.message)" -ForegroundColor Yellow
            }
        }
    }
    exit 1
}

# Test 3: Login with New User
Write-Host "`n3. Logging in with New User..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    Write-Host "   [PASS] Login successful" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.data.user.username)" -ForegroundColor Cyan
    Write-Host "   Last Login: $($loginResponse.data.user.lastLogin)" -ForegroundColor Gray
    
    $token = $loginResponse.data.token
    Write-Host "   Token (first 50 chars): $($token.Substring(0, 50))..." -ForegroundColor Yellow
    
} catch {
    Write-Host "   [FAIL] Login failed" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $error = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($error.message)" -ForegroundColor Red
    }
    exit 1
}

# Test 4: Get Current User Profile
Write-Host "`n4. Getting User Profile (Protected Route)..." -ForegroundColor Yellow
$headers = @{ "Authorization" = "Bearer $token" }

try {
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" `
        -Method GET `
        -Headers $headers
    
    Write-Host "   [PASS] Profile retrieved successfully" -ForegroundColor Green
    Write-Host "   Full Name: $($profileResponse.data.fullName)" -ForegroundColor Cyan
    Write-Host "   Email: $($profileResponse.data.email)" -ForegroundColor Cyan
    Write-Host "   Is Admin: $($profileResponse.data.isAdmin)" -ForegroundColor Gray
    Write-Host "   Is Active: $($profileResponse.data.isActive)" -ForegroundColor Gray
    Write-Host "   Created: $($profileResponse.data.createdAt)" -ForegroundColor Gray
    
} catch {
    Write-Host "   [FAIL] Profile retrieval failed" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $error = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($error.message)" -ForegroundColor Red
    }
    exit 1
}

# Test 5: Test with Invalid Token
Write-Host "`n5. Testing Invalid Token (Should Fail)..." -ForegroundColor Yellow
$badHeaders = @{ "Authorization" = "Bearer invalid_token_here" }

try {
    $badResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" `
        -Method GET `
        -Headers $badHeaders
    
    Write-Host "   [FAIL] Should have failed but didn't" -ForegroundColor Red
    
} catch {
    Write-Host "   [PASS] Correctly rejected invalid token" -ForegroundColor Green
    if ($_.ErrorDetails.Message) {
        $error = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Expected Error: $($error.message)" -ForegroundColor Gray
    }
}

# Test 6: Test Login with Admin User
Write-Host "`n6. Logging in as Admin..." -ForegroundColor Yellow
$adminLoginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $adminResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -Body $adminLoginBody `
        -ContentType "application/json"
    
    Write-Host "   [PASS] Admin login successful" -ForegroundColor Green
    Write-Host "   Username: $($adminResponse.data.user.username)" -ForegroundColor Cyan
    Write-Host "   Is Admin: $($adminResponse.data.user.isAdmin)" -ForegroundColor Cyan
    
} catch {
    Write-Host "   [FAIL] Admin login failed" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $error = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($error.message)" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  All Tests Completed!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[TOKEN] Your test token (valid for 24h):" -ForegroundColor Yellow
Write-Host $token -ForegroundColor Gray
Write-Host "`nSaved to `$token variable for further testing" -ForegroundColor Yellow
