# Compliance Platform - System Documentation

## Overview
The Compliance Platform is a full-stack web application designed to help organizations manage cybersecurity compliance assessments, threat modeling, evidence collection, and reporting. The system implements NIST Cybersecurity Framework (CSF) controls and STRIDE threat modeling methodology.

---

## Backend Architecture

### Technology Stack
- **Runtime**: Node.js v24.13.0
- **Framework**: Express.js 4.18.2
- **Database**: PostgreSQL 18.1
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **PDF Generation**: PDFKit
- **File Uploads**: Multer

### Backend Structure

#### 1. **Server Configuration** (`src/server.js`, `src/app.js`)
- **Purpose**: Application entry point and Express app configuration
- **Functions**:
  - Initializes Express server
  - Configures middleware (CORS, body parser, file uploads)
  - Sets up error handling
  - Connects to PostgreSQL database
  - Starts server on port 3000

#### 2. **Database Layer** (`src/config/database.js`)
- **Purpose**: PostgreSQL database connection and query execution
- **Functions**:
  - Manages connection pool
  - Provides query interface for database operations
  - Handles database errors
  - Logs all SQL queries for debugging

#### 3. **Database Migrations** (`src/config/migrations/`)
- **Purpose**: Database schema version control
- **Key Migrations**:
  - `001_initial_schema.sql`: Creates base tables (users, organizations)
  - `002_compliance_assessment.sql`: Compliance assessment tables
  - `003_nist_csf_framework.sql`: NIST CSF control definitions
  - `004_threat_modeling.sql`: Threat modeling tables (STRIDE)
  - `005_compliance_reports.sql`: Reporting infrastructure
- **Tables Created**:
  - `users`: User accounts and authentication
  - `organizations`: Organization entities
  - `user_organizations`: User-organization relationships
  - `compliance_assessments`: Assessment records
  - `nist_csf_controls`: NIST CSF control library
  - `compliance_control_assessments`: Control assessment results
  - `evidence`: Evidence file metadata
  - `threat_models`: Threat model definitions
  - `assets`: System assets for threat modeling
  - `threats`: Identified threats (STRIDE)
  - `mitigations`: Threat mitigation strategies
  - `compliance_reports`: Generated compliance reports
  - `threat_reports`: Generated threat reports

#### 4. **Data Models** (`src/models/`)

**a. User Model** (`userModel.js`)
- User authentication and management
- Functions: createUser, findUserByEmail, findUserById, updateUser

**b. Assessment Model** (`assessmentModel.js`)
- Compliance assessment lifecycle
- Functions: createAssessment, getAssessmentsByOrganization, getAssessmentWithProgress, updateAssessment, deleteAssessment

**c. Control Assessment Model** (`controlAssessmentModel.js`)
- NIST CSF control evaluation
- Functions: assessControl, getControlsByAssessment, updateControlAssessment

**d. Evidence Model** (`evidenceModel.js`)
- Evidence file management
- Functions: uploadEvidence, getEvidenceByControl, deleteEvidence, getEvidenceFile

**e. NIST CSF Model** (`nistCsfModel.js`)
- NIST framework management
- Functions: getAllControls, getControlsByFunction, getControlById

**f. Threat Model** (`threatModelModel.js`)
- STRIDE threat modeling
- Functions: createThreatModel, getThreatModels, getThreatModelById, updateThreatModel

**g. Asset Model** (`assetModel.js`)
- Asset inventory for threat modeling
- Functions: createAsset, getAssets, linkAssetToThreatModel

**h. Threat Model** (`threatModel.js`)
- Threat identification and tracking
- Functions: createThreat, getThreats, updateThreat, deleteThreat

**i. Mitigation Model** (`mitigationModel.js`)
- Threat mitigation tracking
- Functions: createMitigation, getMitigations, updateMitigation

**j. Report Models** (`complianceReportModel.js`, `threatReportModel.js`)
- Report generation and storage
- Functions: generateReport, getReports, getReportById

#### 5. **Controllers** (`src/controllers/`)

**a. Authentication Controller** (`authController.js`)
- **Endpoints**:
  - `POST /api/auth/register`: User registration
  - `POST /api/auth/login`: User authentication
  - `GET /api/auth/me`: Get current user details
- **Validation**:
  - Email format validation
  - Password requirements (6+ chars, uppercase, lowercase, number)
  - Username format (alphanumeric, underscore, hyphen)

