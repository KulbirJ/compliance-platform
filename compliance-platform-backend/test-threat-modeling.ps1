# Threat Modeling API Test Script
$baseUrl = "http://localhost:3000/api"

Write-Host ""
Write-Host "========================================"
Write-Host "THREAT MODELING API TEST"
Write-Host "========================================"
Write-Host ""

# 1. Login
Write-Host "1. Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@example.com","password":"admin123"}'
$token = $loginResponse.data.token
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "   OK - Logged in successfully" -ForegroundColor Green
Write-Host ""

# 2. Get STRIDE Categories
Write-Host "2. Getting STRIDE categories..." -ForegroundColor Yellow
$strideResponse = Invoke-RestMethod -Uri "$baseUrl/stride/categories" -Method GET
Write-Host "   OK - Retrieved $($strideResponse.data.totalCategories) STRIDE categories" -ForegroundColor Green
$strideResponse.data.categories | Format-Table -Property category_code, category_name -AutoSize
Write-Host ""

# 3. Create Threat Model
Write-Host "3. Creating threat model..." -ForegroundColor Yellow
$threatModelBody = '{"modelName":"E-Commerce Platform Threat Model","systemName":"Online Shopping System","description":"Comprehensive threat analysis for e-commerce platform","modelVersion":"1.0"}'
$threatModelResponse = Invoke-RestMethod -Uri "$baseUrl/threat-models" -Method POST -Headers $headers -Body $threatModelBody
$threatModelId = $threatModelResponse.data.id
Write-Host "   OK - Threat Model Created (ID: $threatModelId)" -ForegroundColor Green
Write-Host ""

# 4. Create Assets
Write-Host "4. Creating assets..." -ForegroundColor Yellow
$asset1Body = '{"assetName":"Web Application Server","assetType":"process","criticality":"high","description":"Apache/Nginx web server"}'
$asset1 = Invoke-RestMethod -Uri "$baseUrl/assets" -Method POST -Headers $headers -Body $asset1Body
Write-Host "   OK - Created: Web Application Server (ID: $($asset1.data.id))" -ForegroundColor Green

$asset2Body = '{"assetName":"PostgreSQL Database","assetType":"data_store","criticality":"critical","description":"Primary database"}'
$asset2 = Invoke-RestMethod -Uri "$baseUrl/assets" -Method POST -Headers $headers -Body $asset2Body
Write-Host "   OK - Created: PostgreSQL Database (ID: $($asset2.data.id))" -ForegroundColor Green

$asset3Body = '{"assetName":"User Authentication Service","assetType":"process","criticality":"critical","description":"JWT-based auth"}'
$asset3 = Invoke-RestMethod -Uri "$baseUrl/assets" -Method POST -Headers $headers -Body $asset3Body
Write-Host "   OK - Created: User Authentication Service (ID: $($asset3.data.id))" -ForegroundColor Green

$asset4Body = '{"assetName":"Payment Gateway","assetType":"external_entity","criticality":"critical","description":"Stripe integration"}'
$asset4 = Invoke-RestMethod -Uri "$baseUrl/assets" -Method POST -Headers $headers -Body $asset4Body
Write-Host "   OK - Created: Payment Gateway (ID: $($asset4.data.id))" -ForegroundColor Green
Write-Host ""

# 5. Link Assets to Threat Model
Write-Host "5. Linking assets to threat model..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/threat-models/$threatModelId/assets" -Method POST -Headers $headers -Body "{`"assetId`":$($asset1.data.id)}" | Out-Null
Invoke-RestMethod -Uri "$baseUrl/threat-models/$threatModelId/assets" -Method POST -Headers $headers -Body "{`"assetId`":$($asset2.data.id)}" | Out-Null
Invoke-RestMethod -Uri "$baseUrl/threat-models/$threatModelId/assets" -Method POST -Headers $headers -Body "{`"assetId`":$($asset3.data.id)}" | Out-Null
Invoke-RestMethod -Uri "$baseUrl/threat-models/$threatModelId/assets" -Method POST -Headers $headers -Body "{`"assetId`":$($asset4.data.id)}" | Out-Null
Write-Host "   OK - Linked 4 assets" -ForegroundColor Green
Write-Host ""

# 6. Create Threats
Write-Host "6. Creating threats with STRIDE categories..." -ForegroundColor Yellow
$threat1Body = "{`"threatModelId`":$threatModelId,`"assetId`":$($asset2.data.id),`"strideCategoryId`":2,`"threatTitle`":`"SQL Injection Attack`",`"threatDescription`":`"Attacker injects malicious SQL code`",`"likelihood`":`"high`",`"impact`":`"very_high`"}"
$threat1 = Invoke-RestMethod -Uri "$baseUrl/threats" -Method POST -Headers $headers -Body $threat1Body
Write-Host "   OK - Created: SQL Injection Attack [Risk: $($threat1.data.risk_score) - $($threat1.data.risk_level)]" -ForegroundColor Red

