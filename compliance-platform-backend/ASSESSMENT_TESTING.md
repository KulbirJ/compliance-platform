# NIST CSF Compliance Assessment API Testing Guide

## Overview
This guide provides comprehensive examples for testing the NIST CSF compliance assessment APIs.

**Base URL:** `http://localhost:3000/api`

## Table of Contents
1. [Workflow Overview](#workflow-overview)
2. [Authentication Setup](#authentication-setup)
3. [NIST CSF Reference Data](#nist-csf-reference-data)
4. [Assessment Management](#assessment-management)
5. [Control Assessments](#control-assessments)
6. [PowerShell Test Script](#powershell-test-script)

---

## Workflow Overview

### Typical Assessment Process

```
1. User Authentication
   └─> Login to get JWT token

2. View NIST CSF Framework
   └─> GET /api/nist-csf/framework
   └─> Understand functions, categories, controls

3. Create Assessment
   └─> POST /api/assessments
   └─> Set assessment name, type, scope

4. Assess Controls
   └─> For each control in scope:
       ├─> POST /api/assessments/:id/controls
       ├─> Set implementation status
       ├─> Add notes, remediation plans
       └─> Upload evidence (if applicable)

5. Track Progress
   └─> GET /api/assessments/:id/progress
   └─> View completion percentage by function

6. Review and Update
   └─> PUT /api/assessments/:id
   └─> Update status, due dates
   └─> Generate reports
```

---

## Authentication Setup

### Step 1: Login to Get Token

```bash
# cURL
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"

# PowerShell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$token = $loginResponse.data.token
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**Save the token** - You'll need it for authenticated requests.

---

## NIST CSF Reference Data

### 1. Get All Functions

```bash
# cURL
curl -X GET http://localhost:3000/api/nist-csf/functions

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/nist-csf/functions" -Method GET
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "functions": [
      {
        "id": 1,
        "code": "ID",
        "name": "Identify",
        "description": "Develop organizational understanding to manage cybersecurity risk...",
        "categoryCount": 6,
        "controlCount": 23
      },
      {
        "id": 2,
        "code": "PR",
        "name": "Protect",
        "description": "Develop and implement appropriate safeguards...",
        "categoryCount": 6,
        "controlCount": 20
      }
    ]
  }
}
```

### 2. Get Categories by Function

```bash
# cURL - Get categories for Identify function
curl -X GET "http://localhost:3000/api/nist-csf/categories?functionId=1"

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/nist-csf/categories?functionId=1" -Method GET
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 6,
    "functionId": 1,
    "categories": [
      {
        "id": 1,
        "code": "ID.AM",
        "name": "Asset Management",
        "description": "The data, personnel, devices, systems, and facilities...",
        "functionId": 1,
        "functionCode": "ID",
        "functionName": "Identify",
        "controlCount": 6
      }
    ]
  }
}
```

### 3. Get Controls by Category

```bash
# cURL - Get controls for Asset Management category
curl -X GET "http://localhost:3000/api/nist-csf/controls?categoryId=1"

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/nist-csf/controls?categoryId=1" -Method GET
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 6,
    "total": 6,
    "categoryId": 1,
    "controls": [
      {
        "id": 1,
        "code": "ID.AM-1",
        "name": "Physical devices and systems within the organization are inventoried",
        "description": "...",
        "guidance": "...",
        "importance": "high",
        "categoryId": 1,
        "categoryCode": "ID.AM",
        "categoryName": "Asset Management"
      }
    ]
  }
}
```

### 4. Get Complete Framework Hierarchy

```bash
# cURL
curl -X GET http://localhost:3000/api/nist-csf/framework