**b. Assessment Controller** (`assessmentController.js`)
- **Endpoints**:
  - `POST /api/assessments`: Create new assessment
  - `GET /api/assessments`: List all assessments
  - `GET /api/assessments/:id`: Get assessment details
  - `PUT /api/assessments/:id`: Update assessment
  - `DELETE /api/assessments/:id`: Delete assessment
- **Features**:
  - Multi-organization support
  - Progress tracking
  - Status management (draft, in_progress, under_review, completed, archived)

**c. Control Assessment Controller** (`controlAssessmentController.js`)
- **Endpoints**:
  - `POST /api/assessments/:id/controls/:controlId/assess`: Assess control
  - `GET /api/assessments/:id/controls`: Get all control assessments
  - `PUT /api/controls/:id`: Update control assessment
- **Assessment Statuses**:
  - compliant, partially_compliant, non_compliant, not_applicable, not_assessed

**d. Evidence Controller** (`evidenceController.js`)
- **Endpoints**:
  - `POST /api/evidence/upload`: Upload evidence file
  - `GET /api/evidence`: List evidence
  - `GET /api/evidence/:id/download`: Download evidence file
  - `DELETE /api/evidence/:id`: Delete evidence
- **Features**:
  - File upload with validation (10MB max)
  - Evidence quality ratings (weak, medium, strong)
  - Secure file storage

**e. Threat Model Controller** (`threatModelController.js`)
- **Endpoints**:
  - `POST /api/threat-models`: Create threat model
  - `GET /api/threat-models`: List threat models
  - `GET /api/threat-models/:id`: Get threat model details
  - `PUT /api/threat-models/:id`: Update threat model
  - `DELETE /api/threat-models/:id`: Delete threat model
- **Features**:
  - STRIDE methodology support
  - Risk scoring (likelihood × impact)
  - Asset-threat mapping

**f. Report Controllers** (`complianceReportController.js`, `threatReportController.js`)
- **Endpoints**:
  - `POST /api/assessments/:id/reports`: Generate compliance report
  - `GET /api/reports/compliance`: List compliance reports
  - `GET /api/reports/compliance/:id/download`: Download report PDF
  - `POST /api/threat-models/:id/reports`: Generate threat report
  - `GET /api/reports/threat`: List threat reports
- **Features**:
  - PDF generation with charts and tables
  - Executive summaries
  - Detailed control assessments

#### 6. **Middleware** (`src/middleware/`)

**a. Authentication Middleware** (`authMiddleware.js`)
- JWT token verification
- User authentication for protected routes
- Role-based authorization (admin checks)

**b. Error Handler** (`errorHandler.js`)
- Centralized error handling
- Structured error responses
- Error logging

**c. Upload Middleware** (`uploadMiddleware.js`)
- File upload configuration with Multer
- File size limits (10MB)
- File type validation
- Secure file storage

#### 7. **Routes** (`src/routes/`)
- Organized by feature domain
- Protected routes require authentication
- RESTful API design
- Route files: authRoutes, assessmentRoutes, evidenceRoutes, reportRoutes, threatModelRoutes

#### 8. **Utilities** (`src/utils/`)

**a. Report Generator** (`complianceReportGenerator.js`)
- PDF report generation with PDFKit
- Charts and visualizations
- Compliance status summaries

**b. Threat Report Generator** (`threatReportGenerator.js`)
- Threat model PDF reports
- Risk matrices
- STRIDE category analysis

**c. Logger** (`logger.js`)
- Application logging
- Database query logging
- Error tracking

---

## Frontend Architecture

### Technology Stack
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.5
- **Routing**: React Router DOM 7.12.0
- **UI Library**: Material-UI (MUI) 7.3.7
- **State Management**: Zustand 5.0.3
- **Form Handling**: React Hook Form 7.55.0
- **HTTP Client**: Axios 1.8.2
- **File Download**: file-saver 2.0.5

### Frontend Structure

#### 1. **Application Entry** (`src/main.jsx`, `src/App.jsx`)
- **main.jsx**: React application root, theme provider setup
- **App.jsx**: Route configuration, authentication initialization
- **Features**:
  - Global theme configuration
  - Protected route wrappers
  - Authentication state management

