# Threat Modeling (STRIDE) API Testing Guide

## Overview
This guide demonstrates how to test the STRIDE threat modeling APIs, including:
- Creating threat models
- Managing reusable assets (DFD elements)
- Identifying threats using STRIDE categories
- Creating mitigation plans
- Tracking risk scores and statistics

## Workflow
```
1. Get STRIDE Categories (reference data)
2. Create Threat Model → Container for all threat analysis
3. Create Assets → Reusable DFD elements (web server, database, etc.)
4. Link Assets to Threat Model → Associate assets with specific model
5. Create Threats → Identify threats for assets with STRIDE categories
6. Get Threats → View threats grouped by STRIDE category
7. Get High-Risk Threats → Filter by risk score
8. Create Mitigations → Plan remediation for threats
9. Update Mitigation Status → Track implementation progress
10. Get Statistics → View comprehensive threat model metrics
```

## Prerequisites
- Server running on http://localhost:3000
- Valid authentication token (from login)
- Database initialized with STRIDE categories seed data

## Authentication
First, log in to get an access token:

```powershell
# Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        email = "admin@example.com"
        password = "admin123"
    } | ConvertTo-Json)

$token = $loginResponse.data.token
Write-Host "Token: $token"

# Set headers for authenticated requests
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
```

---

## 1. Get STRIDE Categories (Reference Data)

**Endpoint:** `GET /api/stride/categories`

**Description:** Retrieve all 6 STRIDE threat categories (public endpoint - no auth required)

```powershell
$strideResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/stride/categories" `
    -Method GET

Write-Host "`nSTRIDE Categories:" -ForegroundColor Cyan
$strideResponse.data.categories | Format-Table -Property id, category_code, category_name

# Save category IDs for later use
$strideCategories = $strideResponse.data.categories
```

**Expected Response:**
```json
{
  "success": true,
  "message": "STRIDE categories retrieved successfully",
  "data": {
    "totalCategories": 6,
    "categories": [
      {
        "id": 1,
        "category_code": "S",
        "category_name": "Spoofing",
        "description": "Pretending to be something or someone other than yourself",
        "display_order": 1,
        "created_at": "2026-01-15T10:00:00.000Z"
      },
      {
        "id": 2,
        "category_code": "T",
        "category_name": "Tampering",
        "description": "Modifying data or code",
        "display_order": 2,
        "created_at": "2026-01-15T10:00:00.000Z"
      }
      // ... 4 more categories (R, I, D, E)
    ]
  }
}
```

**STRIDE Categories:**
- **S** - Spoofing: Pretending to be something or someone else
- **T** - Tampering: Modifying data or code
- **R** - Repudiation: Claiming not to have performed an action
- **I** - Information Disclosure: Exposing information to unauthorized parties
- **D** - Denial of Service: Denying or degrading service to users
- **E** - Elevation of Privilege: Gaining unauthorized capabilities

---

## 2. Create Threat Model

**Endpoint:** `POST /api/threat-models`

**Description:** Create a container for threat analysis

```powershell
$threatModelBody = @{
    modelName = "E-Commerce Platform Threat Model"
    systemName = "Online Shopping System"
    description = "Comprehensive threat analysis for our e-commerce platform including web server, database, and payment processing"
    scope = "Web application, API gateway, database, payment integration, user authentication"
    modelVersion = "1.0"
    assessmentDate = (Get-Date).ToString("yyyy-MM-dd")
} | ConvertTo-Json

$threatModelResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models" `
    -Method POST `
    -Headers $headers `
    -Body $threatModelBody

$threatModelId = $threatModelResponse.data.id
Write-Host "`nThreat Model Created - ID: $threatModelId" -ForegroundColor Green
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Threat model created successfully",
  "data": {
    "id": 1,
    "organization_id": 1,
    "created_by": 1,
    "model_name": "E-Commerce Platform Threat Model",
    "model_version": "1.0",
    "system_name": "Online Shopping System",
    "description": "Comprehensive threat analysis...",
    "scope": "Web application, API gateway...",
    "status": "draft",
    "risk_score": null,
    "created_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-01-15T10:30:00.000Z"
  }
}
```

---

## 3. Create Reusable Assets (DFD Elements)

**Endpoint:** `POST /api/assets`

**Description:** Create reusable assets that can be used across multiple threat models

**Asset Types:**
- `data_store` - Databases, file systems, caches
- `process` - Web servers, API services, microservices
- `external_entity` - Users, third-party services, external systems
- `data_flow` - Network connections, API calls, data transfers
- `trust_boundary` - Network boundaries, authentication boundaries

**Criticality Levels:** `low`, `medium`, `high`, `critical`

```powershell
# Asset 1: Web Server
$asset1Body = @{
    assetName = "Web Application Server"
    assetType = "process"
    description = "Apache/Nginx web server hosting the e-commerce frontend"
    criticality = "high"
} | ConvertTo-Json

