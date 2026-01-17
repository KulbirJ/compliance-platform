# Evidence Management API Testing Script
# Tests file upload, list, download, update, and delete operations

$ErrorActionPreference = "Stop"

# Configuration
$baseUrl = "http://localhost:3000/api"
$email = "admin@example.com"
$password = "admin123"

# Colors for output
function Write-Success {
    param([string]$message)
    Write-Host "SUCCESS: $message" -ForegroundColor Green
}

function Write-Info {
    param([string]$message)
    Write-Host "INFO: $message" -ForegroundColor Cyan
}

function Write-TestHeader {
    param([string]$message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host $message -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
}

function Write-ErrorMsg {
    param([string]$message)
    Write-Host "ERROR: $message" -ForegroundColor Red
}

# Helper function to make API calls
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [string]$ContentType = "application/json"
    )
    
    try {
        $params = @{
            Method = $Method
            Uri = $Uri
            Headers = $Headers
        }
        
        if ($Body) {
            if ($ContentType -eq "application/json") {
                $params.Body = ($Body | ConvertTo-Json -Depth 10)
            } else {
                $params.Body = $Body
            }
            $params.ContentType = $ContentType
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-ErrorMsg "API Error: $($_.Exception.Message)"
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        throw
    }
}

# Create test files
function Create-TestFiles {
    Write-Info "Creating test files..."
    
    # Create a CSV file (Asset Inventory)
    $csvContent = @"
Asset ID,Name,Type,Location,Owner
AST-001,Server-01,Physical Server,Data Center A,IT Operations
AST-002,Laptop-Finance-01,Laptop,Finance Dept,Jane Smith
AST-003,Firewall-01,Network Device,DMZ,Network Team
AST-004,Database-Prod,Virtual Server,Cloud,Database Admin
"@
    $csvContent | Out-File -FilePath "test-asset-inventory.csv" -Encoding UTF8
    
    # Create a text file (Policy Document)
    $textContent = @"
ASSET MANAGEMENT POLICY
Version 1.0 - January 2026

1. PURPOSE
This policy establishes guidelines for maintaining an accurate inventory of all 
organizational assets including physical devices, systems, and software.

2. SCOPE
This policy applies to all information systems and technology assets owned or 
managed by the organization.

3. REQUIREMENTS
- All assets must be registered in the CMDB within 24 hours of acquisition
- Asset inventory reviews conducted quarterly
- Automatic discovery tools deployed across all network segments
- Asset retirement procedures followed for all decommissioned equipment

4. RESPONSIBILITIES
IT Operations team maintains the asset inventory database and ensures accuracy.
"@
    $textContent | Out-File -FilePath "test-asset-policy.txt" -Encoding UTF8
    
    # Create a JSON file (Configuration Export)
    $jsonContent = @"
{
  "inventorySystem": "ServiceNow CMDB",
  "lastScanDate": "2026-01-15T10:00:00Z",
  "totalAssets": 1247,
  "assetTypes": {
    "servers": 156,
    "workstations": 842,
    "networkDevices": 143,
    "mobileDevices": 106
  },
  "complianceStatus": "compliant",
  "nextReviewDate": "2026-04-15"
}
"@
    $jsonContent | Out-File -FilePath "test-cmdb-export.json" -Encoding UTF8
    
    Write-Success "Created test files: asset-inventory.csv, asset-policy.txt, cmdb-export.json"
}

# Clean up test files
function Remove-TestFiles {
    Write-Info "Cleaning up test files..."
    $files = @("test-asset-inventory.csv", "test-asset-policy.txt", "test-cmdb-export.json", "downloaded-evidence-*")
    foreach ($file in $files) {
        if (Test-Path $file) {
            Remove-Item $file -Force
        }
    }
    Write-Success "Test files cleaned up"
}

Write-TestHeader "EVIDENCE MANAGEMENT API TESTING"

