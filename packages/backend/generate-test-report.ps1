Write-Host "`n====== Compliance Platform - Report Generation Test ======`n" -ForegroundColor Cyan

# Step 1: Login
Write-Host "[1/6] Logging in..." -ForegroundColor Yellow
$loginBody = @{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $loginResponse.data.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "   Login successful! User: $($loginResponse.data.username)" -ForegroundColor Green

# Step 2: Check for existing assessments
Write-Host "`n[2/6] Checking for assessments..." -ForegroundColor Yellow
$assessments = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments" -Headers $headers

if ($assessments.data.Count -eq 0) {
    Write-Host "   No assessments found. Creating test assessment..." -ForegroundColor Yellow
    
    # Create a new assessment
    $newAssessmentBody = @{
        assessmentName = "Test Compliance Report - $(Get-Date -Format 'yyyy-MM-dd')"
        assessmentType = "initial"
        description = "Auto-generated test assessment for report generation"
        dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    } | ConvertTo-Json
    
    $newAssessment = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments" -Method POST -Headers $headers -ContentType "application/json" -Body $newAssessmentBody
    $assessmentId = $newAssessment.data.id
    Write-Host "   Created new assessment: $($newAssessment.data.assessmentName) (ID: $assessmentId)" -ForegroundColor Green
    
    # Add some control assessments
    Write-Host "   Adding control assessments..." -ForegroundColor Yellow
    $controlIds = @(1, 2, 3, 4, 5)
    $statuses = @("fully_implemented", "partially_implemented", "not_implemented", "in_progress")
    
    foreach ($controlId in $controlIds) {
        $controlBody = @{
            assessmentId = $assessmentId
            controlId = $controlId
            status = $statuses | Get-Random
            comments = "Test control assessment for report generation"
            maturityLevel = "defined"
            complianceScore = Get-Random -Minimum 50 -Maximum 100
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId/controls" -Method POST -Headers $headers -ContentType "application/json" -Body $controlBody | Out-Null
        } catch {
            # Control might already be assessed
        }
    }
    Write-Host "   Added control assessments" -ForegroundColor Green
} else {
    $assessment = $assessments.data[0]
    $assessmentId = $assessment.id
    Write-Host "   Found existing assessment: $($assessment.name) (ID: $assessmentId)" -ForegroundColor Green
}

# Step 3: Generate report
Write-Host "`n[3/6] Generating compliance report..." -ForegroundColor Yellow
$reportBody = @{ assessmentId = $assessmentId } | ConvertTo-Json
$generateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/compliance" -Method POST -Headers $headers -ContentType "application/json" -Body $reportBody
$reportId = $generateResponse.data.id
$fileName = $generateResponse.data.file_name
Write-Host "   Report generated successfully! ID: $reportId, File: $fileName" -ForegroundColor Green

# Step 4: Download report
Write-Host "`n[4/6] Downloading report..." -ForegroundColor Yellow
$downloadPath = "compliance-report-test-$reportId.pdf"
Invoke-WebRequest -Uri "http://localhost:3000/api/reports/compliance/$reportId/download" -Headers $headers -OutFile $downloadPath
$fileInfo = Get-Item $downloadPath
Write-Host "   Downloaded to: $downloadPath ($([math]::Round($fileInfo.Length / 1KB, 2)) KB)" -ForegroundColor Green

# Step 5: Verify PDF
Write-Host "`n[5/6] Verifying PDF..." -ForegroundColor Yellow
$bytes = [System.IO.File]::ReadAllBytes($downloadPath)
$header = [System.Text.Encoding]::ASCII.GetString($bytes[0..4])
if ($header -eq "%PDF-") {
    Write-Host "   Valid PDF file!" -ForegroundColor Green
    if ($bytes.Length -gt 50KB) {
        Write-Host "   File size OK (> 50KB)" -ForegroundColor Green
    } else {
        Write-Host "   Warning: Small file (< 50KB)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Invalid PDF!" -ForegroundColor Red
}

# Step 6: Display report info
Write-Host "`n[6/6] Report Information:" -ForegroundColor Yellow
Write-Host "   Report ID: $reportId" -ForegroundColor Cyan
Write-Host "   File Name: $fileName" -ForegroundColor Cyan
Write-Host "   File Size: $($generateResponse.data.file_size_formatted)" -ForegroundColor Cyan
Write-Host "   Generated At: $($generateResponse.data.generated_at)" -ForegroundColor Cyan
Write-Host "   Assessment: $($assessment.name)" -ForegroundColor Cyan

Write-Host "`n====== Test Complete! ======" -ForegroundColor Cyan
Write-Host "PDF saved to: $downloadPath" -ForegroundColor Green
Write-Host "`nOpen the PDF to verify it contains:" -ForegroundColor White
Write-Host "  - Title page" -ForegroundColor Gray
Write-Host "  - Executive summary with compliance score" -ForegroundColor Gray
Write-Host "  - Detailed assessment results" -ForegroundColor Gray
Write-Host "  - Recommendations section" -ForegroundColor Gray
Write-Host "`n"
