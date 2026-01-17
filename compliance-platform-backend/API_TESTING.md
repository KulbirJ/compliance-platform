# Testing the Compliance Platform API

## Server Information
- **Base URL**: http://localhost:3000
- **API Base Path**: /api

## Pre-existing Admin User
- **Username**: admin
- **Password**: admin123
- **Email**: admin@example.com

---

## 🧪 Testing with cURL

### 1. Register a New User

**Windows PowerShell:**
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    username = "johndoe"
    email = "john@example.com"
    password = "Test123456"
    fullName = "John Doe"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Headers $headers -Body $body
```

**Linux/Mac/Git Bash:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Test123456",
    "fullName": "John Doe"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInVzZXJuYW1lIjoiam9obmRvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE3MzcwMDAwMDAsImV4cCI6MTczNzA4NjQwMH0.xxx",
    "user": {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "isActive": true,
      "isAdmin": false,
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  }
}
```

**Validation Errors (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
  ]
}
```

---

### 2. Login with User

**Windows PowerShell:**
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    email = "john@example.com"
    password = "Test123456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers $headers -Body $body
$response

# Save the token for next requests
$token = $response.data.token
Write-Host "Token saved to `$token variable" -ForegroundColor Green
```

**Alternative - Login with username:**
```powershell
$body = @{
    username = "johndoe"
    password = "Test123456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers $headers -Body $body
```

**Linux/Mac/Git Bash:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Test123456"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInVzZXJuYW1lIjoiam9obmRvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE3MzcwMDAwMDAsImV4cCI6MTczNzA4NjQwMH0.xxx",
    "user": {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "isActive": true,
      "isAdmin": false,
      "lastLogin": "2026-01-15T10:35:00.000Z"
    }
  }
}
```

**Invalid Credentials (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 3. Get Current User Profile (Protected Route)

**Windows PowerShell:**
```powershell
# Use the token from login
$headers = @{ 
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers $headers
```

**Linux/Mac/Git Bash:**
```bash
# Replace YOUR_TOKEN_HERE with actual token from login
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "isActive": true,
    "isAdmin": false,
    "lastLogin": "2026-01-15T10:35:00.000Z",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:35:00.000Z"
  }
}
```

**No Token Provided (401):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**Invalid/Expired Token (401):**
```json
{
  "success": false,
  "message": "Token expired"
}
```

---

## 🔗 Complete PowerShell Test Flow

```powershell
# 1. Register
Write-Host "`n=== REGISTERING NEW USER ===" -ForegroundColor Yellow
$registerBody = @{
    username = "testuser"
    email = "test@example.com"
    password = "Secure123"
    fullName = "Test User"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $registerBody

Write-Host "✓ Registered: $($registerResponse.data.user.username)" -ForegroundColor Green

# 2. Login
Write-Host "`n=== LOGGING IN ===" -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "Secure123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$token = $loginResponse.data.token
Write-Host "✓ Login successful" -ForegroundColor Green
Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Cyan

# 3. Get Profile
Write-Host "`n=== GETTING PROFILE ===" -ForegroundColor Yellow
$headers = @{ "Authorization" = "Bearer $token" }

$profileResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" `
    -Method GET `
    -Headers $headers

Write-Host "✓ Profile retrieved" -ForegroundColor Green
Write-Host "User: $($profileResponse.data.fullName)" -ForegroundColor Cyan
Write-Host "Email: $($profileResponse.data.email)" -ForegroundColor Cyan
Write-Host "Admin: $($profileResponse.data.isAdmin)" -ForegroundColor Cyan
```

---

## 📬 Testing with Postman

### Initial Setup

1. **Download Postman**: https://www.postman.com/downloads/
2. **Create a new Collection**: "Compliance Platform API"
3. **Set Base URL Variable**:
   - Click on Collection → Variables
   - Variable: `baseUrl`
   - Value: `http://localhost:3000`

### Request 1: Register User

1. **Create New Request** → Name: "Register User"
2. **Method**: `POST`
3. **URL**: `{{baseUrl}}/api/auth/register`
4. **Headers**:
   - Key: `Content-Type`
   - Value: `application/json`
5. **Body** → Select `raw` → `JSON`:
```json
{
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "Secure123",
  "fullName": "Jane Doe"
}
```
6. **Click Send**
7. **Save Token**: In "Tests" tab, add this script to auto-save token:
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.collectionVariables.set("authToken", jsonData.data.token);
}
```

### Request 2: Login User

1. **Create New Request** → Name: "Login User"
2. **Method**: `POST`
3. **URL**: `{{baseUrl}}/api/auth/login`
4. **Headers**:
   - Key: `Content-Type`
   - Value: `application/json`
5. **Body** → Select `raw` → `JSON`:
```json
{
  "email": "jane@example.com",
  "password": "Secure123"
}
```
6. **Tests** tab (auto-save token):
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.collectionVariables.set("authToken", jsonData.data.token);
    console.log("Token saved:", jsonData.data.token);
}
```
7. **Click Send**

### Request 3: Get Current User

1. **Create New Request** → Name: "Get Current User"
2. **Method**: `GET`
3. **URL**: `{{baseUrl}}/api/auth/me`
4. **Authorization** tab:
   - Type: `Bearer Token`
   - Token: `{{authToken}}`
   
   **OR** in **Headers** tab:
   - Key: `Authorization`
   - Value: `Bearer {{authToken}}`
5. **Click Send**

### Postman Environment Variables

Add to Collection Variables:
- `baseUrl`: `http://localhost:3000`
- `authToken`: (auto-populated by login/register tests)

### Testing Different Scenarios

**Test Invalid Password:**
```json
{
  "email": "jane@example.com",
  "password": "wrong"
}
```

**Test Validation Errors:**
```json
{
  "username": "ab",
  "email": "invalid-email",
  "password": "weak"
}
```

**Test Without Token:**
- Remove Authorization header and call `/api/auth/me`

---

## 🎯 Quick Test Commands

### Test with Admin User (Pre-existing)

**PowerShell:**
```powershell
# Login as admin
$loginBody = @{ username = "admin"; password = "admin123" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.data.token

# Get profile
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers $headers
```

### Test Health Endpoint

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
```

**cURL:**
```bash
curl http://localhost:3000/api/health
```

---

## 📊 HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Successful login or profile retrieval |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Validation errors (missing fields, invalid format) |
| 401 | Unauthorized | Invalid credentials or missing/invalid token |
| 403 | Forbidden | Account deactivated |
| 404 | Not Found | User not found |
| 409 | Conflict | Email or username already exists |
| 500 | Server Error | Database or server error |

---

## 🔐 Password Requirements

- Minimum 6 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

## 🔑 JWT Token Information

- **Expiration**: 24 hours
- **Algorithm**: HS256
- **Payload includes**: userId, username, email, isAdmin
- **Usage**: Include in `Authorization` header as `Bearer <token>`

---

## 🐛 Common Issues

**"Unable to connect to the remote server"**
- Ensure server is running: `npm start` or `npm run dev`
- Check if port 3000 is available

**"Invalid credentials"**
- Verify username/email and password
- Check if user exists in database

**"Token expired"**
- Login again to get a new token
- Tokens expire after 24 hours

**Validation errors**
- Check password meets requirements
- Verify email format is valid
- Username must be 3-50 characters

### 1. Login with Admin User

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**PowerShell:**
```powershell
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$response
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "organizations": [...]
    }
  }
}
```

### 2. Get User Profile (Protected Route)

First, save the token from login response, then:

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**PowerShell:**
```powershell
# Save token from login
$token = $response.data.token

