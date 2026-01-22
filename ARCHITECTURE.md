# Dual-Frontend Compliance Platform Architecture

## Overview

The Compliance Platform has been redesigned as a **monorepo with dual-frontend architecture** to support both SharePoint integration and standalone deployment.

```
┌─────────────────────────────────────────────────────────────┐
│                 @compliance/shared-components                │
│        (React Components, Business Logic, Utilities)         │
│   • UI Components  • Forms  • Charts  • Validation  • Utils │
└─────────────────────────────────────────────────────────────┘
                    ↙                              ↘
    ┌──────────────────────────┐      ┌──────────────────────────┐
    │   FRONTEND 1: SPFx       │      │  FRONTEND 2: Standalone  │
    │   (SharePoint)           │      │  (React SPA)             │
    ├──────────────────────────┤      ├──────────────────────────┤
    │ • SPFx Web Parts         │      │ • React Router           │
    │ • Fluent UI              │      │ • Fluent UI              │
    │ • SharePoint Context     │      │ • Authentication (SSO)   │
    │ • Workbench Testing      │      │ • Standalone Routing     │
    └──────────────────────────┘      └──────────────────────────┘
                ↓                                   ↓
    ┌──────────────────────────┐      ┌──────────────────────────┐
    │  DATA LAYER 1:           │      │  DATA LAYER 2:           │
    │  SharePoint Integration  │      │  REST API Backend        │
    ├──────────────────────────┤      ├──────────────────────────┤
    │ • SharePoint Lists       │      │ • Node.js + Express      │
    │ • Document Libraries     │      │ • PostgreSQL Database    │
    │ • PnP/SP API             │      │ • JWT Authentication     │
    │ • Tenant Isolation       │      │ • Multi-tenancy          │
    └──────────────────────────┘      └──────────────────────────┘
```

## Monorepo Structure

```
compliance-platform/
├── package.json                          # Root workspace configuration
├── pnpm-workspace.yaml                   # PNPM workspace definition
├── .npmrc                                # NPM configuration
├── README.md                             # Main documentation
├── ARCHITECTURE.md                       # This file
├── SYSTEM_DOCUMENTATION.md               # Legacy system docs
│
├── packages/
│   ├── shared-components/                # Shared React component library
│   │   ├── src/
│   │   │   ├── components/              # Reusable UI components
│   │   │   │   ├── assessments/        # Assessment components
│   │   │   │   ├── threats/            # Threat modeling components
│   │   │   │   ├── evidence/           # Evidence management
│   │   │   │   └── common/             # Common UI (tables, chips, etc.)
│   │   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── utils/                   # Utility functions
│   │   │   ├── constants/               # Shared constants
│   │   │   ├── api/                     # API adapter abstractions
│   │   │   │   ├── adapterFactory.js   # Factory for API adapters
│   │   │   │   ├── restAdapter.js      # REST API implementation
│   │   │   │   └── sharepointAdapter.js # SharePoint API implementation
│   │   │   └── index.js                 # Main exports
│   │   ├── package.json                 # @compliance/shared-components
│   │   ├── rollup.config.js             # Build configuration
│   │   └── README.md
│   │
│   ├── frontend-spfx/                    # SharePoint Framework frontend
│   │   ├── src/
│   │   │   ├── webparts/                # SPFx Web Parts
│   │   │   │   ├── assessmentViewer/   # Assessment management web part
│   │   │   │   ├── threatModeling/     # Threat modeling web part
│   │   │   │   ├── evidenceManager/    # Evidence management web part
│   │   │   │   └── complianceReports/  # Reports web part
│   │   │   └── common/                  # SharePoint-specific utilities
│   │   ├── config/
│   │   │   ├── package-solution.json    # SPFx package configuration
│   │   │   └── deploy-azure-storage.json
│   │   ├── sharepoint/                  # SharePoint assets
│   │   │   └── assets/
│   │   ├── package.json                 # @compliance/frontend-spfx
│   │   ├── gulpfile.js                  # SPFx build tasks
│   │   └── README.md
│   │
│   ├── frontend-standalone/              # Standalone React SPA
│   │   ├── src/
│   │   │   ├── pages/                   # Page components
│   │   │   ├── components/              # Page-specific components
│   │   │   ├── api/                     # REST API clients
│   │   │   ├── store/                   # Zustand state management
│   │   │   ├── App.jsx                  # Main app component
│   │   │   └── main.jsx                 # Entry point
│   │   ├── public/
│   │   ├── package.json                 # @compliance/frontend-standalone
│   │   ├── vite.config.js               # Vite configuration
│   │   └── README.md
│   │
│   └── backend/                          # Node.js REST API backend
│       ├── src/
│       │   ├── controllers/             # Request handlers
│       │   ├── models/                  # Data models
│       │   ├── routes/                  # API routes
│       │   ├── middleware/              # Express middleware
│       │   ├── utils/                   # Utilities
│       │   ├── config/                  # Configuration
│       │   │   ├── database.js
│       │   │   ├── migrations/
│       │   │   └── seeds/
│       │   └── server.js                # Entry point
│       ├── tests/
│       ├── package.json                 # @compliance/backend
│       └── README.md
```