$asset1Response = Invoke-RestMethod -Uri "http://localhost:3000/api/assets" `
    -Method POST `
    -Headers $headers `
    -Body $asset1Body

$asset1Id = $asset1Response.data.id
Write-Host "Asset 1 Created: Web Server (ID: $asset1Id)" -ForegroundColor Green

# Asset 2: Database
$asset2Body = @{
    assetName = "PostgreSQL Database"
    assetType = "data_store"
    description = "Primary database storing customer data, orders, and product information"
    criticality = "critical"
} | ConvertTo-Json

$asset2Response = Invoke-RestMethod -Uri "http://localhost:3000/api/assets" `
    -Method POST `
    -Headers $headers `
    -Body $asset2Body

$asset2Id = $asset2Response.data.id
Write-Host "Asset 2 Created: Database (ID: $asset2Id)" -ForegroundColor Green

# Asset 3: User Authentication Service
$asset3Body = @{
    assetName = "User Authentication Service"
    assetType = "process"
    description = "JWT-based authentication service handling user login and session management"
    criticality = "critical"
} | ConvertTo-Json

$asset3Response = Invoke-RestMethod -Uri "http://localhost:3000/api/assets" `
    -Method POST `
    -Headers $headers `
    -Body $asset3Body

$asset3Id = $asset3Response.data.id
Write-Host "Asset 3 Created: Auth Service (ID: $asset3Id)" -ForegroundColor Green

# Asset 4: Payment Gateway
$asset4Body = @{
    assetName = "Payment Processing Gateway"
    assetType = "external_entity"
    description = "Third-party payment processor (Stripe/PayPal)"
    criticality = "critical"
} | ConvertTo-Json

$asset4Response = Invoke-RestMethod -Uri "http://localhost:3000/api/assets" `
    -Method POST `
    -Headers $headers `
    -Body $asset4Body

