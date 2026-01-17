# Report Generation API Testing Guide

## Overview
This guide provides comprehensive examples for testing the Report Generation APIs for both compliance and threat modeling reports.

**Base URL:** `http://localhost:3000/api`

## Table of Contents
1. [Authentication](#authentication)
2. [Compliance Reports](#compliance-reports)
   - [Generate Compliance Report](#1-generate-compliance-report)
   - [Get Compliance Reports](#2-get-compliance-reports)
   - [Download Compliance Report](#3-download-compliance-report)
   - [Delete Compliance Report](#4-delete-compliance-report)
3. [Threat Reports](#threat-reports)
   - [Generate Threat Report](#5-generate-threat-report)
   - [Get Threat Reports](#6-get-threat-reports)
   - [Download Threat Report](#7-download-threat-report)
   - [Delete Threat Report](#8-delete-threat-report)
4. [Verifying PDF Files](#verifying-pdf-files)
5. [Complete Workflow](#complete-workflow)

---

## Authentication

First, login to get your JWT token:

```bash
# cURL
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# PowerShell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$token = $loginResponse.data.token
Write-Host "Token: $token"
```

Save the token - you'll need it for all report operations.

---

## Compliance Reports

### Prerequisites

Before generating compliance reports, you need:
1. An existing assessment (with ID)
2. Control assessments (completed assessments for controls)
3. Optionally: Evidence files attached to control assessments

You can verify your assessment exists:

```powershell
# List all assessments
$assessments = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments" `
  -Headers @{ Authorization = "Bearer $token" }

$assessmentId = $assessments.data[0].id
Write-Host "Using Assessment ID: $assessmentId"
```

---

### 1. Generate Compliance Report

Generate a comprehensive PDF report for an assessment.

#### cURL Example

```bash
# Generate compliance report
curl -X POST http://localhost:3000/api/reports/compliance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": 1
  }'
```

#### PowerShell Example

```powershell
# Generate compliance report
$reportBody = @{
  assessmentId = 1
} | ConvertTo-Json

$complianceReport = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/compliance" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $reportBody

Write-Host "Report Generated!"
Write-Host "Report ID: $($complianceReport.data.id)"
Write-Host "File Name: $($complianceReport.data.file_name)"
Write-Host "File Size: $([math]::Round($complianceReport.data.file_size / 1024, 2)) KB"
Write-Host "Download URL: $($complianceReport.data.download_url)"

# Save report ID for later use
$reportId = $complianceReport.data.id
```

#### Postman Setup

**Request:**
```
Method: POST
URL: {{baseUrl}}/reports/compliance
Authorization: Bearer Token
Headers: Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "assessmentId": 1
}
```

#### Expected Response

```json
{
  "success": true,
  "message": "Compliance report generated successfully",
  "data": {
    "id": 1,
    "assessment_id": 1,
    "report_type": "compliance_report",
    "file_name": "Compliance_Report_Q1_2026_Assessment_1736970123456.pdf",
    "file_size": 245760,
    "report_format": "pdf",
    "generated_at": "2026-01-16T10:30:00.000Z",
    "download_url": "/api/reports/compliance/1/download"
  }
}
```

**Report Generation Time:** Typically 2-5 seconds depending on the number of controls assessed.

**What the PDF Contains:**
1. **Title Page** - Organization name, assessment name, framework version, date
2. **Executive Summary** - Overall compliance score, breakdown by NIST CSF function, key findings
3. **Detailed Results** - All controls grouped by function and category with status indicators
4. **Evidence Summary** - List of all evidence files attached to controls
5. **Recommendations** - Priority-based recommendations for incomplete controls

---

### 2. Get Compliance Reports

Retrieve all reports for a specific assessment.

#### cURL Example

```bash
# Get all compliance reports for assessment
curl -X GET "http://localhost:3000/api/reports/compliance?assessmentId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### PowerShell Example

```powershell
# Get compliance reports for assessment
$reports = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/compliance?assessmentId=1" `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Total Reports: $($reports.data.total_reports)"
Write-Host "`nReports:"
$reports.data.reports | ForEach-Object {
  Write-Host "  - ID: $($_.id) | File: $($_.file_name)"
  Write-Host "    Generated: $($_.generated_at) by $($_.generated_by)"
  Write-Host "    Size: $([math]::Round($_.file_size / 1024, 2)) KB"
  Write-Host ""
}
```

#### Expected Response

```json
{
  "success": true,
  "message": "Compliance reports retrieved successfully",
  "data": {
    "assessment_id": 1,
    "assessment_name": "Q1 2026 Compliance Assessment",
    "total_reports": 2,
    "reports": [
      {
        "id": 2,
        "report_type": "compliance_report",
        "file_name": "Compliance_Report_Q1_2026_Assessment_1736970456789.pdf",
        "file_size": 256000,
        "report_format": "pdf",
        "generated_by": "John Doe",
        "generated_at": "2026-01-16T14:30:00.000Z",
        "download_url": "/api/reports/compliance/2/download"
      },
      {
        "id": 1,
        "report_type": "compliance_report",
        "file_name": "Compliance_Report_Q1_2026_Assessment_1736970123456.pdf",
        "file_size": 245760,
        "report_format": "pdf",
        "generated_by": "Jane Smith",
        "generated_at": "2026-01-16T10:30:00.000Z",
        "download_url": "/api/reports/compliance/1/download"
      }
    ]
  }
}
```

---

### 3. Download Compliance Report

Download the PDF file to your local system.

#### cURL Example

```bash
# Download compliance report PDF
curl -X GET http://localhost:3000/api/reports/compliance/1/download \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o "Compliance_Report.pdf"

# Verify file was created
ls -lh Compliance_Report.pdf
```

#### PowerShell Example

```powershell
# Download compliance report
$reportId = 1
$outputFile = "Compliance_Report_$reportId.pdf"

Invoke-WebRequest -Uri "http://localhost:3000/api/reports/compliance/$reportId/download" `
  -Headers @{ Authorization = "Bearer $token" } `
  -OutFile $outputFile

# Verify file
if (Test-Path $outputFile) {
  $fileInfo = Get-Item $outputFile
  Write-Host "✓ Report downloaded successfully!"
  Write-Host "  File: $outputFile"
  Write-Host "  Size: $([math]::Round($fileInfo.Length / 1024, 2)) KB"
  Write-Host "  Created: $($fileInfo.CreationTime)"
  
  # Open PDF (optional)
  # Start-Process $outputFile
} else {
  Write-Host "✗ Download failed"
}
```

#### Postman Setup

**Request:**
```
Method: GET
URL: {{baseUrl}}/reports/compliance/1/download
Authorization: Bearer Token
```

**To Download in Postman:**
1. Click "Send and Download" button (dropdown next to Send)
2. Choose save location
3. File will be saved with original filename

#### Response Headers

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Compliance_Report_Q1_2026_Assessment_1736970123456.pdf"
Content-Length: 245760
```

The PDF file is streamed directly as binary data.

---

### 4. Delete Compliance Report

Delete a report from the system.

#### cURL Example

```bash
# Delete compliance report
curl -X DELETE http://localhost:3000/api/reports/compliance/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### PowerShell Example

```powershell
# Delete compliance report
$reportId = 1

$deleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/compliance/$reportId" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host $deleteResponse.message
```

#### Expected Response

```json
{
  "success": true,
  "message": "Compliance report deleted successfully"
}
```

**Note:** Only users from the same organization can delete reports. The PDF file is permanently removed from the database.

---

## Threat Reports

### Prerequisites

Before generating threat reports, you need:
1. An existing threat model (with ID)
2. Assets defined in the threat model
3. Threats identified with STRIDE categories
4. Optionally: Mitigations for the threats

Verify your threat model exists:

```powershell
# List all threat models
$threatModels = Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models" `
  -Headers @{ Authorization = "Bearer $token" }

$threatModelId = $threatModels.data.threatModels[0].id
Write-Host "Using Threat Model ID: $threatModelId"
```

---

### 5. Generate Threat Report

Generate a comprehensive STRIDE threat analysis PDF report.

#### cURL Example

```bash
# Generate threat report
curl -X POST http://localhost:3000/api/reports/threat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "threatModelId": 1
  }'
```

#### PowerShell Example

```powershell
# Generate threat report
$reportBody = @{
  threatModelId = 1
} | ConvertTo-Json

$threatReport = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/threat" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $reportBody

Write-Host "Threat Report Generated!"
Write-Host "Report ID: $($threatReport.data.id)"
Write-Host "File Name: $($threatReport.data.file_name)"
Write-Host "File Size: $([math]::Round($threatReport.data.file_size / 1024, 2)) KB"
Write-Host "Download URL: $($threatReport.data.download_url)"

# Save report ID for later use
$threatReportId = $threatReport.data.id
```

#### Postman Setup

**Request:**
```
Method: POST
URL: {{baseUrl}}/reports/threat
Authorization: Bearer Token
Headers: Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "threatModelId": 1
}
```

#### Expected Response

```json
{
  "success": true,
  "message": "Threat report generated successfully",
  "data": {
    "id": 1,
    "threat_model_id": 1,
    "report_type": "threat_analysis_report",
    "file_name": "Threat_Report_E-Commerce_Platform_1736970789012.pdf",
    "file_size": 384000,
    "report_format": "pdf",
    "generated_at": "2026-01-16T11:15:00.000Z",
    "download_url": "/api/reports/threat/1/download"
  }
}
```

**Report Generation Time:** Typically 3-7 seconds depending on the number of threats and mitigations.

**What the PDF Contains:**
1. **Title Page** - Organization name, threat model name, system name, risk score
2. **Executive Summary** - Total threats, risk distribution, mitigation status, STRIDE breakdown
3. **Risk Matrix** - 5×5 Likelihood vs Impact matrix with threats plotted
4. **Detailed Threat Analysis** - All threats grouped by STRIDE category with mitigations
5. **Asset Summary** - All assets with threat counts and criticality
6. **Recommendations** - Priority-based recommendations for high-risk threats

---

### 6. Get Threat Reports

Retrieve all reports for a specific threat model.

#### cURL Example

```bash
# Get all threat reports for threat model
curl -X GET "http://localhost:3000/api/reports/threat?threatModelId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### PowerShell Example

```powershell
# Get threat reports for threat model
$reports = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/threat?threatModelId=1" `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Threat Model: $($reports.data.model_name)"
Write-Host "System: $($reports.data.system_name)"
Write-Host "Total Reports: $($reports.data.total_reports)"
Write-Host "`nReports:"
$reports.data.reports | ForEach-Object {
  Write-Host "  - ID: $($_.id) | File: $($_.file_name)"
  Write-Host "    Generated: $($_.generated_at) by $($_.generated_by)"
  Write-Host "    Size: $([math]::Round($_.file_size / 1024, 2)) KB"
  Write-Host ""
}
```

#### Expected Response

```json
{
  "success": true,
  "message": "Threat reports retrieved successfully",
  "data": {
    "threat_model_id": 1,
    "model_name": "E-Commerce Platform Threat Model",
    "system_name": "Online Shopping System",
    "total_reports": 2,
    "reports": [
      {
        "id": 2,
        "report_type": "threat_analysis_report",
        "file_name": "Threat_Report_E-Commerce_Platform_1736971234567.pdf",
        "file_size": 392000,
        "report_format": "pdf",
        "generated_by": "Security Team",
        "generated_at": "2026-01-16T15:45:00.000Z",
        "download_url": "/api/reports/threat/2/download"
      },
      {
        "id": 1,
        "report_type": "threat_analysis_report",
        "file_name": "Threat_Report_E-Commerce_Platform_1736970789012.pdf",
        "file_size": 384000,
        "report_format": "pdf",
        "generated_by": "John Doe",
        "generated_at": "2026-01-16T11:15:00.000Z",
        "download_url": "/api/reports/threat/1/download"
      }
    ]
  }
}
```

---

### 7. Download Threat Report

Download the threat report PDF file.

#### cURL Example

```bash
# Download threat report PDF
curl -X GET http://localhost:3000/api/reports/threat/1/download \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o "Threat_Report.pdf"

# Verify file
ls -lh Threat_Report.pdf
```

#### PowerShell Example

```powershell
# Download threat report
$reportId = 1
$outputFile = "Threat_Report_$reportId.pdf"

Invoke-WebRequest -Uri "http://localhost:3000/api/reports/threat/$reportId/download" `
  -Headers @{ Authorization = "Bearer $token" } `
  -OutFile $outputFile

# Verify file
if (Test-Path $outputFile) {
  $fileInfo = Get-Item $outputFile
  Write-Host "✓ Threat report downloaded successfully!"
  Write-Host "  File: $outputFile"
  Write-Host "  Size: $([math]::Round($fileInfo.Length / 1024, 2)) KB"
  Write-Host "  Created: $($fileInfo.CreationTime)"
  
  # Open PDF (optional)
  # Start-Process $outputFile
} else {
  Write-Host "✗ Download failed"
}
```

#### Response Headers

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Threat_Report_E-Commerce_Platform_1736970789012.pdf"
Content-Length: 384000
```

---

### 8. Delete Threat Report

Delete a threat report from the system.

#### cURL Example

```bash
# Delete threat report
curl -X DELETE http://localhost:3000/api/reports/threat/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### PowerShell Example

```powershell
# Delete threat report
$reportId = 1

$deleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/threat/$reportId" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host $deleteResponse.message
```

#### Expected Response

```json
{
  "success": true,
  "message": "Threat report deleted successfully"
}
```

---

## Verifying PDF Files

### Manual Verification

After downloading a PDF, verify its contents:

#### For Compliance Reports

**Expected Sections:**
1. ✓ Title page with organization and assessment name
2. ✓ Executive summary with compliance score (percentage)
3. ✓ Compliance by NIST CSF function (5 functions: ID, PR, DE, RS, RC)
4. ✓ Key findings (3-5 bullet points)
5. ✓ Detailed results grouped by function and category
6. ✓ Controls with status badges (green/yellow/red)
7. ✓ Evidence summary (if evidence uploaded)
8. ✓ Recommendations section
9. ✓ Page numbers on every page
10. ✓ Professional blue color scheme

**Visual Checks:**
- Title page has organization name and date
- Executive summary shows overall score as large number
- Progress bars for each NIST function
- Controls are color-coded by status
- Evidence files are listed if attached
- Recommendations have priority levels (High/Medium/Low)

#### For Threat Reports

**Expected Sections:**
1. ✓ Title page with threat model name and risk score
2. ✓ Executive summary with threat counts (Total, Critical, High, Mitigations)
3. ✓ Risk distribution chart (color-coded bar)
4. ✓ Mitigation status overview with coverage percentage
5. ✓ STRIDE category distribution (6 categories: S, T, R, I, D, E)
6. ✓ Risk matrix (5×5 grid) with threats plotted as dots
7. ✓ Detailed threats grouped by STRIDE category
8. ✓ Each threat shows likelihood, impact, risk score, mitigations
9. ✓ Asset summary with threat counts
10. ✓ Recommendations for high-risk threats

**Visual Checks:**
- Title page has risk score in color
- Executive summary has 4 metric boxes
- Risk matrix is 5×5 grid with colored cells
- Threats are grouped under STRIDE category headers (with colors)
- Risk badges are color-coded (Critical=dark red, High=red, Medium=yellow, Low=green)
- Mitigations listed under each threat
- Asset table shows threat counts

### Automated Verification (PowerShell)

```powershell
# Verify downloaded PDF file
function Test-PDFReport {
  param(
    [string]$FilePath
  )
  
  if (-not (Test-Path $FilePath)) {
    Write-Host "✗ File not found: $FilePath" -ForegroundColor Red
    return $false
  }
  
  $fileInfo = Get-Item $FilePath
  
  # Check file size (should be at least 50KB for valid report)
  if ($fileInfo.Length -lt 51200) {
    Write-Host "✗ File too small ($($fileInfo.Length) bytes) - may be corrupted" -ForegroundColor Red
    return $false
  }
  
  # Check PDF header
  $bytes = [System.IO.File]::ReadAllBytes($FilePath)
  $header = [System.Text.Encoding]::ASCII.GetString($bytes[0..4])
  
  if ($header -ne "%PDF-") {
    Write-Host "✗ Invalid PDF header" -ForegroundColor Red
    return $false
  }
  
  Write-Host "✓ PDF file is valid" -ForegroundColor Green
  Write-Host "  Size: $([math]::Round($fileInfo.Length / 1024, 2)) KB"
  Write-Host "  Created: $($fileInfo.CreationTime)"
  
  return $true
}

# Test compliance report
Test-PDFReport -FilePath "Compliance_Report_1.pdf"

# Test threat report
Test-PDFReport -FilePath "Threat_Report_1.pdf"
```

### PDF Content Verification

Open the PDF and verify:

**Compliance Report Checklist:**
- [ ] Title page displays correctly
- [ ] Overall compliance score is calculated (0-100%)
- [ ] All 5 NIST CSF functions shown
- [ ] Progress bars show correct percentages
- [ ] Controls are listed with correct status colors
- [ ] Evidence count matches uploaded files
- [ ] Recommendations are relevant to incomplete controls
- [ ] Page numbers increment correctly
- [ ] No missing images or broken formatting

**Threat Report Checklist:**
- [ ] Title page shows threat model name and risk score
- [ ] Executive summary shows correct threat counts
- [ ] Risk distribution bar shows all threats
- [ ] STRIDE categories (S, T, R, I, D, E) all present
- [ ] Risk matrix is 5×5 with threats plotted
- [ ] Threats grouped by STRIDE category
- [ ] Risk scores calculated correctly (Likelihood × Impact)
- [ ] Mitigations listed for each threat
- [ ] Asset table shows all assets
- [ ] Recommendations address high-risk threats

---

## Complete Workflow

### End-to-End Compliance Report Testing

```powershell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLIANCE REPORT GENERATION TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Login
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$token = $loginResponse.data.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "   ✓ Logged in successfully" -ForegroundColor Green

# 2. Get assessments
Write-Host "`n2. Getting assessments..." -ForegroundColor Yellow
$assessments = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments" -Headers $headers
$assessmentId = $assessments.data[0].id
Write-Host "   ✓ Found assessment: $($assessments.data[0].assessment_name) (ID: $assessmentId)" -ForegroundColor Green

# 3. Generate compliance report
Write-Host "`n3. Generating compliance report..." -ForegroundColor Yellow
$reportBody = @{ assessmentId = $assessmentId } | ConvertTo-Json
$report = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/compliance" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $reportBody

Write-Host "   ✓ Report generated!" -ForegroundColor Green
Write-Host "     Report ID: $($report.data.id)"
Write-Host "     File: $($report.data.file_name)"
Write-Host "     Size: $([math]::Round($report.data.file_size / 1024, 2)) KB"

$reportId = $report.data.id

# 4. Get report list
Write-Host "`n4. Getting report list..." -ForegroundColor Yellow
$reports = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/compliance?assessmentId=$assessmentId" `
  -Headers $headers
Write-Host "   ✓ Found $($reports.data.total_reports) report(s)" -ForegroundColor Green

# 5. Download report
Write-Host "`n5. Downloading report..." -ForegroundColor Yellow
$outputFile = "Compliance_Report_Test.pdf"
Invoke-WebRequest -Uri "http://localhost:3000/api/reports/compliance/$reportId/download" `
  -Headers $headers `
  -OutFile $outputFile

if (Test-Path $outputFile) {
  $fileInfo = Get-Item $outputFile
  Write-Host "   ✓ Downloaded: $outputFile ($([math]::Round($fileInfo.Length / 1024, 2)) KB)" -ForegroundColor Green
  
  # Verify PDF
  $bytes = [System.IO.File]::ReadAllBytes($outputFile)
  $header = [System.Text.Encoding]::ASCII.GetString($bytes[0..4])
  if ($header -eq "%PDF-") {
    Write-Host "   ✓ PDF file is valid" -ForegroundColor Green
  }
}

# 6. Get report metadata
Write-Host "`n6. Getting report metadata..." -ForegroundColor Yellow
$metadata = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/compliance/$reportId" `
  -Headers $headers
Write-Host "   ✓ Report metadata retrieved" -ForegroundColor Green
Write-Host "     Generated by: $($metadata.data.generated_by)"
Write-Host "     Generated at: $($metadata.data.generated_at)"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nManual verification steps:"
Write-Host "1. Open $outputFile in a PDF reader"
Write-Host "2. Verify title page has correct assessment name"
Write-Host "3. Check executive summary shows compliance score"
Write-Host "4. Verify all NIST CSF functions are present"
Write-Host "5. Check detailed results show controls with status"
```

### End-to-End Threat Report Testing

```powershell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "THREAT REPORT GENERATION TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Login
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$token = $loginResponse.data.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "   ✓ Logged in successfully" -ForegroundColor Green

# 2. Get threat models
Write-Host "`n2. Getting threat models..." -ForegroundColor Yellow
$threatModels = Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models" -Headers $headers
$threatModelId = $threatModels.data.threatModels[0].id
Write-Host "   ✓ Found threat model: $($threatModels.data.threatModels[0].model_name) (ID: $threatModelId)" -ForegroundColor Green

# 3. Generate threat report
Write-Host "`n3. Generating threat report..." -ForegroundColor Yellow
$reportBody = @{ threatModelId = $threatModelId } | ConvertTo-Json
$report = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/threat" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $reportBody

Write-Host "   ✓ Report generated!" -ForegroundColor Green
Write-Host "     Report ID: $($report.data.id)"
Write-Host "     File: $($report.data.file_name)"
Write-Host "     Size: $([math]::Round($report.data.file_size / 1024, 2)) KB"

$reportId = $report.data.id

# 4. Get report list
Write-Host "`n4. Getting report list..." -ForegroundColor Yellow
$reports = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/threat?threatModelId=$threatModelId" `
  -Headers $headers
Write-Host "   ✓ Found $($reports.data.total_reports) report(s)" -ForegroundColor Green

# 5. Download report
Write-Host "`n5. Downloading report..." -ForegroundColor Yellow
$outputFile = "Threat_Report_Test.pdf"
Invoke-WebRequest -Uri "http://localhost:3000/api/reports/threat/$reportId/download" `
  -Headers $headers `
  -OutFile $outputFile

if (Test-Path $outputFile) {
  $fileInfo = Get-Item $outputFile
  Write-Host "   ✓ Downloaded: $outputFile ($([math]::Round($fileInfo.Length / 1024, 2)) KB)" -ForegroundColor Green
  
  # Verify PDF
  $bytes = [System.IO.File]::ReadAllBytes($outputFile)
  $header = [System.Text.Encoding]::ASCII.GetString($bytes[0..4])
  if ($header -eq "%PDF-") {
    Write-Host "   ✓ PDF file is valid" -ForegroundColor Green
  }
}

# 6. Get report statistics
Write-Host "`n6. Getting report statistics..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/threat/stats" `
  -Headers $headers
Write-Host "   ✓ Statistics retrieved" -ForegroundColor Green
Write-Host "     Total reports: $($stats.data.total_reports)"
Write-Host "     Storage used: $($stats.data.total_storage_mb) MB"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nManual verification steps:"
Write-Host "1. Open $outputFile in a PDF reader"
Write-Host "2. Verify title page has threat model name and risk score"
Write-Host "3. Check executive summary shows threat counts"
Write-Host "4. Verify risk matrix (5x5 grid) is present"
Write-Host "5. Check threats are grouped by STRIDE categories"
Write-Host "6. Verify asset summary is complete"
```

---

## Additional Report Endpoints

### Get Organization Report Statistics

#### Compliance Report Statistics

```powershell
# Get compliance report statistics
$stats = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/compliance/stats" `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Compliance Report Statistics:"
Write-Host "  Total Reports: $($stats.data.total_reports)"
Write-Host "  Assessments with Reports: $($stats.data.assessments_with_reports)"
Write-Host "  Storage Used: $($stats.data.total_storage_mb) MB"
Write-Host "  Reports (Last 30 Days): $($stats.data.reports_last_30_days)"
```

#### Threat Report Statistics

```powershell
# Get threat report statistics
$stats = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/threat/stats" `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Threat Report Statistics:"
Write-Host "  Total Reports: $($stats.data.total_reports)"
Write-Host "  Threat Models with Reports: $($stats.data.threat_models_with_reports)"
Write-Host "  Storage Used: $($stats.data.total_storage_mb) MB"
Write-Host "  Reports (Last 30 Days): $($stats.data.reports_last_30_days)"
Write-Host "  Threat Analysis Reports: $($stats.data.threat_analysis_reports)"
```

### Get All Organization Reports

#### All Compliance Reports

```powershell
# Get all compliance reports with pagination
$allReports = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/compliance/organization/all?page=1&limit=20" `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Organization Compliance Reports:"
Write-Host "  Total: $($allReports.data.pagination.total)"
Write-Host "  Page: $($allReports.data.pagination.page) of $($allReports.data.pagination.totalPages)"
```

#### All Threat Reports

```powershell
# Get all threat reports with pagination
$allReports = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/threat/organization/all?page=1&limit=20" `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Organization Threat Reports:"
Write-Host "  Total: $($allReports.data.pagination.total)"
Write-Host "  Page: $($allReports.data.pagination.page) of $($allReports.data.pagination.totalPages)"
```

---

## Error Handling

### Common Errors

**1. Assessment Not Found**
```json
{
  "success": false,
  "message": "Assessment not found"
}
```

**2. No Control Assessments**
```json
{
  "success": false,
  "message": "Cannot generate report: No control assessments found for this assessment"
}
```

**3. Threat Model Not Found**
```json
{
  "success": false,
  "message": "Threat model not found"
}
```

**4. No Threats Found**
```json
{
  "success": false,
  "message": "Cannot generate report: No threats found for this threat model"
}
```

**5. Access Denied**
```json
{
  "success": false,
  "message": "Access denied to this assessment"
}
```

**6. Report Not Found**
```json
{
  "success": false,
  "message": "Report not found or access denied"
}
```

---

## Testing Checklist

### Compliance Reports
- [ ] Generate report for assessment with control assessments
- [ ] Verify report contains title page
- [ ] Check executive summary has compliance score
- [ ] Verify all NIST CSF functions present
- [ ] Download and open PDF file
- [ ] Verify PDF is properly formatted
- [ ] Check evidence summary (if evidence uploaded)
- [ ] Verify recommendations section
- [ ] List all reports for assessment
- [ ] Delete report
- [ ] Test error: Generate report for non-existent assessment
- [ ] Test error: Generate report without control assessments

### Threat Reports
- [ ] Generate report for threat model with threats
- [ ] Verify report contains title page with risk score
- [ ] Check executive summary has threat counts
- [ ] Verify risk matrix is present
- [ ] Check STRIDE categories (all 6)
- [ ] Download and open PDF file
- [ ] Verify threats grouped by STRIDE
- [ ] Check asset summary
- [ ] Verify recommendations for high-risk threats
- [ ] List all reports for threat model
- [ ] Delete report
- [ ] Test error: Generate report for non-existent threat model
- [ ] Test error: Generate report without threats

---

## Tips & Best Practices

1. **Report Generation:**
   - Ensure data is complete before generating reports
   - Reports are generated asynchronously - may take 2-7 seconds
   - Reports are stored as BYTEA in PostgreSQL

2. **File Sizes:**
   - Compliance reports: ~200-500 KB depending on control count
   - Threat reports: ~300-600 KB depending on threat count
   - Monitor storage with statistics endpoints

3. **PDF Verification:**
   - Always verify PDF opens correctly after download
   - Check file size is reasonable (>50 KB)
   - Verify PDF header (%PDF-) for corruption

4. **Performance:**
   - Generate reports during off-peak hours for large datasets
   - Cache reports - don't regenerate unnecessarily
   - Use pagination when listing many reports

5. **Storage Management:**
   - Delete old reports to free up space
   - Keep latest report for each assessment/threat model
   - Archive reports externally if needed

---

## Next Steps

After testing report generation:
1. Integrate with frontend for one-click report generation
2. Add scheduled report generation (daily/weekly)
3. Implement email delivery for reports
4. Add report versioning/history
5. Create executive summary dashboard
6. Add custom report templates
7. Implement bulk report generation

---

For more information, see:
- [ASSESSMENT_TESTING.md](ASSESSMENT_TESTING.md) - Assessment APIs
- [EVIDENCE_TESTING.md](EVIDENCE_TESTING.md) - Evidence Management
- [THREAT_MODELING_TESTING.md](THREAT_MODELING_TESTING.md) - Threat Modeling APIs
