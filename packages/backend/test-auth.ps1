# Test Login
Write-Host "`n=== Testing Admin Login ===" -ForegroundColor Yellow

$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    Write-Host "`n✓ LOGIN SUCCESSFUL!" -ForegroundColor Green
    Write-Host "`nUser Details:" -ForegroundColor Cyan
    Write-Host "  Username: $($response.data.user.username)"
    Write-Host "  Email: $($response.data.user.email)"
    Write-Host "  Role: $($response.data.user.role)"
    Write-Host "  Name: $($response.data.user.firstName) $($response.data.user.lastName)"
    
    if ($response.data.user.organizations) {
        Write-Host "`nOrganizations:" -ForegroundColor Cyan
        foreach ($org in $response.data.user.organizations) {
            Write-Host "  - $($org.name) (Role: $($org.role))"
        }
    }
    
    $token = $response.data.token
    Write-Host "`nJWT Token (first 60 chars):" -ForegroundColor Yellow
    Write-Host "  $($token.Substring(0, [Math]::Min(60, $token.Length)))..."
    
    # Save token to variable
    $global:authToken = $token
    
    # Test protected endpoint
    Write-Host "`n=== Testing Protected Endpoint (Profile) ===" -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $profile = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" -Method GET -Headers $headers
    
    Write-Host "`n✓ PROFILE RETRIEVED!" -ForegroundColor Green
    Write-Host "  User ID: $($profile.data.id)"
    Write-Host "  Created At: $($profile.data.createdAt)"
    Write-Host "  Organizations: $($profile.data.organizations.Count)"
    
    Write-Host "`n=== Test Complete ===" -ForegroundColor Green
    Write-Host "Token saved to `$global:authToken variable for future requests" -ForegroundColor Gray
    
} catch {
    Write-Host "`n✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