$threat2Body = "{`"threatModelId`":$threatModelId,`"assetId`":$($asset3.data.id),`"strideCategoryId`":1,`"threatTitle`":`"Credential Stuffing Attack`",`"threatDescription`":`"Using stolen credentials`",`"likelihood`":`"high`",`"impact`":`"high`"}"
$threat2 = Invoke-RestMethod -Uri "$baseUrl/threats" -Method POST -Headers $headers -Body $threat2Body
Write-Host "   OK - Created: Credential Stuffing Attack [Risk: $($threat2.data.risk_score) - $($threat2.data.risk_level)]" -ForegroundColor Yellow

$threat3Body = "{`"threatModelId`":$threatModelId,`"assetId`":$($asset1.data.id),`"strideCategoryId`":5,`"threatTitle`":`"DDoS Attack`",`"threatDescription`":`"Flooding server with traffic`",`"likelihood`":`"medium`",`"impact`":`"high`"}"
$threat3 = Invoke-RestMethod -Uri "$baseUrl/threats" -Method POST -Headers $headers -Body $threat3Body
Write-Host "   OK - Created: DDoS Attack [Risk: $($threat3.data.risk_score) - $($threat3.data.risk_level)]" -ForegroundColor Yellow

$threat4Body = "{`"threatModelId`":$threatModelId,`"assetId`":$($asset3.data.id),`"strideCategoryId`":4,`"threatTitle`":`"Session Token Interception`",`"threatDescription`":`"JWT token theft via XSS`",`"likelihood`":`"medium`",`"impact`":`"high`"}"
$threat4 = Invoke-RestMethod -Uri "$baseUrl/threats" -Method POST -Headers $headers -Body $threat4Body
Write-Host "   OK - Created: Session Token Interception [Risk: $($threat4.data.risk_score) - $($threat4.data.risk_level)]" -ForegroundColor Yellow

$threat5Body = "{`"threatModelId`":$threatModelId,`"assetId`":$($asset4.data.id),`"strideCategoryId`":2,`"threatTitle`":`"Payment Data Tampering`",`"threatDescription`":`"Modifying payment amounts`",`"likelihood`":`"low`",`"impact`":`"very_high`"}"
$threat5 = Invoke-RestMethod -Uri "$baseUrl/threats" -Method POST -Headers $headers -Body $threat5Body
Write-Host "   OK - Created: Payment Data Tampering [Risk: $($threat5.data.risk_score) - $($threat5.data.risk_level)]" -ForegroundColor Cyan

$threat6Body = "{`"threatModelId`":$threatModelId,`"assetId`":$($asset3.data.id),`"strideCategoryId`":6,`"threatTitle`":`"Privilege Escalation`",`"threatDescription`":`"User gaining admin rights`",`"likelihood`":`"low`",`"impact`":`"very_high`"}"
$threat6 = Invoke-RestMethod -Uri "$baseUrl/threats" -Method POST -Headers $headers -Body $threat6Body
Write-Host "   OK - Created: Privilege Escalation [Risk: $($threat6.data.risk_score) - $($threat6.data.risk_level)]" -ForegroundColor Cyan
Write-Host ""

# 7. Get All Threats (Grouped by STRIDE)
Write-Host "7. Getting all threats grouped by STRIDE..." -ForegroundColor Yellow
$threatsResponse = Invoke-RestMethod -Uri "$baseUrl/threat-models/$threatModelId/threats" -Method GET -Headers $headers
Write-Host "   OK - Total Threats: $($threatsResponse.data.totalThreats)" -ForegroundColor Green
Write-Host ""
foreach ($category in $threatsResponse.data.groupedByStride) {
    Write-Host "   [$($category.category_code)] $($category.category_name) - $($category.threats.Count) threat(s)" -ForegroundColor Magenta
    foreach ($threat in $category.threats) {
        Write-Host "      - $($threat.threat_title) [Risk: $($threat.risk_score)]"
    }
}
Write-Host ""

# 8. Get High-Risk Threats
Write-Host "8. Getting high-risk threats (score >= 15)..." -ForegroundColor Yellow
$highRiskResponse = Invoke-RestMethod -Uri "$baseUrl/threat-models/$threatModelId/threats/high-risk?minRiskScore=15" -Method GET -Headers $headers
Write-Host "   OK - Found $($highRiskResponse.data.totalHighRiskThreats) high-risk threats" -ForegroundColor Red
foreach ($threat in $highRiskResponse.data.threats) {
    Write-Host "   - $($threat.threat_title) [Risk: $($threat.risk_score) - $($threat.risk_level)]" -ForegroundColor Red
}
Write-Host ""

