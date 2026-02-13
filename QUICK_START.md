# Quick Start Guide

## Backend Server

### Start Backend
```bash
cd compliance-platform-backend
npm start
```

Server runs at: `http://localhost:3000`

### Test Backend
```bash
# Health check
curl http://localhost:3000/api/health

# Or with PowerShell
Invoke-RestMethod http://localhost:3000/api/health
```

### Default Login (Ofcourse you will change these creds and use some sort of secrets manager. )
- **Email**: admin@example.com
- **Password**: admin123

### Run Tests
```bash
cd compliance-platform-backend
npm test

# Or individual test scripts
.\test-auth.ps1
.\test-assessment-workflow.ps1
.\test-evidence-workflow.ps1
.\test-threat-modeling.ps1
```

## Frontend (Coming Soon)

Frontend setup instructions will be added once the framework is chosen.

## Useful Commands

### Backend
```bash
# Install dependencies
cd compliance-platform-backend && npm install

# Start dev server
npm run dev

# Run linter
npm run lint

# Seed database
node src/config/seed.js
```

### Database
```bash
# Create database
psql -U postgres -c "CREATE DATABASE compliance_platform;"

# Run migrations
psql -U postgres -d compliance_platform -f compliance-platform-backend/src/config/migrations/001_initial_schema.sql

# Connect to database
psql -U postgres -d compliance_platform
```

## Documentation

- [Project README](README.md) - Overview
- [Backend README](compliance-platform-backend/README.md) - Complete backend documentation
- [API Testing Guide](compliance-platform-backend/API_TESTING.md) - API examples
- [Assessment Testing](compliance-platform-backend/ASSESSMENT_TESTING.md) - Assessment workflows
- [Evidence Testing](compliance-platform-backend/EVIDENCE_TESTING.md) - File management
- [Threat Modeling](compliance-platform-backend/THREAT_MODELING_TESTING.md) - STRIDE guide
- [Report Generation](compliance-platform-backend/REPORT_TESTING.md) - PDF reports

## Troubleshooting

### Port Already in Use
```bash
# Windows PowerShell
Get-Process -Name node | Stop-Process -Force

# Find process on port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Database Connection Issues
1. Check PostgreSQL is running: `pg_ctl status`
2. Verify `.env` credentials in `compliance-platform-backend/.env`
3. Ensure database exists: `psql -U postgres -l`

### Module Not Found
```bash
cd compliance-platform-backend
npm install
```

## API Endpoints Quick Reference

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Assessments
- `GET /api/assessments`
- `POST /api/assessments`
- `POST /api/assessments/:id/controls`

### Evidence
- `POST /api/evidence/upload`
- `GET /api/evidence/:id/download`

### Threat Models
- `POST /api/threat-models`
- `POST /api/threat-models/:id/threats`

### Reports
- `POST /api/reports/compliance`
- `POST /api/reports/threat`
- `GET /api/reports/compliance/:id/download`

See backend documentation for complete API reference.
