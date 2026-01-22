# NIST CSF Assessment Workflow Test Script
# Tests the complete assessment lifecycle

$baseUrl = "http://localhost:3000/api"

Write-Host "`n=== NIST CSF Assessment Workflow Test ===" -ForegroundColor Cyan
Write-Host "Testing complete assessment lifecycle`n" -ForegroundColor Cyan

# Step 1: Login
Write-Host "[STEP 1] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.data.token
    Write-Host "[PASS] Login successful" -ForegroundColor Green
    Write-Host "       User: $($loginResponse.data.user.username)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{ Authorization = "Bearer $token" }

# Step 2: Get NIST CSF Framework
Write-Host "`n[STEP 2] Fetching NIST CSF framework..." -ForegroundColor Yellow
try {
    $framework = Invoke-RestMethod -Uri "$baseUrl/nist-csf/functions" -Method GET
    Write-Host "[PASS] Framework retrieved" -ForegroundColor Green
    Write-Host "       Functions: $($framework.data.count)" -ForegroundColor Gray
    
    # Display functions
    foreach ($func in $framework.data.functions) {
        Write-Host "       - $($func.code): $($func.name) ($($func.controlCount) controls)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] Framework retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Create Assessment
Write-Host "`n[STEP 3] Creating new assessment..." -ForegroundColor Yellow
$assessmentBody = @{
    assessmentName = "Automated Test Assessment $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    assessmentType = "initial"
    description = "Test assessment created by automated script"
    scope = "Test scope - all systems"
    dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
} | ConvertTo-Json

try {
    $assessment = Invoke-RestMethod -Uri "$baseUrl/assessments" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $assessmentBody
    
    $assessmentId = $assessment.data.id
    Write-Host "[PASS] Assessment created" -ForegroundColor Green
    Write-Host "       ID: $assessmentId" -ForegroundColor Gray
    Write-Host "       Name: $($assessment.data.assessmentName)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Assessment creation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "       Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Assess Single Control
Write-Host "`n[STEP 4] Assessing single control..." -ForegroundColor Yellow
$controlBody = @{
    assessmentId = $assessmentId
    controlId = 1
    status = "fully_implemented"
    questionnaireResponse = "Asset inventory maintained in ServiceNow"
    comments = "Automated test - fully implemented"
    maturityLevel = "managed"
    complianceScore = 95
} | ConvertTo-Json

try {
    $controlAssessment = Invoke-RestMethod -Uri "$baseUrl/assessments/$assessmentId/controls" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $controlBody
    
    Write-Host "[PASS] Control assessed" -ForegroundColor Green
    Write-Host "       Control: $($controlAssessment.data.control.code)" -ForegroundColor Gray
    Write-Host "       Status: $($controlAssessment.data.implementationStatus)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Control assessment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "       Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Step 5: Bulk Assess Controls
Write-Host "`n[STEP 5] Bulk assessing multiple controls..." -ForegroundColor Yellow
$bulkBody = @{
    assessmentId = $assessmentId
    controls = @(
        @{
            controlId = 2
            status = "partially_implemented"
            comments = "Software inventory in progress"
            complianceScore = 50
        },
        @{
            controlId = 3
            status = "fully_implemented"
            comments = "Data flows documented"
            complianceScore = 90
        },
        @{
            controlId = 4
            status = "not_implemented"
            remediationPlan = "Plan to implement by Q2"
            complianceScore = 0
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $bulkResult = Invoke-RestMethod -Uri "$baseUrl/assessments/$assessmentId/controls/bulk" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $bulkBody
    
    Write-Host "[PASS] Bulk assessment completed" -ForegroundColor Green
    Write-Host "       Successful: $($bulkResult.data.successfulCount)" -ForegroundColor Gray
    Write-Host "       Failed: $($bulkResult.data.failedCount)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Bulk assessment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "       Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Step 6: Get Assessment Progress
Write-Host "`n[STEP 6] Checking assessment progress..." -ForegroundColor Yellow
try {
    $progress = Invoke-RestMethod -Uri "$baseUrl/assessments/$assessmentId/progress" `
        -Headers $headers
    
    Write-Host "[PASS] Progress retrieved" -ForegroundColor Green
    Write-Host "       Overall: $($progress.data.overallProgress.completionPercentage)%" -ForegroundColor Gray
    Write-Host "       Assessed: $($progress.data.overallProgress.assessedControls)/$($progress.data.overallProgress.totalControls)" -ForegroundColor Gray
    
    Write-Host "`n       Progress by Function:" -ForegroundColor Gray
    foreach ($func in $progress.data.progressByFunction) {
        Write-Host "       - $($func.functionCode): $($func.completionPercentage)% ($($func.assessedControls)/$($func.totalControls))" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] Progress retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Get All Control Assessments
Write-Host "`n[STEP 7] Retrieving all control assessments..." -ForegroundColor Yellow
try {
    $controls = Invoke-RestMethod -Uri "$baseUrl/assessments/$assessmentId/controls?groupBy=function" `
        -Headers $headers
    
    Write-Host "[PASS] Control assessments retrieved" -ForegroundColor Green
    Write-Host "       Total: $($controls.data.totalControls)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Control assessments retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Update Assessment Status
Write-Host "`n[STEP 8] Updating assessment status..." -ForegroundColor Yellow
$updateBody = @{
    status = "in_progress"
    description = "Updated by automated test - in progress"
} | ConvertTo-Json

try {
    $updated = Invoke-RestMethod -Uri "$baseUrl/assessments/$assessmentId" `
        -Method PUT `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $updateBody
    
    Write-Host "[PASS] Assessment updated" -ForegroundColor Green
    Write-Host "       Status: $($updated.data.status)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Assessment update failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 9: Get Assessment Details
Write-Host "`n[STEP 9] Retrieving assessment details..." -ForegroundColor Yellow
try {
    $assessmentDetails = Invoke-RestMethod -Uri "$baseUrl/assessments/$assessmentId" `
        -Headers $headers
    
    Write-Host "[PASS] Assessment details retrieved" -ForegroundColor Green
    Write-Host "       ID: $($assessmentDetails.data.id)" -ForegroundColor Gray
    Write-Host "       Name: $($assessmentDetails.data.assessmentName)" -ForegroundColor Gray
    Write-Host "       Status: $($assessmentDetails.data.status)" -ForegroundColor Gray
    Write-Host "       Completion: $($assessmentDetails.data.completionPercentage)%" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Assessment retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 10: Get All Assessments
Write-Host "`n[STEP 10] Retrieving all assessments..." -ForegroundColor Yellow
try {
    $allAssessments = Invoke-RestMethod -Uri "$baseUrl/assessments" `
        -Headers $headers
    
    Write-Host "[PASS] All assessments retrieved" -ForegroundColor Green
    Write-Host "       Total: $($allAssessments.data.pagination.totalCount)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] All assessments retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Assessment ID $assessmentId created and tested successfully`n" -ForegroundColor Green