$asset4Id = $asset4Response.data.id
Write-Host "Asset 4 Created: Payment Gateway (ID: $asset4Id)" -ForegroundColor Green
```

**Expected Response (example for Asset 1):**
```json
{
  "success": true,
  "message": "Asset created successfully",
  "data": {
    "id": 1,
    "organization_id": 1,
    "owner": 1,
    "asset_name": "Web Application Server",
    "asset_type": "process",
    "description": "Apache/Nginx web server hosting the e-commerce frontend",
    "criticality": "high",
    "created_at": "2026-01-15T10:35:00.000Z",
    "updated_at": "2026-01-15T10:35:00.000Z"
  }
}
```

---

## 4. Link Assets to Threat Model

**Endpoint:** `POST /api/threat-models/:id/assets`

**Description:** Associate assets with the threat model

```powershell
# Link Asset 1: Web Server
$linkAsset1 = @{
    assetId = $asset1Id
    notes = "Primary web server for customer-facing application"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models/$threatModelId/assets" `
    -Method POST `
    -Headers $headers `
    -Body $linkAsset1 | Out-Null

Write-Host "Linked Web Server to Threat Model" -ForegroundColor Green

# Link Asset 2: Database
$linkAsset2 = @{
    assetId = $asset2Id
    notes = "Stores all critical business data"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models/$threatModelId/assets" `
    -Method POST `
    -Headers $headers `
    -Body $linkAsset2 | Out-Null

Write-Host "Linked Database to Threat Model" -ForegroundColor Green

# Link Asset 3: Auth Service
$linkAsset3 = @{
    assetId = $asset3Id
    notes = "Handles all authentication and authorization"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models/$threatModelId/assets" `
    -Method POST `
    -Headers $headers `
    -Body $linkAsset3 | Out-Null

Write-Host "Linked Auth Service to Threat Model" -ForegroundColor Green

# Link Asset 4: Payment Gateway
$linkAsset4 = @{
    assetId = $asset4Id
    notes = "External payment processing"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models/$threatModelId/assets" `
    -Method POST `
    -Headers $headers `
    -Body $linkAsset4 | Out-Null

Write-Host "Linked Payment Gateway to Threat Model" -ForegroundColor Green

# Verify linked assets
$linkedAssets = Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models/$threatModelId/assets" `
    -Method GET `
    -Headers $headers

Write-Host "`nLinked Assets ($($linkedAssets.data.Count)):" -ForegroundColor Cyan
$linkedAssets.data | Format-Table -Property asset_name, asset_type, criticality, total_threats
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Asset linked to threat model successfully",
  "data": {
    "threat_model_id": 1,
    "asset_id": 1,
    "linked_at": "2026-01-15T10:40:00.000Z",
    "notes": "Primary web server for customer-facing application"
  }
}
```

---

## 5. Create Threats Using STRIDE Categories

**Endpoint:** `POST /api/threats`

**Description:** Identify threats for assets using STRIDE framework

**Likelihood/Impact Values:** `very_low`, `low`, `medium`, `high`, `very_high` (mapped to 1-5)

**Risk Calculation:** Risk Score = Likelihood × Impact (1-25 scale)
- **Critical:** 20-25 (very_high × very_high)
- **High:** 12-19 (high × high or higher)
- **Medium:** 6-11 (medium × medium)
- **Low:** 1-5 (low × low or lower)

```powershell
# Threat 1: SQL Injection (Tampering - T)
$threat1Body = @{
    threatModelId = $threatModelId
    assetId = $asset2Id  # Database
    strideCategoryId = 2  # Tampering
    threatTitle = "SQL Injection Attack"
    threatDescription = "Attacker injects malicious SQL code through user input fields to manipulate or extract database data"
    impactDescription = "Could lead to data breach, data corruption, or unauthorized access to sensitive customer information"
    likelihood = "high"      # 4
    impact = "very_high"     # 5
    # Risk Score = 4 × 5 = 20 (CRITICAL)
} | ConvertTo-Json

$threat1Response = Invoke-RestMethod -Uri "http://localhost:3000/api/threats" `
    -Method POST `
    -Headers $headers `
    -Body $threat1Body

Write-Host "Threat 1 Created: SQL Injection (Risk Score: $($threat1Response.data.risk_score) - $($threat1Response.data.risk_level))" -ForegroundColor Red

# Threat 2: Credential Stuffing (Spoofing - S)
$threat2Body = @{
    threatModelId = $threatModelId
    assetId = $asset3Id  # Auth Service
    strideCategoryId = 1  # Spoofing
    threatTitle = "Credential Stuffing Attack"
    threatDescription = "Attacker uses stolen username/password combinations from other breaches to gain unauthorized access"
    impactDescription = "Unauthorized account access, data theft, fraudulent transactions"
    likelihood = "high"      # 4
    impact = "high"          # 4
    # Risk Score = 4 × 4 = 16 (HIGH)
} | ConvertTo-Json

$threat2Response = Invoke-RestMethod -Uri "http://localhost:3000/api/threats" `
    -Method POST `
    -Headers $headers `
    -Body $threat2Body

Write-Host "Threat 2 Created: Credential Stuffing (Risk Score: $($threat2Response.data.risk_score) - $($threat2Response.data.risk_level))" -ForegroundColor Red

# Threat 3: DDoS Attack (Denial of Service - D)
$threat3Body = @{
    threatModelId = $threatModelId
    assetId = $asset1Id  # Web Server
    strideCategoryId = 5  # Denial of Service
    threatTitle = "Distributed Denial of Service (DDoS)"
    threatDescription = "Attacker floods web server with traffic to make it unavailable to legitimate users"
    impactDescription = "Service downtime, lost revenue, customer dissatisfaction"
    likelihood = "medium"    # 3
    impact = "high"          # 4
    # Risk Score = 3 × 4 = 12 (HIGH)
} | ConvertTo-Json

$threat3Response = Invoke-RestMethod -Uri "http://localhost:3000/api/threats" `
    -Method POST `
    -Headers $headers `
    -Body $threat3Body

Write-Host "Threat 3 Created: DDoS Attack (Risk Score: $($threat3Response.data.risk_score) - $($threat3Response.data.risk_level))" -ForegroundColor Yellow

# Threat 4: Session Token Theft (Information Disclosure - I)
$threat4Body = @{
    threatModelId = $threatModelId
    assetId = $asset3Id  # Auth Service
    strideCategoryId = 4  # Information Disclosure
    threatTitle = "Session Token Interception"
    threatDescription = "Attacker intercepts JWT tokens through man-in-the-middle attack or XSS"
    impactDescription = "Session hijacking, unauthorized access to user accounts"
    likelihood = "medium"    # 3
    impact = "high"          # 4
    # Risk Score = 3 × 4 = 12 (HIGH)
} | ConvertTo-Json

$threat4Response = Invoke-RestMethod -Uri "http://localhost:3000/api/threats" `
    -Method POST `
    -Headers $headers `
    -Body $threat4Body

Write-Host "Threat 4 Created: Session Token Theft (Risk Score: $($threat4Response.data.risk_score) - $($threat4Response.data.risk_level))" -ForegroundColor Yellow

# Threat 5: Payment Data Tampering (Tampering - T)
$threat5Body = @{
    threatModelId = $threatModelId
    assetId = $asset4Id  # Payment Gateway
    strideCategoryId = 2  # Tampering
    threatTitle = "Payment Amount Manipulation"
    threatDescription = "Attacker modifies payment amount during transaction processing"
    impactDescription = "Financial loss, fraudulent transactions"
    likelihood = "low"       # 2
    impact = "very_high"     # 5
    # Risk Score = 2 × 5 = 10 (MEDIUM)
} | ConvertTo-Json

$threat5Response = Invoke-RestMethod -Uri "http://localhost:3000/api/threats" `
    -Method POST `
    -Headers $headers `
    -Body $threat5Body

Write-Host "Threat 5 Created: Payment Tampering (Risk Score: $($threat5Response.data.risk_score) - $($threat5Response.data.risk_level))" -ForegroundColor Yellow

# Threat 6: Privilege Escalation (Elevation of Privilege - E)
$threat6Body = @{
    threatModelId = $threatModelId
    assetId = $asset3Id  # Auth Service
    strideCategoryId = 6  # Elevation of Privilege
    threatTitle = "Horizontal Privilege Escalation"
    threatDescription = "Regular user exploits vulnerability to gain admin privileges"
    impactDescription = "Unauthorized access to admin functions, data manipulation"
    likelihood = "low"       # 2
    impact = "very_high"     # 5
    # Risk Score = 2 × 5 = 10 (MEDIUM)
} | ConvertTo-Json

$threat6Response = Invoke-RestMethod -Uri "http://localhost:3000/api/threats" `
    -Method POST `
    -Headers $headers `
    -Body $threat6Body

Write-Host "Threat 6 Created: Privilege Escalation (Risk Score: $($threat6Response.data.risk_score) - $($threat6Response.data.risk_level))" -ForegroundColor Yellow

# Save threat IDs
$threat1Id = $threat1Response.data.id
$threat2Id = $threat2Response.data.id
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Threat created successfully",
  "data": {
    "id": 1,
    "threat_model_id": 1,
    "asset_id": 2,
    "stride_category_id": 2,
    "threat_title": "SQL Injection Attack",
    "threat_description": "Attacker injects malicious SQL code...",
    "impact_description": "Could lead to data breach...",
    "likelihood": "high",
    "impact": "very_high",
    "risk_score": 20,
    "risk_level": "critical",
    "status": "identified",
    "identified_by": 1,
    "identified_at": "2026-01-15T10:45:00.000Z",
    "created_at": "2026-01-15T10:45:00.000Z",
    "updated_at": "2026-01-15T10:45:00.000Z"
  }
}
```

---

## 6. Get All Threats (Grouped by STRIDE Category)

**Endpoint:** `GET /api/threat-models/:threatModelId/threats`

**Description:** Retrieve all threats for a threat model, organized by STRIDE category

```powershell
$threatsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models/$threatModelId/threats" `
    -Method GET `
    -Headers $headers

Write-Host "`nThreats Grouped by STRIDE Category:" -ForegroundColor Cyan
Write-Host "Total Threats: $($threatsResponse.data.totalThreats)`n"

foreach ($category in $threatsResponse.data.groupedByStride) {
    Write-Host "[$($category.category_code)] $($category.category_name) - $($category.threats.Count) threats" -ForegroundColor Magenta
    foreach ($threat in $category.threats) {
        $color = switch ($threat.risk_level) {
            "critical" { "Red" }
            "high" { "Yellow" }
            "medium" { "Cyan" }
            default { "Gray" }
        }
        Write-Host "  - $($threat.threat_title) [Risk: $($threat.risk_score) - $($threat.risk_level)]" -ForegroundColor $color
        Write-Host "    Asset: $($threat.asset_name)" -ForegroundColor Gray
    }
    Write-Host ""
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Threats retrieved successfully",
  "data": {
    "threatModelId": 1,
    "totalThreats": 6,
    "groupedByStride": [
      {
        "category_code": "S",
        "category_name": "Spoofing",
        "category_description": "Pretending to be something or someone other than yourself",
        "threats": [
          {
            "id": 2,
            "threat_title": "Credential Stuffing Attack",
            "threat_description": "Attacker uses stolen username/password...",
            "likelihood": "high",
            "impact": "high",
            "risk_score": 16,
            "risk_level": "high",
            "status": "identified",
            "asset_name": "User Authentication Service",
            "asset_type": "process",
            "stride_category_code": "S",
            "stride_category_name": "Spoofing",
            "mitigation_count": 0
          }
        ]
      },
      {
        "category_code": "T",
        "category_name": "Tampering",
        "category_description": "Modifying data or code",
        "threats": [
          {
            "id": 1,
            "threat_title": "SQL Injection Attack",
            "risk_score": 20,
            "risk_level": "critical",
            "asset_name": "PostgreSQL Database"
          },
          {
            "id": 5,
            "threat_title": "Payment Amount Manipulation",
            "risk_score": 10,
            "risk_level": "medium",
            "asset_name": "Payment Processing Gateway"
          }
        ]
      }
      // ... more STRIDE categories
    ]
  }
}
```

---

## 7. Get High-Risk Threats

**Endpoint:** `GET /api/threat-models/:threatModelId/threats/high-risk`

**Description:** Filter threats with risk score >= 15 (critical and high-risk threats)

```powershell
$highRiskResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models/$threatModelId/threats/high-risk?minRiskScore=15" `
    -Method GET `
    -Headers $headers

Write-Host "`nHigh-Risk Threats (Risk Score >= 15):" -ForegroundColor Red
Write-Host "Total: $($highRiskResponse.data.totalHighRiskThreats)`n"

foreach ($threat in $highRiskResponse.data.threats) {
    Write-Host "- $($threat.threat_title)" -ForegroundColor Red
    Write-Host "  Risk Score: $($threat.risk_score) ($($threat.risk_level))" -ForegroundColor Yellow
    Write-Host "  Asset: $($threat.asset_name)" -ForegroundColor Gray
    Write-Host "  STRIDE: [$($threat.stride_category_code)] $($threat.stride_category_name)`n" -ForegroundColor Magenta
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "High-risk threats retrieved successfully",
  "data": {
    "threatModelId": 1,
    "minRiskScore": 15,
    "totalHighRiskThreats": 2,
    "threats": [
      {
        "id": 1,
        "threat_title": "SQL Injection Attack",
        "threat_description": "Attacker injects malicious SQL code...",
        "likelihood": "high",
        "impact": "very_high",
        "risk_score": 20,
        "risk_level": "critical",
        "status": "identified",
        "asset_name": "PostgreSQL Database",
        "asset_type": "data_store",
        "stride_category_code": "T",
        "stride_category_name": "Tampering"
      },
      {
        "id": 2,
        "threat_title": "Credential Stuffing Attack",
        "risk_score": 16,
        "risk_level": "high",
        "asset_name": "User Authentication Service"
      }
    ]
  }
}
```

---

## 8. Create Mitigation Plans

**Endpoint:** `POST /api/mitigations`

**Description:** Create remediation plans for identified threats

**Mitigation Strategies:**
- `eliminate` - Remove the threat entirely
- `reduce` - Reduce likelihood or impact
- `transfer` - Transfer risk to third party (insurance, outsourcing)
- `accept` - Accept the risk as-is

**Implementation Status:** `proposed`, `approved`, `in_progress`, `implemented`, `verified`, `rejected`

**Priority Levels:** `low`, `medium`, `high`, `critical`

```powershell
# Mitigation 1: SQL Injection Prevention
$mitigation1Body = @{
    threatId = $threat1Id
    mitigationStrategy = "eliminate"
    mitigationDescription = "Implement parameterized queries and stored procedures. Use ORM framework with built-in SQL injection protection. Input validation and sanitization."
    implementationStatus = "approved"
    priority = "critical"
    assignedTo = 1  # User ID
    implementationDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    estimatedEffort = "40 hours"
    costEstimate = 5000.00
    verificationMethod = "Code review, penetration testing, automated SQL injection scanning"
} | ConvertTo-Json

$mitigation1Response = Invoke-RestMethod -Uri "http://localhost:3000/api/mitigations" `
    -Method POST `
    -Headers $headers `
    -Body $mitigation1Body

Write-Host "Mitigation 1 Created: SQL Injection Prevention" -ForegroundColor Green

# Mitigation 2: Multi-Factor Authentication
$mitigation2Body = @{
    threatId = $threat2Id
    mitigationStrategy = "reduce"
    mitigationDescription = "Implement multi-factor authentication (MFA) using TOTP or SMS. Add account lockout after 5 failed attempts. Implement CAPTCHA on login form."
    implementationStatus = "in_progress"
    priority = "high"
    assignedTo = 1
    implementationDate = (Get-Date).AddDays(45).ToString("yyyy-MM-dd")
    estimatedEffort = "60 hours"
    costEstimate = 8000.00
    verificationMethod = "User acceptance testing, security audit"
} | ConvertTo-Json

$mitigation2Response = Invoke-RestMethod -Uri "http://localhost:3000/api/mitigations" `
    -Method POST `
    -Headers $headers `
    -Body $mitigation2Body

Write-Host "Mitigation 2 Created: Multi-Factor Authentication" -ForegroundColor Green

# Mitigation 3: DDoS Protection
$mitigation3Body = @{
    threatId = $threat3Response.data.id
    mitigationStrategy = "transfer"
    mitigationDescription = "Implement Cloudflare DDoS protection service. Use rate limiting and load balancing."
    implementationStatus = "proposed"
    priority = "high"
    assignedTo = 1
    implementationDate = (Get-Date).AddDays(15).ToString("yyyy-MM-dd")
    estimatedEffort = "20 hours"
    costEstimate = 15000.00
    verificationMethod = "Load testing, DDoS simulation"
} | ConvertTo-Json

$mitigation3Response = Invoke-RestMethod -Uri "http://localhost:3000/api/mitigations" `
    -Method POST `
    -Headers $headers `
    -Body $mitigation3Body

Write-Host "Mitigation 3 Created: DDoS Protection" -ForegroundColor Green

$mitigation1Id = $mitigation1Response.data.id
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Mitigation plan created successfully",
  "data": {
    "id": 1,
    "threat_id": 1,
    "mitigation_strategy": "eliminate",
    "mitigation_description": "Implement parameterized queries and stored procedures...",
    "implementation_status": "approved",
    "priority": "critical",
    "assigned_to": 1,
    "estimated_effort": "40 hours",
    "cost_estimate": "5000.00",
    "implementation_date": "2026-02-14",
    "verification_method": "Code review, penetration testing...",
    "effectiveness_rating": null,
    "created_at": "2026-01-15T11:00:00.000Z",
    "updated_at": "2026-01-15T11:00:00.000Z",
    "completed_at": null
  }
}
```

---

## 9. Update Mitigation Status

**Endpoint:** `PUT /api/mitigations/:id`

**Description:** Track mitigation implementation progress

```powershell
# Update mitigation status to "implemented"
$updateMitigationBody = @{
    implementationStatus = "implemented"
    effectivenessRating = "high"
    verificationMethod = "Completed code review and penetration test. No SQL injection vulnerabilities found."
} | ConvertTo-Json

$updateMitigationResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/mitigations/$mitigation1Id" `
    -Method PUT `
    -Headers $headers `
    -Body $updateMitigationBody

Write-Host "`nMitigation Updated:" -ForegroundColor Green
Write-Host "Status: $($updateMitigationResponse.data.implementation_status)"
Write-Host "Effectiveness: $($updateMitigationResponse.data.effectiveness_rating)"
Write-Host "Completed At: $($updateMitigationResponse.data.completed_at)"

# Get my assigned mitigations
$myMitigationsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/mitigations/my" `
    -Method GET `
    -Headers $headers

Write-Host "`nMy Assigned Mitigations ($($myMitigationsResponse.data.totalAssignments)):" -ForegroundColor Cyan
$myMitigationsResponse.data.mitigations | Format-Table -Property mitigation_strategy, priority, implementation_status, threat_title
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Mitigation updated successfully",
  "data": {
    "id": 1,
    "threat_id": 1,
    "mitigation_strategy": "eliminate",
    "implementation_status": "implemented",
    "priority": "critical",
    "effectiveness_rating": "high",
    "completed_at": "2026-01-15T11:05:00.000Z"
  }
}
```

---

## 10. Get Threat Model Statistics

**Endpoint:** `GET /api/threat-models/:id/stats`

**Description:** Comprehensive statistics including threat counts, risk distribution, mitigation coverage

```powershell
$statsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/threat-models/$threatModelId/stats" `
    -Method GET `
    -Headers $headers

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "THREAT MODEL STATISTICS" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$stats = $statsResponse.data

Write-Host "Model: $($stats.model_name) v$($stats.model_version)" -ForegroundColor White
Write-Host "Status: $($stats.status)" -ForegroundColor White
Write-Host "Overall Risk Score: $($stats.risk_score)`n" -ForegroundColor $(if($stats.risk_score -ge 15){"Red"}else{"Yellow"})

Write-Host "--- THREAT SUMMARY ---" -ForegroundColor Yellow
Write-Host "Total Threats: $($stats.total_threats)"
Write-Host "  Critical: $($stats.critical_threats)" -ForegroundColor Red
Write-Host "  High: $($stats.high_threats)" -ForegroundColor Yellow
Write-Host "  Medium: $($stats.medium_threats)" -ForegroundColor Cyan
Write-Host "  Low: $($stats.low_threats)" -ForegroundColor Gray

Write-Host "`n--- THREAT STATUS ---" -ForegroundColor Yellow
foreach ($status in $stats.threat_status_breakdown) {
    Write-Host "  $($status.status): $($status.count)"
}

Write-Host "`n--- STRIDE BREAKDOWN ---" -ForegroundColor Yellow
foreach ($stride in $stats.stride_breakdown) {
    Write-Host "  [$($stride.category_code)] $($stride.category_name): $($stride.threat_count) threats"
}

Write-Host "`n--- ASSETS ---" -ForegroundColor Yellow
Write-Host "Total Assets: $($stats.total_assets)"
foreach ($assetType in $stats.asset_breakdown) {
    Write-Host "  $($assetType.asset_type): $($assetType.count)"
}

Write-Host "`n--- MITIGATION COVERAGE ---" -ForegroundColor Yellow
Write-Host "Total Mitigations: $($stats.total_mitigations)"
Write-Host "  Proposed: $($stats.proposed_mitigations)"
Write-Host "  In Progress: $($stats.in_progress_mitigations)"
Write-Host "  Implemented: $($stats.implemented_mitigations)"
Write-Host "Coverage: $($stats.mitigation_coverage)%" -ForegroundColor Green

Write-Host "`n============================================`n" -ForegroundColor Cyan
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Threat model statistics retrieved successfully",
  "data": {
    "id": 1,
    "model_name": "E-Commerce Platform Threat Model",
    "model_version": "1.0",
    "status": "draft",
    "risk_score": 16.5,
    "total_threats": 6,
    "critical_threats": 1,
    "high_threats": 3,
    "medium_threats": 2,
    "low_threats": 0,
    "threat_status_breakdown": [
      { "status": "identified", "count": 6 },
      { "status": "analyzing", "count": 0 }
    ],
    "stride_breakdown": [
      { "category_code": "S", "category_name": "Spoofing", "threat_count": 1 },
      { "category_code": "T", "category_name": "Tampering", "threat_count": 2 },
      { "category_code": "D", "category_name": "Denial of Service", "threat_count": 1 },
      { "category_code": "I", "category_name": "Information Disclosure", "threat_count": 1 },
      { "category_code": "E", "category_name": "Elevation of Privilege", "threat_count": 1 }
    ],
    "total_assets": 4,
    "asset_breakdown": [
      { "asset_type": "process", "count": 2 },
      { "asset_type": "data_store", "count": 1 },
      { "asset_type": "external_entity", "count": 1 }
    ],
    "total_mitigations": 3,
    "proposed_mitigations": 1,
    "in_progress_mitigations": 1,
    "implemented_mitigations": 1,
    "mitigation_coverage": 50.0,
    "risk_distribution": {
      "critical": { "count": 1, "percentage": 16.67 },
      "high": { "count": 3, "percentage": 50.0 },
      "medium": { "count": 2, "percentage": 33.33 }
    }
  }
}
```

---

## Complete Test Script

Save this as `test-threat-modeling.ps1`:

```powershell
# Threat Modeling API Test Script
$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "THREAT MODELING API TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Login
Write-Host "1. Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json)