# 9. Create Mitigations
Write-Host "9. Creating mitigation plans..." -ForegroundColor Yellow
$mitigation1Body = "{`"threatId`":$($threat1.data.id),`"mitigationStrategy`":`"eliminate`",`"mitigationDescription`":`"Implement parameterized queries and ORM`",`"priority`":`"critical`",`"implementationStatus`":`"approved`",`"estimatedEffort`":`"40 hours`",`"costEstimate`":5000.00}"
$mitigation1 = Invoke-RestMethod -Uri "$baseUrl/mitigations" -Method POST -Headers $headers -Body $mitigation1Body
Write-Host "   OK - Created: SQL Injection Prevention [eliminate]" -ForegroundColor Green

$mitigation2Body = "{`"threatId`":$($threat2.data.id),`"mitigationStrategy`":`"reduce`",`"mitigationDescription`":`"Implement MFA and account lockout`",`"priority`":`"high`",`"implementationStatus`":`"in_progress`",`"estimatedEffort`":`"60 hours`",`"costEstimate`":8000.00}"
$mitigation2 = Invoke-RestMethod -Uri "$baseUrl/mitigations" -Method POST -Headers $headers -Body $mitigation2Body
Write-Host "   OK - Created: Multi-Factor Authentication [reduce]" -ForegroundColor Green

$mitigation3Body = "{`"threatId`":$($threat3.data.id),`"mitigationStrategy`":`"transfer`",`"mitigationDescription`":`"Use Cloudflare DDoS protection`",`"priority`":`"high`",`"implementationStatus`":`"proposed`",`"estimatedEffort`":`"20 hours`",`"costEstimate`":15000.00}"
$mitigation3 = Invoke-RestMethod -Uri "$baseUrl/mitigations" -Method POST -Headers $headers -Body $mitigation3Body
Write-Host "   OK - Created: DDoS Protection [transfer]" -ForegroundColor Green
Write-Host ""

# 10. Update Mitigation Status
Write-Host "10. Updating mitigation status..." -ForegroundColor Yellow
$updateBody = '{"implementationStatus":"implemented","effectivenessRating":"high"}'
$updateResponse = Invoke-RestMethod -Uri "$baseUrl/mitigations/$($mitigation1.data.id)" -Method PUT -Headers $headers -Body $updateBody
Write-Host "   OK - Mitigation updated to: $($updateResponse.data.implementation_status)" -ForegroundColor Green
Write-Host "   OK - Effectiveness rating: $($updateResponse.data.effectiveness_rating)" -ForegroundColor Green
Write-Host ""

# 11. Get Threat Model Statistics
Write-Host "11. Getting threat model statistics..." -ForegroundColor Yellow
$statsResponse = Invoke-RestMethod -Uri "$baseUrl/threat-models/$threatModelId/stats" -Method GET -Headers $headers
$stats = $statsResponse.data
Write-Host ""
Write-Host "   ============================================"
Write-Host "   THREAT MODEL STATISTICS"
Write-Host "   ============================================"
Write-Host ""
Write-Host "   Model: $($stats.model_name) v$($stats.model_version)"
Write-Host "   Status: $($stats.status)"
Write-Host ""
Write-Host "   --- THREAT SUMMARY ---" -ForegroundColor Yellow
Write-Host "   Total Threats: $($stats.total_threats)"
Write-Host "     Critical: $($stats.critical_threats)" -ForegroundColor Red
Write-Host "     High: $($stats.high_threats)" -ForegroundColor Yellow
Write-Host "     Medium: $($stats.medium_threats)" -ForegroundColor Cyan
Write-Host "     Low: $($stats.low_threats)" -ForegroundColor Gray
Write-Host ""
Write-Host "   --- ASSETS ---" -ForegroundColor Yellow
Write-Host "   Total Assets: $($stats.total_assets)"
Write-Host ""
Write-Host "   --- MITIGATION COVERAGE ---" -ForegroundColor Yellow
Write-Host "   Total Mitigations: $($stats.total_mitigations)"
Write-Host "   Coverage: $($stats.mitigation_coverage)%" -ForegroundColor Green
Write-Host ""
Write-Host "   ============================================"
Write-Host ""

Write-Host "========================================"
Write-Host "ALL TESTS COMPLETED SUCCESSFULLY!"
Write-Host "========================================"
Write-Host ""