# PowerShell
$framework = Invoke-RestMethod -Uri "http://localhost:3000/api/nist-csf/framework" -Method GET
$framework.data.framework | ConvertTo-Json -Depth 10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "NIST CSF v1.1",
    "lastUpdated": "2018-04-16",
    "statistics": {
      "totalFunctions": 5,
      "totalCategories": 21,
      "totalControls": 108
    },
    "framework": [
      {
        "id": 1,
        "code": "ID",
        "name": "Identify",
        "description": "...",
        "categories": [
          {
            "id": 1,
            "code": "ID.AM",
            "name": "Asset Management",
            "description": "...",
            "controls": [
              {
                "id": 1,
                "code": "ID.AM-1",
                "name": "Physical devices and systems...",
                "description": "...",
                "guidance": "...",
                "importance": "high"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 5. Search Controls

```bash
# cURL - Search for authentication-related controls
curl -X GET "http://localhost:3000/api/nist-csf/search?q=authentication&page=1&limit=10"

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/nist-csf/search?q=authentication" -Method GET
```

---

## Assessment Management

### 1. Create New Assessment

```bash
# cURL
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "assessmentName": "Q1 2026 Cybersecurity Assessment",
    "assessmentType": "initial",
    "description": "Comprehensive assessment of cybersecurity controls for Q1 2026",
    "scope": "All critical systems and data assets",
    "dueDate": "2026-03-31"
  }'

# PowerShell
$assessmentBody = @{
  assessmentName = "Q1 2026 Cybersecurity Assessment"
  assessmentType = "initial"
  description = "Comprehensive assessment of cybersecurity controls for Q1 2026"
  scope = "All critical systems and data assets"
  dueDate = "2026-03-31"
} | ConvertTo-Json

$assessment = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $assessmentBody

$assessmentId = $assessment.data.id
Write-Host "Created assessment ID: $assessmentId"
```

**Request Body Fields:**
- `assessmentName` (required): Name of the assessment
- `assessmentType` (required): Type - `initial`, `annual`, `continuous`, or `incident_response`
- `description` (optional): Detailed description
- `scope` (optional): Assessment scope
- `dueDate` (optional): Due date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "message": "Assessment created successfully",
  "data": {
    "id": 1,
    "assessmentName": "Q1 2026 Cybersecurity Assessment",
    "assessmentType": "initial",
    "status": "not_started",
    "organizationId": 1,
    "organizationName": "TechCorp Inc",
    "description": "Comprehensive assessment of cybersecurity controls for Q1 2026",
    "scope": "All critical systems and data assets",
    "completionPercentage": 0,
    "dueDate": "2026-03-31T00:00:00.000Z",
    "createdBy": "admin",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Assessments

```bash
# cURL - Get all assessments with optional filters
curl -X GET "http://localhost:3000/api/assessments?status=in_progress&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
$assessments = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments?status=in_progress" `
  -Headers @{ Authorization = "Bearer $token" }
```

**Query Parameters:**
- `status` (optional): Filter by status - `not_started`, `in_progress`, `completed`, `archived`
- `type` (optional): Filter by type - `initial`, `annual`, `continuous`, `incident_response`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "assessments": [
      {
        "id": 1,
        "assessmentName": "Q1 2026 Cybersecurity Assessment",
        "assessmentType": "initial",
        "status": "in_progress",
        "organizationName": "TechCorp Inc",
        "completionPercentage": 45,
        "dueDate": "2026-03-31T00:00:00.000Z",
        "createdBy": "admin",
        "createdAt": "2026-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1,
      "hasMore": false
    }
  }
}
```

### 3. Get Specific Assessment

```bash
# cURL
curl -X GET http://localhost:3000/api/assessments/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
$assessment = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId" `
  -Headers @{ Authorization = "Bearer $token" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "assessmentName": "Q1 2026 Cybersecurity Assessment",
    "assessmentType": "initial",
    "status": "in_progress",
    "organizationId": 1,
    "organizationName": "TechCorp Inc",
    "description": "Comprehensive assessment of cybersecurity controls for Q1 2026",
    "scope": "All critical systems and data assets",
    "completionPercentage": 45,
    "dueDate": "2026-03-31T00:00:00.000Z",
    "startDate": "2026-01-15T10:30:00.000Z",
    "completedDate": null,
    "createdBy": "admin",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T14:22:00.000Z"
  }
}
```

### 4. Get Assessment Progress

```bash
# cURL
curl -X GET http://localhost:3000/api/assessments/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
$progress = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId/progress" `
  -Headers @{ Authorization = "Bearer $token" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": 1,
    "assessmentName": "Q1 2026 Cybersecurity Assessment",
    "overallProgress": {
      "totalControls": 108,
      "assessedControls": 48,
      "completionPercentage": 44.44,
      "status": "in_progress"
    },
    "progressByFunction": [
      {
        "functionCode": "ID",
        "functionName": "Identify",
        "totalControls": 23,
        "assessedControls": 15,
        "completionPercentage": 65.22,
        "notImplemented": 2,
        "partiallyImplemented": 5,
        "largelyImplemented": 4,
        "fullyImplemented": 4,
        "notApplicable": 0
      },
      {
        "functionCode": "PR",
        "functionName": "Protect",
        "totalControls": 20,
        "assessedControls": 12,
        "completionPercentage": 60.00,
        "notImplemented": 3,
        "partiallyImplemented": 4,
        "largelyImplemented": 3,
        "fullyImplemented": 2,
        "notApplicable": 0
      }
    ],
    "implementationSummary": {
      "notImplemented": 8,
      "partiallyImplemented": 18,
      "largelyImplemented": 12,
      "fullyImplemented": 10,
      "notApplicable": 0
    }
  }
}
```

### 5. Update Assessment

```bash
# cURL
curl -X PUT http://localhost:3000/api/assessments/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "in_progress",
    "description": "Updated: Assessment in progress with 45% completion",
    "dueDate": "2026-04-15"
  }'

# PowerShell
$updateBody = @{
  status = "in_progress"
  description = "Updated: Assessment in progress with 45% completion"
  dueDate = "2026-04-15"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId" `
  -Method PUT `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $updateBody
```

**Updatable Fields:**
- `assessmentName`
- `status`: `not_started`, `in_progress`, `completed`, `archived`
- `description`
- `scope`
- `dueDate`
- `startDate`
- `completedDate`

### 6. Delete Assessment

```bash
# cURL
curl -X DELETE http://localhost:3000/api/assessments/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }
```

---

## Control Assessments

### 1. Assess Single Control

```bash
# cURL - Assess control ID.AM-1 as "fully_implemented"
curl -X POST http://localhost:3000/api/assessments/1/controls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "assessmentId": 1,
    "controlId": 1,
    "status": "fully_implemented",
    "questionnaireResponse": "We maintain a comprehensive asset inventory using ServiceNow CMDB. All physical devices are tagged and tracked.",
    "comments": "Asset inventory is updated weekly. Last audit: Jan 10, 2026",
    "remediationPlan": null,
    "maturityLevel": "managed",
    "complianceScore": 95
  }'

# PowerShell
$controlBody = @{
  assessmentId = $assessmentId
  controlId = 1
  status = "fully_implemented"
  questionnaireResponse = "We maintain a comprehensive asset inventory using ServiceNow CMDB. All physical devices are tagged and tracked."
  comments = "Asset inventory is updated weekly. Last audit: Jan 10, 2026"
  maturityLevel = "managed"
  complianceScore = 95
} | ConvertTo-Json

$controlAssessment = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId/controls" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $controlBody
```

**Request Body Fields:**
- `assessmentId` (required): Assessment ID
- `controlId` (required): NIST CSF control ID
- `status` (required): Implementation status
  - `not_implemented`
  - `partially_implemented`
  - `largely_implemented`
  - `fully_implemented`
  - `not_applicable`
- `questionnaireResponse` (optional): Response to control question (max 5000 chars)
- `comments` (optional): Additional notes (max 5000 chars)
- `remediationPlan` (optional): Plan for addressing gaps (max 5000 chars)
- `maturityLevel` (optional): Maturity level
  - `initial`
  - `managed`
  - `defined`
  - `quantitatively_managed`
  - `optimizing`
- `complianceScore` (optional): Score 0-100

**Response:**
```json
{
  "success": true,
  "message": "Control assessment saved successfully",
  "data": {
    "id": 1,
    "assessmentId": 1,
    "control": {
      "id": 1,
      "code": "ID.AM-1",
      "name": "Physical devices and systems within the organization are inventoried",
      "description": "...",
      "importance": "high",
      "category": {
        "code": "ID.AM",
        "name": "Asset Management"
      },
      "function": {
        "code": "ID",
        "name": "Identify"
      }
    },
    "implementationStatus": "fully_implemented",
    "maturityLevel": "managed",
    "complianceScore": 95,
    "notes": "We maintain a comprehensive asset inventory using ServiceNow CMDB...",
    "recommendations": null,
    "assessedBy": {
      "username": "admin",
      "fullName": "System Administrator"
    },
    "assessedAt": "2026-01-15T14:30:00.000Z",
    "createdAt": "2026-01-15T14:30:00.000Z",
    "updatedAt": "2026-01-15T14:30:00.000Z"
  }
}
```

### 2. Get All Control Assessments

```bash
# cURL - Get all control assessments grouped by function
curl -X GET "http://localhost:3000/api/assessments/1/controls?groupBy=function" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
$controls = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId/controls?groupBy=function" `
  -Headers @{ Authorization = "Bearer $token" }
```

**Query Parameters:**
- `status` (optional): Filter by implementation status
- `groupBy` (optional): `function` (default) or `flat`

**Response (grouped by function):**
```json
{
  "success": true,
  "data": {
    "assessmentId": 1,
    "assessmentName": "Q1 2026 Cybersecurity Assessment",
    "totalControls": 15,
    "groupBy": "function",
    "functions": [
      {
        "functionCode": "ID",
        "functionName": "Identify",
        "categories": [
          {
            "categoryCode": "ID.AM",
            "categoryName": "Asset Management",
            "controls": [
              {
                "id": 1,
                "controlId": 1,
                "controlCode": "ID.AM-1",
                "controlName": "Physical devices and systems...",
                "importance": "high",
                "implementationStatus": "fully_implemented",
                "maturityLevel": "managed",
                "complianceScore": 95,
                "assessedBy": "System Administrator",
                "assessedAt": "2026-01-15T14:30:00.000Z"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 3. Get Specific Control Assessment

```bash
# cURL
curl -X GET http://localhost:3000/api/control-assessments/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
$controlDetail = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId/controls/1" `
  -Headers @{ Authorization = "Bearer $token" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "assessmentId": 1,
    "assessmentName": "Q1 2026 Cybersecurity Assessment",
    "control": {
      "id": 1,
      "code": "ID.AM-1",
      "name": "Physical devices and systems within the organization are inventoried",
      "description": "...",
      "guidance": "...",
      "importance": "high",
      "category": {
        "code": "ID.AM",
        "name": "Asset Management",
        "description": "..."
      },
      "function": {
        "code": "ID",
        "name": "Identify",
        "description": "..."
      }
    },
    "implementationStatus": "fully_implemented",
    "maturityLevel": "managed",
    "complianceScore": 95,
    "notes": "We maintain a comprehensive asset inventory...",
    "recommendations": null,
    "assessedBy": {
      "username": "admin",
      "fullName": "System Administrator",
      "email": "admin@example.com"
    },
    "assessedAt": "2026-01-15T14:30:00.000Z",
    "reviewedBy": null,
    "reviewedAt": null,
    "evidence": [],
    "createdAt": "2026-01-15T14:30:00.000Z",
    "updatedAt": "2026-01-15T14:30:00.000Z"
  }
}
```

### 4. Bulk Assess Controls

```bash
# cURL - Assess multiple controls at once
curl -X POST http://localhost:3000/api/assessments/1/controls/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "assessmentId": 1,
    "controls": [
      {
        "controlId": 2,
        "status": "partially_implemented",
        "comments": "Software inventory in progress",
        "maturityLevel": "initial",
        "complianceScore": 40
      },
      {
        "controlId": 3,
        "status": "fully_implemented",
        "comments": "Communication and data flows documented",
        "maturityLevel": "defined",
        "complianceScore": 90
      },
      {
        "controlId": 4,
        "status": "not_implemented",
        "remediationPlan": "Implement external information system inventory by Q2",
        "maturityLevel": "initial",
        "complianceScore": 0
      }
    ]
  }'

# PowerShell
$bulkBody = @{
  assessmentId = $assessmentId
  controls = @(
    @{
      controlId = 2
      status = "partially_implemented"
      comments = "Software inventory in progress"
      maturityLevel = "initial"
      complianceScore = 40
    },
    @{
      controlId = 3
      status = "fully_implemented"
      comments = "Communication and data flows documented"
      maturityLevel = "defined"
      complianceScore = 90
    },
    @{
      controlId = 4
      status = "not_implemented"
      remediationPlan = "Implement external information system inventory by Q2"
      maturityLevel = "initial"
      complianceScore = 0
    }
  )
} | ConvertTo-Json -Depth 5

$bulkResult = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId/controls/bulk" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $bulkBody
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk assessment completed. 3 successful, 0 failed.",
  "data": {
    "assessmentId": 1,
    "totalRequested": 3,
    "successfulCount": 3,
    "failedCount": 0,
    "successful": [
      { "controlId": 2, "controlAssessmentId": 2, "status": "partially_implemented" },
      { "controlId": 3, "controlAssessmentId": 3, "status": "fully_implemented" },
      { "controlId": 4, "controlAssessmentId": 4, "status": "not_implemented" }
    ],
    "failed": []
  }
}
```

---

## PowerShell Test Script

Save this as `test-assessment-workflow.ps1`:

```powershell
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

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Assessment ID $assessmentId created and tested successfully`n" -ForegroundColor Green
```

### Run the Test Script

```powershell
# Make sure server is running first
# In one terminal: npm start

# In another terminal:
.\test-assessment-workflow.ps1
```

---

## Testing Checklist

- [ ] Login and get authentication token
- [ ] View NIST CSF framework structure
- [ ] Create new assessment
- [ ] Assess individual controls
- [ ] Use bulk assessment for multiple controls
- [ ] Check assessment progress
- [ ] Update assessment status
- [ ] View control assessments grouped by function
- [ ] Get specific control details
- [ ] Search for controls by keyword

---

## Common HTTP Status Codes

- **200 OK** - Successful GET/PUT request
- **201 Created** - Successful POST (resource created)
- **400 Bad Request** - Validation error or missing required fields
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User doesn't have permission
- **404 Not Found** - Resource doesn't exist
- **500 Internal Server Error** - Server error

---

## Tips

1. **Always authenticate first** - Most endpoints require a valid JWT token
2. **Check organization access** - Users can only access assessments for their organizations
3. **Use bulk operations** - More efficient for assessing multiple controls
4. **Track progress** - Use the progress endpoint to monitor completion
5. **Group by function** - Use `groupBy=function` to organize controls hierarchically
6. **Set due dates** - Help track assessment timelines
7. **Add detailed notes** - Document findings and remediation plans

---

## Next Steps

After testing the APIs:
1. Build frontend UI components
2. Implement file upload for evidence
3. Add report generation
4. Create dashboard with progress charts
5. Implement notifications for due dates
6. Add collaborative features (comments, reviews)

---

For more information, see the [API Testing Guide](API_TESTING.md).