$token = $loginResponse.data.token
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "   ✓ Logged in successfully`n" -ForegroundColor Green

# 2. Get STRIDE Categories
Write-Host "2. Getting STRIDE categories..." -ForegroundColor Yellow
$strideResponse = Invoke-RestMethod -Uri "$baseUrl/stride/categories" -Method GET
Write-Host "   ✓ Retrieved $($strideResponse.data.totalCategories) STRIDE categories`n" -ForegroundColor Green

# 3. Create Threat Model
Write-Host "3. Creating threat model..." -ForegroundColor Yellow
$threatModelBody = @{
    modelName = "E-Commerce Platform Threat Model"
    systemName = "Online Shopping System"
    description = "Comprehensive threat analysis for e-commerce platform"
    modelVersion = "1.0"
} | ConvertTo-Json

$threatModelResponse = Invoke-RestMethod -Uri "$baseUrl/threat-models" `
    -Method POST -Headers $headers -Body $threatModelBody
$threatModelId = $threatModelResponse.data.id
Write-Host "   ✓ Threat Model Created (ID: $threatModelId)`n" -ForegroundColor Green

# 4. Create Assets
Write-Host "4. Creating assets..." -ForegroundColor Yellow
$assets = @(
    @{ assetName = "Web Server"; assetType = "process"; criticality = "high" },
    @{ assetName = "Database"; assetType = "data_store"; criticality = "critical" },
    @{ assetName = "Auth Service"; assetType = "process"; criticality = "critical" }
)
$assetIds = @()
foreach ($asset in $assets) {
    $response = Invoke-RestMethod -Uri "$baseUrl/assets" `
        -Method POST -Headers $headers -Body ($asset | ConvertTo-Json)
    $assetIds += $response.data.id
    Write-Host "   ✓ Created: $($asset.assetName) (ID: $($response.data.id))" -ForegroundColor Green
}
Write-Host ""

# 5. Link Assets
Write-Host "5. Linking assets to threat model..." -ForegroundColor Yellow
foreach ($assetId in $assetIds) {
    $linkBody = @{ assetId = $assetId } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/threat-models/$threatModelId/assets" `
        -Method POST -Headers $headers -Body $linkBody | Out-Null
}
Write-Host "   ✓ Linked $($assetIds.Count) assets`n" -ForegroundColor Green