## Package Details

### @compliance/shared-components

**Purpose**: Shared React component library used by both frontends

**Key Exports**:
- `AssessmentCard` - Assessment display component
- `ControlAssessmentModal` - Control evaluation dialog
- `ThreatModelCard` - Threat model display
- `EvidenceCard` - Evidence display
- `DataTable` - Generic data table
- `StatusChip` - Status indicators
- `createApiAdapter()` - API adapter factory
- `useAssessments()` - Assessment hook
- `useThreats()` - Threat modeling hook

**Build Output**: ES modules and CommonJS bundles in `dist/`

**Dependencies**: React, MUI, Emotion (peer dependencies)

### @compliance/frontend-spfx

**Purpose**: SharePoint Framework web parts for enterprise integration

**Web Parts**:
1. **Assessment Viewer** - View and manage compliance assessments
2. **Threat Modeling** - STRIDE analysis and threat management
3. **Evidence Manager** - Upload and manage evidence documents
4. **Compliance Reports** - Generate and view compliance reports

**Data Storage**:
- SharePoint Lists for structured data (assessments, threats)
- Document Libraries for evidence files
- Tenant-isolated (each SharePoint tenant has own data)

**Authentication**: Integrated with SharePoint authentication

**Deployment**: `.sppkg` package deployed to SharePoint App Catalog

### @compliance/frontend-standalone

**Purpose**: Standalone React SPA for independent deployment

**Features**:
- React Router for navigation
- Zustand for state management
- Material-UI theming
- Vite for build/dev server
- SSO authentication (planned)

**Data Source**: REST API backend (`@compliance/backend`)

**Deployment**: Static files served by CDN or web server

### @compliance/backend

**Purpose**: Node.js REST API backend for standalone frontend

**Technology Stack**:
- Node.js 18+
- Express 4.x
- PostgreSQL 18.x
- JWT authentication (planned)

**Features**:
- RESTful API endpoints
- Multi-tenancy support (planned)
- Evidence file storage
- PDF report generation
- Database migrations

**Deployment**: Containerized or traditional server deployment

## API Adapter Pattern

Both frontends use the same UI components but different data sources through the **Adapter Pattern**:

### REST Adapter (Frontend 2)
```javascript
import { createApiAdapter } from '@compliance/shared-components';

const api = createApiAdapter('rest', {
  baseURL: 'https://api.example.com'
});

const assessments = await api.getAssessments();
```

### SharePoint Adapter (Frontend 1)
```javascript
import { createApiAdapter } from '@compliance/shared-components';

const api = createApiAdapter('sharepoint', {
  context: this.context  // SPFx context
});

const assessments = await api.getAssessments();
```

## Data Models

### Frontend 1: SharePoint Lists

**Assessments List**:
- Title (Single line text)
- Description (Multiple lines text)
- Framework (Choice: NIST CSF 2.0)
- Status (Choice: In Progress, Completed, Draft)
- OrganizationName (Single line text)
- CreatedBy (Person)
- CompletedDate (Date)