# Get profile
$headers = @{
    "Authorization" = "Bearer $token"
}
$profile = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" -Method GET -Headers $headers
$profile
```

### 3. Register New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"test123\",\"firstName\":\"Test\",\"lastName\":\"User\",\"organizationName\":\"Test Org\"}"
```

**PowerShell:**
```powershell
$registerBody = @{
    username = "testuser"
    email = "test@example.com"
    password = "test123"
    firstName = "Test"
    lastName = "User"
    organizationName = "Test Org"
} | ConvertTo-Json

$newUser = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
$newUser
```

## Available Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/register` | User registration | No |
| GET | `/api/auth/profile` | Get user profile | Yes |

## Quick Test Script (PowerShell)

Save this as `test-api.ps1`:

```powershell
# Test Login
Write-Host "Testing Login..." -ForegroundColor Green
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "User: $($response.data.user.username)" -ForegroundColor Cyan
    Write-Host "Email: $($response.data.user.email)" -ForegroundColor Cyan
    Write-Host "Role: $($response.data.user.role)" -ForegroundColor Cyan
    
    # Save token
    $token = $response.data.token
    Write-Host "`nToken: $($token.Substring(0, 50))..." -ForegroundColor Yellow
    
    # Test Profile
    Write-Host "`nTesting Profile Endpoint..." -ForegroundColor Green
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $profile = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" -Method GET -Headers $headers
    Write-Host "✓ Profile retrieved successfully!" -ForegroundColor Green
    Write-Host "Organizations: $($profile.data.organizations.Count)" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}
```

Run with: `.\test-api.ps1`