# 6. Create Threats
Write-Host "6. Creating threats..." -ForegroundColor Yellow
$threats = @(
    @{ title = "SQL Injection"; assetId = $assetIds[1]; strideId = 2; likelihood = "high"; impact = "very_high" },
    @{ title = "Credential Stuffing"; assetId = $assetIds[2]; strideId = 1; likelihood = "high"; impact = "high" },
    @{ title = "DDoS Attack"; assetId = $assetIds[0]; strideId = 5; likelihood = "medium"; impact = "high" }
)
$threatIds = @()
foreach ($threat in $threats) {
    $threatBody = @{
        threatModelId = $threatModelId
        assetId = $threat.assetId
        strideCategoryId = $threat.strideId
        threatTitle = $threat.title
        threatDescription = "Test threat description"
        likelihood = $threat.likelihood
        impact = $threat.impact
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/threats" `
        -Method POST -Headers $headers -Body $threatBody
    $threatIds += $response.data.id
    Write-Host "   ✓ Created: $($threat.title) [Risk: $($response.data.risk_score)]" -ForegroundColor Green
}
Write-Host ""

# 7. Create Mitigations
Write-Host "7. Creating mitigations..." -ForegroundColor Yellow
$mitigationBody = @{
    threatId = $threatIds[0]
    mitigationStrategy = "eliminate"
    mitigationDescription = "Implement parameterized queries"
    priority = "critical"
} | ConvertTo-Json
$mitResponse = Invoke-RestMethod -Uri "$baseUrl/mitigations" `
    -Method POST -Headers $headers -Body $mitigationBody
Write-Host "   ✓ Mitigation created (ID: $($mitResponse.data.id))`n" -ForegroundColor Green

# 8. Get Statistics
Write-Host "8. Getting threat model statistics..." -ForegroundColor Yellow
$statsResponse = Invoke-RestMethod -Uri "$baseUrl/threat-models/$threatModelId/stats" `
    -Method GET -Headers $headers
Write-Host "   ✓ Statistics retrieved`n" -ForegroundColor Green
Write-Host "   Threats: $($statsResponse.data.total_threats) (Critical: $($statsResponse.data.critical_threats), High: $($statsResponse.data.high_threats))"
Write-Host "   Assets: $($statsResponse.data.total_assets)"
Write-Host "   Mitigations: $($statsResponse.data.total_mitigations)`n"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
```

---

## Summary

The threat modeling workflow follows this sequence:

1. **Reference Data:** Get STRIDE categories (6 threat types)
2. **Container:** Create threat model to organize analysis
3. **Assets:** Define reusable DFD elements (servers, databases, etc.)
4. **Linking:** Associate assets with threat model
5. **Threats:** Identify vulnerabilities using STRIDE framework
6. **Risk Scoring:** Automatic calculation (Likelihood × Impact = 1-25)
7. **Filtering:** View high-risk threats (score >= 15)
8. **Mitigations:** Plan remediation strategies
9. **Tracking:** Update implementation status
10. **Reporting:** View comprehensive statistics

**Key Concepts:**
- **STRIDE:** Framework for categorizing threats (S-T-R-I-D-E)
- **Risk Score:** Likelihood (1-5) × Impact (1-5) = Score (1-25)
- **Assets:** Reusable across multiple threat models
- **Mitigation Strategies:** Eliminate, Reduce, Transfer, Accept
- **Status Tracking:** From identified → mitigating → mitigated