try {
    # Step 1: Login
    Write-TestHeader "Step 1: Authentication"
    $loginBody = @{
        email = $email
        password = $password
    }
    
    $loginResponse = Invoke-ApiRequest -Method POST -Uri "$baseUrl/auth/login" -Body $loginBody
    $token = $loginResponse.data.token
    $headers = @{ Authorization = "Bearer $token" }
    
    Write-Success "Login successful"
    Write-Info "User: $($loginResponse.data.user.username)"
    Write-Info "Organization: $($loginResponse.data.user.organizationName)"
    
    # Step 2: Create or Get Assessment
    Write-TestHeader "Step 2: Create Assessment"
    $assessmentBody = @{
        assessmentName = "Evidence Testing Assessment - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        assessmentType = "initial"
        description = "Test assessment for evidence management workflow"
        dueDate = "2026-03-31"
    }
    
    $assessmentResponse = Invoke-ApiRequest -Method POST -Uri "$baseUrl/assessments" -Headers $headers -Body $assessmentBody
    $assessmentId = $assessmentResponse.data.id
    
    Write-Success "Assessment created: ID $assessmentId"
    Write-Info "Name: $($assessmentResponse.data.assessmentName)"
    
    # Step 3: Create Control Assessment
    Write-TestHeader "Step 3: Create Control Assessment"
    $controlBody = @{
        assessmentId = $assessmentId
        controlId = 1
        status = "fully_implemented"
        comments = "Asset inventory maintained in ServiceNow CMDB with quarterly reviews"
        maturityLevel = "managed"
        complianceScore = 95
    }
    
    $controlResponse = Invoke-ApiRequest -Method POST -Uri "$baseUrl/assessments/$assessmentId/controls" -Headers $headers -Body $controlBody
    $controlAssessmentId = $controlResponse.data.id
    
    Write-Success "Control assessment created: ID $controlAssessmentId"
    Write-Info "Control: $($controlResponse.data.controlCode) - $($controlResponse.data.controlName)"
    Write-Info "Initial evidence count: $($controlResponse.data.evidence_count)"
    
    # Step 4: Create Test Files
    Write-TestHeader "Step 4: Prepare Test Files"
    Create-TestFiles
    
    # Step 5: Upload Evidence Files
    Write-TestHeader "Step 5: Upload Evidence Files"
    
    $evidenceIds = @()
    
    # Upload CSV file
    Write-Info "Uploading CSV file..."
    $csvFile = "test-asset-inventory.csv"
    $csvResponse = curl.exe -s -X POST "$baseUrl/evidence/upload" `
        -H "Authorization: Bearer $token" `
        -F "file=@$csvFile" `
        -F "controlAssessmentId=$controlAssessmentId" `
        -F "evidenceQuality=high" `
        -F "description=Asset inventory spreadsheet exported from ServiceNow CMDB"
    
    $csvData = $csvResponse | ConvertFrom-Json
    $evidenceIds += $csvData.data.id
    Write-Success "Uploaded: $($csvData.data.evidenceName) (ID: $($csvData.data.id))"
    Write-Info "Type: $($csvData.data.evidenceType) | Size: $($csvData.data.fileSizeFormatted) | Quality: $($csvData.data.qualityRating)"
    
    # Upload text file
    Write-Info "Uploading text file..."
    $textFile = "test-asset-policy.txt"
    $textResponse = curl.exe -s -X POST "$baseUrl/evidence/upload" `
        -H "Authorization: Bearer $token" `
        -F "file=@$textFile" `
        -F "controlAssessmentId=$controlAssessmentId" `
        -F "evidenceQuality=excellent" `
        -F "description=Asset Management Policy document version 1.0"
    
    $textData = $textResponse | ConvertFrom-Json
    $evidenceIds += $textData.data.id
    Write-Success "Uploaded: $($textData.data.evidenceName) (ID: $($textData.data.id))"
    Write-Info "Type: $($textData.data.evidenceType) | Size: $($textData.data.fileSizeFormatted) | Quality: $($textData.data.qualityRating)"
    
    # Upload JSON file
    Write-Info "Uploading JSON file..."
    $jsonFile = "test-cmdb-export.json"
    $jsonResponse = curl.exe -s -X POST "$baseUrl/evidence/upload" `
        -H "Authorization: Bearer $token" `
        -F "file=@$jsonFile" `
        -F "controlAssessmentId=$controlAssessmentId" `
        -F "evidenceQuality=medium" `
        -F "description=CMDB configuration export showing asset inventory statistics"
    
    $jsonData = $jsonResponse | ConvertFrom-Json
    $evidenceIds += $jsonData.data.id
    Write-Success "Uploaded: $($jsonData.data.evidenceName) (ID: $($jsonData.data.id))"
    Write-Info "Type: $($jsonData.data.evidenceType) | Size: $($jsonData.data.fileSizeFormatted) | Quality: $($jsonData.data.qualityRating)"
    
    Write-Info ""
    Write-Info "Total evidence files uploaded: $($evidenceIds.Count)"
    
    # Step 6: Get Evidence List
    Write-TestHeader "Step 6: Get Evidence List"
    $evidenceListResponse = Invoke-ApiRequest -Method GET -Uri "$baseUrl/evidence?controlAssessmentId=$controlAssessmentId" -Headers $headers
    
    Write-Success "Retrieved evidence list for control assessment $controlAssessmentId"
    Write-Info "Control: $($evidenceListResponse.data.controlCode) - $($evidenceListResponse.data.controlName)"
    Write-Info "Total Evidence: $($evidenceListResponse.data.totalEvidence)"
    Write-Info ""
    Write-Info "Statistics:"
    Write-Info "Total Files: $($evidenceListResponse.data.statistics.totalCount)"
    Write-Info "Verified: $($evidenceListResponse.data.statistics.verifiedCount)"
    Write-Info "Excellent Quality: $($evidenceListResponse.data.statistics.excellentQuality)"
    Write-Info "High Quality: $($evidenceListResponse.data.statistics.highQuality)"
    Write-Info "Medium Quality: $($evidenceListResponse.data.statistics.mediumQuality)"
    Write-Info "Total Size: $($evidenceListResponse.data.statistics.totalSizeFormatted)"
    
    Write-Info ""
    Write-Info "Evidence Files:"
    foreach ($evidence in $evidenceListResponse.data.evidence) {
        Write-Host "  - [$($evidence.id)] $($evidence.evidenceName)" -ForegroundColor White
        Write-Host "    Quality: $($evidence.qualityRating) | Type: $($evidence.evidenceType) | Verified: $($evidence.isVerified)" -ForegroundColor Gray
    }
    
    # Step 7: Get Evidence Details
    Write-TestHeader "Step 7: Get Evidence Details"
    $evidenceId = $evidenceIds[0]
    $detailsResponse = Invoke-ApiRequest -Method GET -Uri "$baseUrl/evidence/$evidenceId" -Headers $headers
    
    Write-Success "Retrieved details for evidence ID $evidenceId"
    Write-Info "Name: $($detailsResponse.data.evidenceName)"
    Write-Info "Type: $($detailsResponse.data.fileType) ($($detailsResponse.data.evidenceType))"
    Write-Info "Size: $($detailsResponse.data.fileSizeFormatted)"
    Write-Info "Quality: $($detailsResponse.data.qualityRating)"
    Write-Info "Description: $($detailsResponse.data.description)"
    Write-Info "Control: $($detailsResponse.data.controlCode) - $($detailsResponse.data.controlName)"
    Write-Info "Uploaded by: $($detailsResponse.data.uploadedBy.fullName)"
    Write-Info "Created: $($detailsResponse.data.createdAt)"
    Write-Info "Verified: $($detailsResponse.data.isVerified)"
    
    # Step 8: Download Evidence
    Write-TestHeader "Step 8: Download Evidence"
    $downloadId = $evidenceIds[0]
    $downloadFileName = "downloaded-evidence-$downloadId.csv"
    
    Write-Info "Downloading evidence ID $downloadId..."
    Invoke-WebRequest -Uri "$baseUrl/evidence/$downloadId/download" -Headers $headers -OutFile $downloadFileName
    
    $downloadedFile = Get-Item $downloadFileName
    Write-Success "Downloaded: $($downloadedFile.Name) ($($downloadedFile.Length) bytes)"
    
    # Verify content
    $downloadedContent = Get-Content $downloadFileName -Raw
    if ($downloadedContent -like "*Asset ID*") {
        Write-Success "File content verified - CSV header found"
    }
    
    # Step 9: Update Evidence
    Write-TestHeader "Step 9: Update Evidence"
    $updateId = $evidenceIds[1]
    $updateBody = @{
        description = "UPDATED: Asset Management Policy document v1.0 - Approved by CISO"
        evidenceQuality = "excellent"
        tags = @("policy", "asset-management", "ciso-approved", "v1.0")
        expirationDate = "2027-01-15"
    }
    
    Write-Info "Updating evidence ID $updateId..."
    $updateResponse = Invoke-ApiRequest -Method PUT -Uri "$baseUrl/evidence/$updateId" -Headers $headers -Body $updateBody
    
    Write-Success "Evidence updated successfully"
    Write-Info "New description: $($updateResponse.data.description)"
    Write-Info "New quality: $($updateResponse.data.qualityRating)"
    Write-Info "Tags: $($updateResponse.data.tags -join ', ')"
    Write-Info "Expiration: $($updateResponse.data.expirationDate)"
    
    # Step 10: Verify Evidence
    Write-TestHeader "Step 10: Verify Evidence"
    $verifyId = $evidenceIds[0]
    
    Write-Info "Verifying evidence ID $verifyId..."
    $verifyResponse = Invoke-ApiRequest -Method POST -Uri "$baseUrl/evidence/$verifyId/verify" -Headers $headers
    
    Write-Success "Evidence verified successfully"
    Write-Info "Evidence: $($verifyResponse.data.evidenceName)"
    Write-Info "Verified: $($verifyResponse.data.isVerified)"
    Write-Info "Verified at: $($verifyResponse.data.verifiedAt)"
    
    # Step 11: Get Control Assessment with Evidence Count
    Write-TestHeader "Step 11: Verify Evidence Integration"
    $controlDetailResponse = Invoke-ApiRequest -Method GET -Uri "$baseUrl/assessments/$assessmentId/controls?groupBy=function" -Headers $headers
    
    $control = $controlDetailResponse.data.functions[0].categories[0].controls[0]
    Write-Success "Retrieved control assessment with evidence count"
    Write-Info "Control: $($control.controlCode) - $($control.controlName)"
    Write-Info "Evidence Count: $($control.evidence_count)"
    Write-Info "Status: $($control.implementationStatus)"
    Write-Info "Score: $($control.complianceScore)"
    
    # Get evidence list to show attachments
    $evidenceAttached = Invoke-ApiRequest -Method GET -Uri "$baseUrl/evidence?controlAssessmentId=$controlAssessmentId" -Headers $headers
    
    Write-Info ""
    Write-Info "Evidence attached to this control:"
    foreach ($evidence in $evidenceAttached.data.evidence) {
        Write-Host "  - $($evidence.evidenceName) [$($evidence.qualityRating)]" -ForegroundColor White
        Write-Host "    Verified: $($evidence.isVerified) | Size: $($evidence.fileSizeFormatted)" -ForegroundColor Gray
    }
    
    # Step 12: Delete Evidence
    Write-TestHeader "Step 12: Delete Evidence"
    $deleteId = $evidenceIds[2]
    
    Write-Info "Deleting evidence ID $deleteId..."
    $deleteResponse = Invoke-ApiRequest -Method DELETE -Uri "$baseUrl/evidence/$deleteId" -Headers $headers
    
    Write-Success "Evidence deleted successfully"
    Write-Info "Deleted: $($deleteResponse.data.evidenceName)"
    
    # Verify deletion
    $finalListResponse = Invoke-ApiRequest -Method GET -Uri "$baseUrl/evidence?controlAssessmentId=$controlAssessmentId" -Headers $headers
    Write-Info "Remaining evidence files: $($finalListResponse.data.totalEvidence)"
    
    # Test Complete
    Write-TestHeader "TESTING COMPLETE"
    Write-Success "All evidence management tests passed!"
    Write-Info ""
    Write-Info "Summary:"
    Write-Info "[OK] Authentication successful"
    Write-Info "[OK] Assessment created (ID: $assessmentId)"
    Write-Info "[OK] Control assessment created (ID: $controlAssessmentId)"
    Write-Info "[OK] 3 evidence files uploaded"
    Write-Info "[OK] Evidence list retrieved with statistics"
    Write-Info "[OK] Evidence details retrieved"
    Write-Info "[OK] Evidence file downloaded"
    Write-Info "[OK] Evidence metadata updated"
    Write-Info "[OK] Evidence verified by admin"
    Write-Info "[OK] Evidence count integrated with control assessments"
    Write-Info "[OK] Evidence deleted successfully"
    Write-Info ""
    Write-Info "Final state:"
    Write-Info "  - Evidence files remaining: $($finalListResponse.data.totalEvidence)"
    Write-Info "  - Verified evidence: $($finalListResponse.data.statistics.verifiedCount)"
    Write-Info "  - Total evidence size: $($finalListResponse.data.statistics.totalSizeFormatted)"
    
}
catch {
    Write-ErrorMsg "Test failed: $($_.Exception.Message)"
    exit 1
}
finally {
    # Cleanup
    Write-TestHeader "Cleanup"
    Remove-TestFiles
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Evidence workflow testing completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