**ControlAssessments List**:
- AssessmentID (Lookup to Assessments)
- SubcategoryID (Single line text)
- Status (Choice: fully_implemented, largely_implemented, partially_implemented, not_implemented, not_applicable)
- Notes (Multiple lines text)
- Rationale (Multiple lines text)

**ThreatModels List**:
- Title (Single line text)
- Description (Multiple lines text)
- AssetType (Choice)
- Status (Choice)
- CreatedDate (Date)

**Evidence Library** (Document Library):
- Standard document library with custom columns
- AssessmentID (Lookup)
- ControlID (Single line text)
- EvidenceType (Choice)

### Frontend 2: PostgreSQL Database

See existing schema in `packages/backend/src/config/migrations/`

## Development Workflow

### Initial Setup

```bash
# Install dependencies for all packages
pnpm install

# Build shared components
pnpm build:shared
```

### Development Mode

```bash
# Run backend + standalone frontend
pnpm dev

# Or run individually
pnpm dev:backend        # Start Node.js API server
pnpm dev:frontend       # Start Vite dev server
pnpm dev:spfx          # Start SPFx workbench
```

### Building

```bash
# Build all packages
pnpm build

# Build individually
pnpm build:shared       # Build component library
pnpm build:frontend     # Build standalone frontend
pnpm build:spfx        # Build SharePoint package
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific package
pnpm --filter @compliance/backend test
pnpm --filter @compliance/shared-components test
```

## Deployment Strategies

### Frontend 1 (SharePoint)

1. **Build SPFx Package**:
   ```bash
   cd packages/frontend-spfx
   gulp bundle --ship
   gulp package-solution --ship
   ```

2. **Deploy to SharePoint**:
   - Upload `.sppkg` to SharePoint App Catalog
   - Install app on target SharePoint sites
   - Add web parts to SharePoint pages

3. **Data Setup**:
   - Lists are created automatically on first use
   - Or use PnP provisioning template

### Frontend 2 (Standalone)

1. **Build Frontend**:
   ```bash
   cd packages/frontend-standalone
   pnpm build
   ```

2. **Deploy Static Files**:
   - Upload `dist/` to CDN (e.g., Azure CDN, AWS CloudFront)
   - Or serve via Nginx/Apache

3. **Deploy Backend**:
   ```bash
   cd packages/backend
   docker build -t compliance-api .
   docker run -p 3000:3000 compliance-api
   ```
   - Or deploy to Azure App Service, AWS ECS, etc.

4. **Database Setup**:
   ```bash
   npm run migrate
   npm run seed
   ```

## Migration from Legacy Structure

The platform was refactored from:
```
compliance-platform-backend/
compliance-platform-frontend/
```

To monorepo structure. Changes:
1. Created `packages/` directory
2. Moved projects with scoped names (`@compliance/*`)
3. Created shared component library
4. Set up PNPM workspaces

## Benefits

### Code Reusability
- Single component library for both frontends
- Shared business logic and validation
- Consistent UI/UX across deployments

### Flexibility
- Deploy to SharePoint for enterprise integration
- Deploy standalone for independent use
- Both use same proven components

### Maintainability
- Changes to shared components benefit both frontends
- Centralized testing and CI/CD
- Easier to keep frontends in sync

### Team Efficiency
- Frontend developers work in shared-components
- SharePoint specialists focus on SPFx integration
- Backend team independent of frontend choice

## Future Enhancements

1. **SSO Integration** for standalone frontend (Azure AD, Okta)
2. **Multi-tenancy** support in backend
3. **Real-time updates** via WebSockets
4. **Mobile apps** using shared-components
5. **Desktop app** via Electron
6. **Teams integration** as Teams app

## Technology Versions

- Node.js: 18.x or higher
- PNPM: 8.x or higher
- React: 19.x
- SharePoint Framework: 1.18.x
- PostgreSQL: 18.x

## References

- [SharePoint Framework Documentation](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [Monorepo Best Practices](https://monorepo.tools/)
- [PNPM Workspaces](https://pnpm.io/workspaces)
