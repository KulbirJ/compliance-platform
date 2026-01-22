# Evidence Management API Testing Guide

## Overview
This guide provides comprehensive examples for testing the Evidence Management APIs with file uploads.

**Base URL:** `http://localhost:3000/api`

## Table of Contents
1. [Authentication](#authentication)
2. [Upload Evidence](#upload-evidence)
3. [List Evidence](#list-evidence)
4. [Get Evidence Details](#get-evidence-details)
5. [Download Evidence](#download-evidence)
6. [Update Evidence](#update-evidence)
7. [Delete Evidence](#delete-evidence)
8. [Postman Collection](#postman-collection)

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
```

Save the token - you'll need it for all evidence operations.

---

## Upload Evidence

### 1. Upload File as Evidence

**Important:** File uploads use `multipart/form-data` format, not JSON!

#### cURL Example

```bash
# Upload a PDF file
curl -X POST http://localhost:3000/api/evidence/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/your/document.pdf" \
  -F "controlAssessmentId=1" \
  -F "evidenceQuality=high" \
  -F "description=Asset inventory spreadsheet from ServiceNow CMDB export"

# Upload an image (screenshot)
curl -X POST http://localhost:3000/api/evidence/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/screenshot.png" \
  -F "controlAssessmentId=1" \
  -F "evidenceQuality=medium" \
  -F "description=Screenshot of asset management dashboard"

# Upload without description (optional field)
curl -X POST http://localhost:3000/api/evidence/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/policy.docx" \
  -F "controlAssessmentId=2" \
  -F "evidenceQuality=excellent"
```

#### PowerShell Example

```powershell
# Create a sample test file
"This is test evidence content" | Out-File -FilePath "test-evidence.txt"

# Upload using Invoke-RestMethod
$filePath = "test-evidence.txt"
$controlAssessmentId = 1
$evidenceQuality = "high"
$description = "Test evidence file upload"

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$fileBin = [System.IO.File]::ReadAllBytes($filePath)
$fileName = [System.IO.Path]::GetFileName($filePath)

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
    "Content-Type: text/plain",
    "",
    [System.Text.Encoding]::ASCII.GetString($fileBin),
    "--$boundary",
    "Content-Disposition: form-data; name=`"controlAssessmentId`"",
    "",
    "$controlAssessmentId",
    "--$boundary",
    "Content-Disposition: form-data; name=`"evidenceQuality`"",
    "",
    "$evidenceQuality",
    "--$boundary",
    "Content-Disposition: form-data; name=`"description`"",
    "",
    "$description",
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/evidence/upload" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "multipart/form-data; boundary=$boundary" `
    -Body $body

Write-Host "Evidence uploaded: ID $($response.data.id)"
```

**Request Fields:**
- `file` (required): The file to upload (binary)
- `controlAssessmentId` (required): Control assessment ID (integer)
- `evidenceQuality` (optional): Quality rating
  - `low`
  - `medium` (default)
  - `high`
  - `excellent`
- `description` (optional): Description of the evidence (max 5000 characters)

**Response:**
```json
{
  "success": true,
  "message": "Evidence uploaded successfully",
  "data": {
    "id": 1,
    "evidenceName": "asset-inventory.pdf",
    "fileType": "application/pdf",
    "fileSize": 245760,
    "fileSizeFormatted": "240 KB",
    "evidenceType": "document",
    "qualityRating": "high",
    "description": "Asset inventory spreadsheet from ServiceNow CMDB export",
    "controlAssessmentId": 1,
    "organizationId": 1,
    "uploadedBy": 1,
    "isVerified": false,
    "createdAt": "2026-01-15T16:30:00.000Z",
    "updatedAt": "2026-01-15T16:30:00.000Z"
  }
}
```

**Supported File Types:**
- **Documents:** PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
- **Images:** JPG, PNG, GIF
- **Archives:** ZIP
- **Data:** JSON, XML

**File Size Limit:** 10MB per file

---

## List Evidence

### 2. Get All Evidence for a Control Assessment

```bash
# cURL
curl -X GET "http://localhost:3000/api/evidence?controlAssessmentId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
$evidence = Invoke-RestMethod -Uri "http://localhost:3000/api/evidence?controlAssessmentId=1" `
  -Headers @{ Authorization = "Bearer $token" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "controlAssessmentId": 1,
    "controlCode": "ID.AM-1",
    "controlName": "Physical devices and systems within the organization are inventoried",
    "totalEvidence": 3,
    "statistics": {
      "totalCount": 3,
      "verifiedCount": 1,
      "excellentQuality": 1,
      "highQuality": 1,
      "mediumQuality": 1,
      "lowQuality": 0,
      "totalSizeBytes": 1048576,
      "totalSizeFormatted": "1 MB"
    },
    "evidence": [
      {
        "id": 1,
        "evidenceName": "asset-inventory.pdf",
        "fileType": "application/pdf",
        "fileSize": 245760,
        "fileSizeFormatted": "240 KB",
        "evidenceType": "document",
        "qualityRating": "high",
        "description": "Asset inventory spreadsheet from ServiceNow CMDB export",
        "isVerified": true,
        "verifiedBy": "System Administrator",
        "verifiedAt": "2026-01-15T17:00:00.000Z",
        "uploadedBy": "John Doe",
        "createdAt": "2026-01-15T16:30:00.000Z",
        "updatedAt": "2026-01-15T17:00:00.000Z",
        "expirationDate": null,
        "tags": ["asset-management", "inventory"]
      },
      {
        "id": 2,
        "evidenceName": "dashboard-screenshot.png",
        "fileType": "image/png",
        "fileSize": 512000,
        "fileSizeFormatted": "500 KB",
        "evidenceType": "screenshot",
        "qualityRating": "medium",
        "description": "Screenshot of asset management dashboard",
        "isVerified": false,
        "verifiedBy": null,
        "verifiedAt": null,
        "uploadedBy": "Jane Smith",
        "createdAt": "2026-01-15T16:45:00.000Z",
        "updatedAt": "2026-01-15T16:45:00.000Z",
        "expirationDate": null,
        "tags": null
      }
    ]
  }
}
```

---

## Get Evidence Details

### 3. Get Evidence Metadata by ID

```bash
# cURL
curl -X GET http://localhost:3000/api/evidence/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
$evidenceDetails = Invoke-RestMethod -Uri "http://localhost:3000/api/evidence/1" `
  -Headers @{ Authorization = "Bearer $token" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "evidenceName": "asset-inventory.pdf",
    "fileType": "application/pdf",
    "fileSize": 245760,
    "fileSizeFormatted": "240 KB",
    "evidenceType": "document",
    "qualityRating": "high",
    "description": "Asset inventory spreadsheet from ServiceNow CMDB export",
    "controlAssessmentId": 1,
    "assessmentId": 1,
    "controlCode": "ID.AM-1",
    "controlName": "Physical devices and systems within the organization are inventoried",
    "organizationId": 1,
    "isVerified": true,
    "verifiedBy": {
      "username": "admin",
      "fullName": "System Administrator"
    },
    "verifiedAt": "2026-01-15T17:00:00.000Z",
    "uploadedBy": {
      "username": "jdoe",
      "fullName": "John Doe"
    },
    "expirationDate": null,
    "tags": ["asset-management", "inventory"],
    "createdAt": "2026-01-15T16:30:00.000Z",
    "updatedAt": "2026-01-15T17:00:00.000Z"
  }
}
```

---

## Download Evidence

### 4. Download Evidence File

```bash
# cURL - Download and save to file
curl -X GET http://localhost:3000/api/evidence/1/download \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o downloaded-evidence.pdf

# PowerShell - Download and save
$evidenceId = 1
Invoke-WebRequest -Uri "http://localhost:3000/api/evidence/$evidenceId/download" `
  -Headers @{ Authorization = "Bearer $token" } `
  -OutFile "downloaded-evidence.pdf"

Write-Host "File downloaded successfully"
```

**Response Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="asset-inventory.pdf"
Content-Length: 245760
```

The file will be downloaded as a binary stream with the original filename.

---

## Update Evidence

### 5. Update Evidence Metadata

```bash
# cURL - Update description and quality
curl -X PUT http://localhost:3000/api/evidence/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated: Comprehensive asset inventory from Q1 2026",
    "evidenceQuality": "excellent",
    "tags": ["asset-management", "inventory", "q1-2026"],
    "expirationDate": "2027-01-15"
  }'

# PowerShell
$updateBody = @{
  description = "Updated: Comprehensive asset inventory from Q1 2026"
  evidenceQuality = "excellent"
  tags = @("asset-management", "inventory", "q1-2026")
  expirationDate = "2027-01-15"
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "http://localhost:3000/api/evidence/1" `
  -Method PUT `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $updateBody
```

**Updatable Fields:**
- `description` (optional): New description
- `evidenceQuality` (optional): New quality rating (low, medium, high, excellent)
- `tags` (optional): Array of tags
- `expirationDate` (optional): Expiration date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "message": "Evidence updated successfully",
  "data": {
    "id": 1,
    "evidenceName": "asset-inventory.pdf",
    "fileType": "application/pdf",
    "fileSize": 245760,
    "evidenceType": "document",
    "qualityRating": "excellent",
    "description": "Updated: Comprehensive asset inventory from Q1 2026",
    "tags": ["asset-management", "inventory", "q1-2026"],
    "expirationDate": "2027-01-15T00:00:00.000Z",
    "isVerified": true,
    "updatedAt": "2026-01-15T18:00:00.000Z"
  }
}
```

---

## Delete Evidence

### 6. Delete Evidence

```bash
# cURL
curl -X DELETE http://localhost:3000/api/evidence/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
$deleted = Invoke-RestMethod -Uri "http://localhost:3000/api/evidence/1" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }
```

**Response:**
```json
{
  "success": true,
  "message": "Evidence deleted successfully",
  "data": {
    "id": 1,
    "evidenceName": "asset-inventory.pdf"
  }
}
```

**Note:** Only the uploader, organization owners, or admins can delete evidence.

---

## Verify Evidence (Admin/Owner Only)

### 7. Verify Evidence

```bash
# cURL
curl -X POST http://localhost:3000/api/evidence/1/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# PowerShell
$verified = Invoke-RestMethod -Uri "http://localhost:3000/api/evidence/1/verify" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }
```

**Response:**
```json
{
  "success": true,
  "message": "Evidence verified successfully",
  "data": {
    "id": 1,
    "evidenceName": "asset-inventory.pdf",
    "isVerified": true,
    "verifiedBy": 1,
    "verifiedAt": "2026-01-15T17:00:00.000Z"
  }
}
```

---

## Postman Collection

### Setting Up Postman

1. **Create New Collection:** "Evidence Management APIs"

2. **Set Collection Variables:**
   - `baseUrl`: `http://localhost:3000/api`
   - `token`: Your JWT token (from login)

3. **Add Authorization Header:**
   - In Collection settings, go to "Authorization" tab
   - Type: "Bearer Token"
   - Token: `{{token}}`

### Postman Requests

#### 1. Upload Evidence (Multipart Form-Data)

**Request Setup:**
```
Method: POST
URL: {{baseUrl}}/evidence/upload
Authorization: Bearer Token (inherited)
Body: form-data
```

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| file | File | [Select file from computer] |
| controlAssessmentId | Text | 1 |
| evidenceQuality | Text | high |
| description | Text | Asset inventory spreadsheet |

**Important:** In Postman, select "form-data" tab, then:
1. For the `file` field, change type from "Text" to "File" using dropdown
2. Click "Select Files" button to choose your file
3. Add other fields as "Text" type

#### 2. Get Evidence List

**Request Setup:**
```
Method: GET
URL: {{baseUrl}}/evidence?controlAssessmentId=1
Authorization: Bearer Token (inherited)
```

#### 3. Get Evidence Details

**Request Setup:**
```
Method: GET
URL: {{baseUrl}}/evidence/1
Authorization: Bearer Token (inherited)
```

#### 4. Download Evidence

**Request Setup:**
```
Method: GET
URL: {{baseUrl}}/evidence/1/download
Authorization: Bearer Token (inherited)
```

**To Save File in Postman:**
1. Click "Send and Download" button
2. Choose location to save file

#### 5. Update Evidence

**Request Setup:**
```
Method: PUT
URL: {{baseUrl}}/evidence/1
Authorization: Bearer Token (inherited)
Headers: Content-Type: application/json
Body: raw (JSON)
```

**Body:**
```json
{
  "description": "Updated description",
  "evidenceQuality": "excellent",
  "tags": ["asset-management", "inventory"],
  "expirationDate": "2027-01-15"
}
```

#### 6. Delete Evidence

**Request Setup:**
```
Method: DELETE
URL: {{baseUrl}}/evidence/1
Authorization: Bearer Token (inherited)
```

---

## Complete Workflow Example

### Scenario: Assessing ID.AM-1 with Evidence

```powershell
# Step 1: Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$token = $loginResponse.data.token
$headers = @{ Authorization = "Bearer $token" }

# Step 2: Create Assessment (if not exists)
$assessmentBody = @{
  assessmentName = "Q1 2026 Compliance Assessment"
  assessmentType = "initial"
  description = "Comprehensive assessment with evidence"
  dueDate = "2026-03-31"
} | ConvertTo-Json

$assessment = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $assessmentBody

$assessmentId = $assessment.data.id

# Step 3: Assess a Control
$controlBody = @{
  assessmentId = $assessmentId
  controlId = 1
  status = "fully_implemented"
  comments = "Asset inventory maintained in ServiceNow"
  maturityLevel = "managed"
  complianceScore = 95
} | ConvertTo-Json

$controlAssessment = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId/controls" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $controlBody

$controlAssessmentId = $controlAssessment.data.id
Write-Host "Control Assessment ID: $controlAssessmentId"

# Step 4: Upload Evidence Files
# Create test files
"Asset ID,Name,Type,Location" | Out-File -FilePath "asset-inventory.csv"
"Physical device inventory as of Jan 2026" | Out-File -FilePath "inventory-notes.txt"

# Upload CSV
# (Use curl or manual PowerShell multipart upload as shown earlier)

# Step 5: Get Control Assessment with Evidence
$controlWithEvidence = Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/$assessmentId/controls?groupBy=function" `
  -Headers $headers

Write-Host "Control has $($controlWithEvidence.data.functions[0].categories[0].controls[0].evidence_count) evidence files"

# Step 6: Download Evidence
Invoke-WebRequest -Uri "http://localhost:3000/api/evidence/1/download" `
  -Headers $headers `
  -OutFile "downloaded-evidence.csv"
```

---

## Error Handling

### Common Errors

**1. Invalid File Type**
```json
{
  "success": false,
  "message": "Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JPG, PNG, GIF, ZIP, JSON, XML",
  "code": "INVALID_FILE_TYPE"
}
```

**2. File Too Large**
```json
{
  "success": false,
  "message": "File too large. Maximum file size is 10MB.",
  "code": "FILE_TOO_LARGE"
}
```

**3. No File Uploaded**
```json
{
  "success": false,
  "message": "No file uploaded. Please attach a file."
}
```

**4. Control Assessment Not Found**
```json
{
  "success": false,
  "message": "Control assessment not found"
}
```

**5. Access Denied**
```json
{
  "success": false,
  "message": "Access denied. You do not have permission to upload evidence for this assessment."
}
```

---

## Testing Checklist

- [ ] Upload PDF document
- [ ] Upload image (screenshot)
- [ ] Upload text file
- [ ] Test file size limit (try 11MB file - should fail)
- [ ] Test invalid file type (try .exe - should fail)
- [ ] Get evidence list for control assessment
- [ ] Get evidence metadata by ID
- [ ] Download evidence file
- [ ] Update evidence description
- [ ] Update evidence quality rating
- [ ] Verify evidence (admin only)
- [ ] Delete evidence (check permissions)
- [ ] View control assessment with evidence count
- [ ] Upload multiple files for same control

---

## Integration with Control Assessments

When you retrieve control assessments, they now include evidence information:

```bash
# Get control assessments with evidence counts
curl -X GET "http://localhost:3000/api/assessments/1/controls?groupBy=function" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response includes evidence_count:**
```json
{
  "success": true,
  "data": {
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
                "controlCode": "ID.AM-1",
                "controlName": "Physical devices...",
                "implementationStatus": "fully_implemented",
                "evidence_count": "3"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Tips

1. **File Naming:** Use descriptive filenames - they're displayed to users
2. **Quality Ratings:** Use consistent quality ratings across your organization
3. **Tags:** Add tags for easy filtering and categorization
4. **Expiration Dates:** Set expiration dates for time-sensitive evidence (certificates, reports)
5. **Verification:** Have admins verify critical evidence
6. **File Formats:** Use PDF for formal documents, PNG for screenshots
7. **Descriptions:** Always add descriptions explaining what the evidence demonstrates

---

## Next Steps

After testing evidence management:
1. Build frontend file upload components
2. Implement bulk evidence upload
3. Add evidence preview/viewer
4. Create evidence reports
5. Implement evidence expiration notifications
6. Add evidence approval workflow

---

For more information, see [ASSESSMENT_TESTING.md](ASSESSMENT_TESTING.md).
