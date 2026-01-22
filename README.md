# Cybersecurity Compliance Platform

A comprehensive enterprise-grade **dual-frontend compliance platform** with SharePoint integration and standalone deployment options.

## 🏗️ Architecture

This is a **monorepo** containing:
- **Shared Component Library** - Reusable React components
- **Frontend 1 (SPFx)** - SharePoint Framework web parts
- **Frontend 2 (Standalone)** - React SPA with REST API
- **Backend API** - Node.js + Express + PostgreSQL

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## Project Structure

```
compliance-platform/
├── packages/
│   ├── shared-components/          # Shared React component library
│   ├── frontend-spfx/              # SharePoint Framework (coming soon)
│   ├── frontend-standalone/        # Standalone React SPA
│   └── backend/                    # REST API (Node.js + Express + PostgreSQL)
├── package.json                    # Monorepo root configuration
├── pnpm-workspace.yaml             # PNPM workspace definition
├── ARCHITECTURE.md                 # Detailed architecture docs
└── README.md                       # This file
```

## Features

### ✅ Shared Components
- Assessment management components
- Threat modeling components
- Evidence management components
- API adapter pattern (REST + SharePoint)
- Common UI components

### ✅ Standalone Frontend (Complete)
- Modern React SPA with Material-UI
- NIST Cybersecurity Framework management
- STRIDE threat modeling interface
- Evidence upload and management
- Interactive dashboards and visualizations
- PDF report generation

### ✅ Backend (Complete)
- JWT authentication & authorization
- NIST Cybersecurity Framework (5 functions, 23 categories, 108 controls)
- STRIDE threat modeling with risk scoring
- Evidence management with file upload
- PDF report generation (Compliance & Threat reports)
- 60+ RESTful API endpoints with full documentation

### 🚧 SharePoint Frontend (Coming Soon)
- SPFx web parts for SharePoint Online
- SharePoint list integration
- Document library for evidence
- Tenant-isolated data storage

## Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- PNPM 8+ (`npm install -g pnpm`)
- PostgreSQL 18+ ([Download](https://www.postgresql.org/download/))

### Installation

```bash
# Clone repository
git clone https://github.com/KulbirJ/compliance-platform.git
cd compliance-platform

# Install all dependencies
pnpm install

# Build shared components
pnpm build:shared
```

### Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE compliance_platform;"

# Run migrations
cd packages/backend
psql -U postgres -d compliance_platform -f src/config/migrations/001_initial_schema.sql

# Seed initial data
node src/config/seed.js
```

### Running the Application

```bash
# From monorepo root

# Run backend + frontend in development mode
pnpm dev

# Or run individually:
pnpm dev:backend        # Backend at http://localhost:3000
pnpm dev:frontend       # Frontend at http://localhost:5173
pnpm dev:spfx          # SPFx workbench (when available)
```

### Building for Production

```bash
# Build all packages
pnpm build

# Or build individually:
pnpm build:shared       # Build component library
pnpm build:backend      # Build backend
pnpm build:frontend     # Build standalone frontend
pnpm build:spfx        # Build SharePoint package
```

**Default credentials**: admin@example.com / admin123 (MVP: authentication bypassed)

## Technology Stack

**Shared Components**:
- React 19.x
- Material-UI 7.x
- Rollup bundler

**Frontend (Standalone)**:
- React 19.x + Vite 7.x
- Material-UI 7.x + Emotion
- React Router 7.x
- Zustand 5.x (state management)
- Axios for API calls

**Frontend (SharePoint)** (Coming Soon):
- SharePoint Framework 1.18.x
- Fluent UI (React)
- PnP/SP for SharePoint API
- TypeScript

**Backend**:
- Node.js 24.x + Express 4.18
- PostgreSQL 18.1
- JWT + bcrypt (planned SSO)
- PDFKit for reports
- Multer for file uploads

## Package Documentation

- [Shared Components](packages/shared-components/README.md) - Component library documentation
- [Standalone Frontend](packages/frontend-standalone/README.md) - React SPA documentation
- [Backend API](packages/backend/README.md) - REST API documentation
- [Architecture](ARCHITECTURE.md) - Detailed architecture guide

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
