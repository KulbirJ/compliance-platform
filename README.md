# Cybersecurity Compliance Platform

A comprehensive enterprise-grade platform for cybersecurity compliance management and threat modeling.

## Project Structure

```
compliance-platform/
├── compliance-platform-backend/    # REST API (Node.js + Express + PostgreSQL)
│   ├── src/                        # Backend source code
│   ├── tests/                      # API test suites
│   └── README.md                   # Backend documentation
├── compliance-platform-frontend/   # Web UI (Coming soon)
└── README.md                       # This file
```

## Features

### ✅ Backend (Complete)
- JWT authentication & authorization
- NIST Cybersecurity Framework (5 functions, 23 categories, 108 controls)
- STRIDE threat modeling with risk scoring
- Evidence management with file upload
- PDF report generation (Compliance & Threat reports)
- 60+ RESTful API endpoints with full documentation

### 🚧 Frontend (Next Phase)
- Modern web UI
- Interactive dashboards
- Compliance visualization
- Threat modeling interface

## Quick Start

### Backend Setup

```bash
cd compliance-platform-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Setup PostgreSQL database
psql -U postgres -c "CREATE DATABASE compliance_platform;"
psql -U postgres -d compliance_platform -f src/config/migrations/001_initial_schema.sql

# Seed initial data
node src/config/seed.js

# Start server
npm start
```

Server runs at `http://localhost:3000`

**Default credentials**: admin@example.com / admin123

## Technology Stack

**Backend**:
- Node.js v24 + Express 4.18
- PostgreSQL 18.1
- JWT + bcrypt
- PDFKit for reports
- Multer for file uploads

**Frontend** (Coming): React/Vue/Angular (TBD)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile

### Assessments
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment
- `POST /api/assessments/:id/controls` - Assess control

### Evidence
- `POST /api/evidence/upload` - Upload file
- `GET /api/evidence/:id/download` - Download file

### Threat Modeling
- `POST /api/threat-models` - Create model
- `POST /api/threat-models/:id/threats` - Add threat

### Reports
- `POST /api/reports/compliance` - Generate compliance PDF
- `POST /api/reports/threat` - Generate threat PDF

**Full documentation**: See `/compliance-platform-backend/*_TESTING.md` files

## Testing

```bash
cd compliance-platform-backend

# Run test suites
npm test

# Test workflows with PowerShell scripts
.\test-auth.ps1
.\test-assessment-workflow.ps1
.\test-evidence-workflow.ps1
.\test-threat-modeling.ps1
```

## Development Roadmap

- [x] **Phase 1**: Backend API (Complete)
- [ ] **Phase 2**: Frontend application (Next)
- [ ] **Phase 3**: Analytics & notifications
- [ ] **Phase 4**: Enterprise features (SSO, integrations)

## Documentation

- [Backend README](compliance-platform-backend/README.md) - Complete backend docs
- [API Testing](compliance-platform-backend/API_TESTING.md) - API guide
- [Assessment Testing](compliance-platform-backend/ASSESSMENT_TESTING.md) - Workflow examples
- [Evidence Testing](compliance-platform-backend/EVIDENCE_TESTING.md) - File management
- [Threat Modeling](compliance-platform-backend/THREAT_MODELING_TESTING.md) - STRIDE guide
- [Report Generation](compliance-platform-backend/REPORT_TESTING.md) - PDF reports

## License

ISC

---

**Status**: Backend Complete ✅ | Frontend Starting 🚀

**Last Updated**: January 16, 2026