#### 2. **Theme System** (`src/theme.js`)
- **Purpose**: Centralized Material-UI theme configuration
- **Colors**:
  - Primary: Professional Blue (#1976d2)
  - Secondary: Security Orange (#ff6f00)
- **Customizations**:
  - Typography settings
  - Component overrides (buttons, cards)
  - Consistent spacing and borders

#### 3. **State Management** (`src/store/`)

**a. Auth Store** (`authStore.js`)
- User authentication state
- Token management (localStorage)
- Login/logout operations
- User profile data
- Features:
  - Automatic token refresh
  - Session persistence
  - Loading states

**b. Assessment Store** (`assessmentStore.js`)
- Assessment list state
- Current assessment details
- NIST framework data
- Operations: fetchAssessments, fetchAssessmentById, fetchNistFramework

**c. Threat Store** (`threatStore.js`)
- Threat models list
- Current threat model
- Assets and threats data
- STRIDE categories
- Operations: fetchThreatModels, fetchAssets, fetchThreats

#### 4. **API Client Layer** (`src/api/`)

**a. API Client** (`client.js`)
- Axios instance configuration
- Request interceptors (add auth token)
- Response interceptors (handle 401 errors)
- Base URL configuration
- Global error handling

**b. API Modules**:
- `auth.js`: Authentication endpoints
- `assessments.js`: Assessment CRUD operations
- `evidence.js`: Evidence upload/download
- `reports.js`: Report generation and download
- `threats.js`: Threat modeling operations

#### 5. **Components** (`src/components/`)

**a. Authentication Components** (`components/auth/`)
- **ProtectedRoute**: Route guard for authenticated users
  - Displays loading spinner while checking auth
  - Redirects to login if not authenticated

**b. Layout Components** (`components/layout/`)
- **MainLayout**: Application shell
  - Top navigation bar
  - Sidebar navigation (mobile drawer)
  - User menu with logout
  - Responsive design
  - Navigation items: Dashboard, Assessments, Threat Models, Evidence, Reports

**c. Dashboard Components** (`components/dashboard/`)
- **StatCard**: Metric display cards
- **RecentActivity**: Activity timeline
- **QuickActions**: Action buttons for common tasks

**d. Assessment Components** (`components/assessments/`)
- **AssessmentCard**: Assessment summary card
- **ControlAssessmentModal**: Control evaluation dialog
  - Status selection (compliant, non-compliant, etc.)
  - Implementation level slider
  - Effectiveness level slider
  - Comments and remediation plans
  - Evidence attachment

**e. Evidence Components** (`components/evidence/`)
- **EvidenceUpload**: File upload component
  - Drag-and-drop interface
  - File validation (10MB max)
  - Evidence quality selection
  - Progress indicators
  - Evidence list with download/delete

**f. Threat Components** (`components/threats/`)
- **AssetManager**: Asset inventory management
  - Create new assets
  - Link existing assets
  - Asset criticality levels
- **ThreatDetailModal**: Threat details and assessment
  - STRIDE category selection
  - Likelihood slider (1-5)
  - Impact slider (1-5)
  - Risk score calculation
  - Mitigation tracking
- **MitigationForm**: Mitigation planning
  - Mitigation details
  - Status tracking
  - Residual risk assessment
  - Assignee and due dates

**g. Common Components** (`components/common/`)
- Loading spinners
- Error displays
- Empty states
- Confirmation dialogs

#### 6. **Pages** (`src/pages/`)

**a. Authentication Pages** (`pages/auth/`)
- **LoginPage**: User login
  - Email/password form
  - Remember me option
  - Error handling
- **RegisterPage**: User registration
  - Full name, username, email, password
  - Password confirmation
  - Validation feedback

**b. Dashboard Page** (`pages/dashboard/`)
- **DashboardPage**: Application home
  - Overview statistics
  - Recent assessments
  - Recent threat models
  - Quick action buttons
  - Activity feed

**c. Assessment Pages** (`pages/assessments/`)
- **AssessmentListPage**: Assessment management
  - Table view of all assessments
  - Status filters
  - Progress tracking
  - Create/Edit/Delete operations
- **AssessmentFormPage**: Assessment creation/editing
  - Assessment name and description
  - Assessment date and scope
  - Validation rules
- **AssessmentDetailPage**: Assessment details
  - Assessment overview
  - Control assessment list (by NIST function)
  - Progress statistics
  - Evidence tracking
  - Report generation

**d. Threat Modeling Pages** (`pages/threats/`)
- **ThreatModelListPage**: Threat model management
  - Table view with statistics
  - High-risk threat indicators
  - Create/Edit/Delete operations
- **ThreatModelFormPage**: Threat model creation/editing
  - Model name and description
  - Assessment date and version
  - Validation rules
- **ThreatModelDetailPage**: Threat model details
  - Risk matrix visualization (5×5)
  - Assets tab with management
  - Threats tab grouped by STRIDE
  - Statistics dashboard
  - Add assets and threats

**e. Reports Page** (`pages/reports/`)
- **ReportsPage**: Report management
  - Two tabs: Compliance and Threat Reports
  - Assessment/Threat model selection
  - Report generation
  - Report history with download
  - PDF export functionality

**f. Evidence Page** (`pages/evidence/`)
- **EvidenceList**: Evidence repository
  - Evidence file listing
  - Upload functionality
  - Download and delete operations

#### 7. **Utilities** (`src/utils/`)
- **constants.js**: Application constants
- **formatters.js**: Data formatting functions (dates, numbers)
- **validators.js**: Form validation rules

#### 8. **Routing Structure**
```
/ → /dashboard (protected)
/login (public)
/register (public)
/dashboard (protected)
/assessments (protected)
  /new
  /:id
  /:id/edit
/threat-models (protected)
  /new
  /:id
  /:id/edit
/evidence (protected)
/reports (protected)
```

---

## User Capabilities

### General Users

#### 1. **Account Management**
- Register new account with username, email, and password
- Login with email/username and password
- View profile information
- Logout from system

#### 2. **Dashboard Access**
- View system overview with key metrics
- See total assessments and threat models
- View completion statistics
- Access recent activity feed
- Quick navigation to key features

#### 3. **Compliance Assessment Management**

**Create and Manage Assessments:**
- Create new compliance assessments
- Edit assessment details (name, description, scope)
- Set assessment dates and due dates
- Track assessment status (draft, in progress, under review, completed, archived)
- Delete assessments

**Control Assessment:**
- View NIST CSF control library (Identify, Protect, Detect, Respond, Recover)
- Assess individual controls against organization implementation
- Rate implementation level (0-100%)
- Rate effectiveness level (0-100%)
- Set control status:
  - Compliant
  - Partially Compliant
  - Non-Compliant
  - Not Applicable
  - Not Assessed
- Add comments and findings
- Create remediation plans
- Attach evidence to controls

**Progress Tracking:**
- View overall assessment completion percentage
- See assessed vs. total controls
- Monitor control status distribution
- Track compliance trends

#### 4. **Evidence Management**

**Upload Evidence:**
- Upload evidence files (up to 10MB)
- Support for various file types
- Drag-and-drop interface
- Associate evidence with specific controls

**Evidence Quality Rating:**
- Rate evidence quality (weak, medium, strong)
- Add evidence descriptions
- Tag evidence with metadata

**Evidence Operations:**
- View all uploaded evidence
- Download evidence files
- Delete evidence files
- Track evidence usage across assessments

#### 5. **Threat Modeling (STRIDE Methodology)**

**Create Threat Models:**
- Create new threat models for systems/applications
- Define model name, description, and version
- Set assessment dates
- Track model status

**Asset Management:**
- Create system assets
- Define asset types (server, database, API, web app, mobile app, network, etc.)
- Set asset criticality (low, medium, high, critical)
- Link assets to threat models
- View asset inventory

**Threat Identification:**
- Identify threats using STRIDE categories:
  - **S**poofing: Identity theft, authentication bypass
  - **T**ampering: Data modification, malicious code injection
  - **R**epudiation: Denial of actions, log tampering
  - **I**nformation Disclosure: Data leaks, unauthorized access
  - **D**enial of Service: System unavailability, resource exhaustion
  - **E**levation of Privilege: Unauthorized access escalation
- Rate threat likelihood (1-5)
- Rate threat impact (1-5)
- Automatic risk score calculation (likelihood × impact)
- Risk level classification (low, medium, high, critical)
- Add threat descriptions and scenarios
- Link threats to affected assets

**Mitigation Planning:**
- Create mitigation strategies for threats
- Define mitigation approaches
- Set mitigation status (planned, in progress, completed, deferred, cancelled)
- Assign mitigation owners
- Set target completion dates
- Track residual risk after mitigation
- Monitor mitigation effectiveness

**Risk Analysis:**
- View 5×5 risk matrix visualization
- Filter threats by STRIDE category
- View high-risk and critical threats
- Analyze risk distribution
- Track risk trends over time

#### 6. **Reporting**

**Compliance Reports:**
- Generate comprehensive compliance reports
- Select assessment for reporting
- Automated report generation with:
  - Executive summary
  - Assessment overview
  - Control assessment results by function
  - Compliance statistics
  - Findings and recommendations
  - Evidence references
- Download reports as PDF
- View report generation history
- Re-download existing reports

**Threat Reports:**
- Generate threat modeling reports
- Select threat model for reporting  
- Automated report generation with:
  - Threat model overview
  - Asset inventory
  - Threat analysis by STRIDE
  - Risk matrix
  - Mitigation strategies
  - Residual risk assessment
- Download reports as PDF
- Access report history

#### 7. **Search and Filter**
- Filter assessments by status
- Search threat models
- Filter threats by STRIDE category
- Filter threats by risk level
- Sort data by various criteria

#### 8. **Collaboration Features**
- View creator information on assessments
- Track creation and modification dates
- See last login information
- Organization-based access control

### Administrative Users

**All General User Capabilities PLUS:**

#### 9. **User Management**
- View all registered users
- Manage user accounts
- Assign user roles
- Deactivate/activate accounts
- View user activity logs

#### 10. **Organization Management**
- Create and manage organizations
- Assign users to organizations
- Set organization-level settings
- View organization statistics

#### 11. **System Configuration**
- Manage NIST CSF control library
- Configure STRIDE categories
- Set system-wide policies
- Manage evidence storage limits
- Configure report templates

#### 12. **Audit and Monitoring**
- View system audit logs
- Monitor user activities
- Track data changes
- Review access patterns
- Generate compliance audit trails

---

## Security Features

### Authentication & Authorization
- JWT-based authentication with 24-hour token expiration
- Secure password hashing with bcrypt (10 salt rounds)
- Password requirements enforcement
- Token validation on every request
- Role-based access control (RBAC)

### Data Protection
- SQL injection prevention with parameterized queries
- XSS protection through input validation
- CSRF protection with same-site cookies
- Secure file upload with type and size validation
- Evidence file encryption at rest

### Session Management
- Automatic session timeout
- Secure token storage
- Token refresh on activity
- Logout clears all session data

### Audit Trail
- All database operations logged
- User activity tracking
- Change history for assessments
- Evidence access logging

---

## Integration Points

### Database Integration
- PostgreSQL connection pooling
- Transactional operations
- Foreign key constraints
- Database migrations for schema versioning

### File System Integration
- Secure file upload to server storage
- Evidence file management
- PDF report generation and storage
- Temporary file cleanup

### API Integration
- RESTful API design
- JSON data format
- Error response standardization
- API versioning support

---

## Deployment Information

### Backend Deployment
- **Port**: 3000
- **Environment Variables Required**:
  - `DATABASE_URL`: PostgreSQL connection string
  - `JWT_SECRET`: Secret key for JWT signing
  - `NODE_ENV`: Environment (development/production)
  - `PORT`: Server port (default: 3000)

### Frontend Deployment
- **Development Port**: 5173
- **Build Command**: `npm run build`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: Backend API URL

### Database Setup
1. Create PostgreSQL database named `compliance_platform`
2. Run migrations in order from `src/config/migrations/`
3. Optionally run seed data from `src/config/seeds/`

---

## Best Practices Implemented

### Backend
- Modular architecture with clear separation of concerns
- Consistent error handling
- Input validation on all endpoints
- Database connection pooling for performance
- SQL query logging for debugging
- Comprehensive API documentation

### Frontend
- Component reusability
- Centralized state management
- Responsive design for all screen sizes
- Loading states for better UX
- Error boundaries for graceful error handling
- Form validation with user feedback
- Accessibility considerations

### Code Quality
- Consistent naming conventions
- Code comments and documentation
- Error handling at all levels
- Validation at both frontend and backend
- Security best practices

---

## Future Enhancement Opportunities

1. **Multi-factor Authentication (MFA)**
2. **Real-time Notifications**
3. **Advanced Analytics Dashboard**
4. **API Rate Limiting**
5. **Automated Compliance Scanning**
6. **Integration with Security Tools (SIEM, Vulnerability Scanners)**
7. **Mobile Application**
8. **Collaborative Assessment Workflows**
9. **Customizable Report Templates**
10. **Compliance Framework Templates (ISO 27001, SOC 2, HIPAA)**

---

## Support and Maintenance

### Logging
- Application logs in console
- Database query logs
- Error stack traces in development
- Structured logging format

### Monitoring
- Server health checks
- Database connection monitoring
- API response time tracking
- Error rate monitoring

### Backup and Recovery
- Regular database backups recommended
- Evidence file backup strategy
- Migration rollback capability
- Data export functionality

---

*Document Version: 1.0*  
*Last Updated: January 16, 2026*  
*Platform Version: 1.0.0*
