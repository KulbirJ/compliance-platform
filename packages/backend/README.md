# Compliance Platform - Backend API

RESTful API server for the Cybersecurity Compliance Platform, built with Node.js, Express, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **NIST CSF Compliance**: Complete NIST Cybersecurity Framework implementation
- **STRIDE Threat Modeling**: Comprehensive threat modeling and risk assessment
- **Evidence Management**: File upload and storage with BYTEA support
- **PDF Report Generation**: Professional compliance and threat analysis reports

## Technology Stack

- **Runtime**: Node.js v24.13.0
- **Framework**: Express 4.18.2
- **Database**: PostgreSQL 18.1
- **Authentication**: JWT (jsonwebtoken)
- **File Uploads**: Multer
- **PDF Generation**: PDFKit & PDFKit-Table
- **Validation**: Express-validator
- **Security**: Helmet, bcrypt

## Project Structure

```
compliance-platform-backend/
├── src/
│   ├── config/
│   │   ├── database.js           # Database connection
│   │   ├── seed.js                # Database seeding
│   │   ├── migrations/            # SQL migration scripts
│   │   └── seeds/                 # Seed data files
│   ├── controllers/               # Request handlers
│   │   ├── authController.js
│   │   ├── assessmentController.js
│   │   ├── controlAssessmentController.js
│   │   ├── evidenceController.js
│   │   ├── threatModelController.js
│   │   ├── complianceReportController.js
│   │   └── threatReportController.js
│   ├── middleware/                # Custom middleware
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── uploadMiddleware.js
│   ├── models/                    # Database models
│   │   ├── userModel.js
│   │   ├── assessmentModel.js
│   │   ├── evidenceModel.js
│   │   ├── threatModelModel.js
│   │   ├── complianceReportModel.js
│   │   └── threatReportModel.js
│   ├── routes/                    # API routes
│   │   ├── authRoutes.js
│   │   ├── assessmentRoutes.js
│   │   ├── evidenceRoutes.js
│   │   ├── threatModelRoutes.js
│   │   └── reportRoutes.js
│   ├── utils/                     # Utility functions
│   │   ├── logger.js
│   │   ├── complianceReportGenerator.js
│   │   └── threatReportGenerator.js
│   ├── app.js                     # Express app configuration
│   ├── index.js                   # App entry point
│   └── server.js                  # Server startup
├── tests/                         # Test files
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── package.json                   # Dependencies
└── README.md                      # This file
```

## Setup

### Prerequisites

- Node.js v24+ installed
- PostgreSQL 18+ installed and running
- Git

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE compliance_platform;
   \q
   
   # Run migrations
   psql -U postgres -d compliance_platform -f src/config/migrations/001_initial_schema.sql
   ```

4. **Seed initial data**:
   ```bash
   node src/config/seed.js
   ```

5. **Start the server**:
   ```bash
   npm start
   # or for development with nodemon
   npm run dev
   ```

The API server will be running at `http://localhost:3000`

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=compliance_platform
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Assessments
- `GET /api/assessments` - List all assessments
- `POST /api/assessments` - Create new assessment
- `GET /api/assessments/:id` - Get assessment details
- `PUT /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment

### Control Assessments
- `POST /api/assessments/:id/controls` - Assess a control
- `GET /api/assessments/:id/controls` - Get all control assessments
- `PUT /api/assessments/:assessmentId/controls/:controlId` - Update control assessment

### Evidence
- `POST /api/evidence/upload` - Upload evidence file
- `GET /api/evidence` - List evidence
- `GET /api/evidence/:id` - Get evidence details
- `GET /api/evidence/:id/download` - Download evidence file
- `PUT /api/evidence/:id` - Update evidence
- `DELETE /api/evidence/:id` - Delete evidence

### Threat Modeling
- `GET /api/threat-models` - List threat models
- `POST /api/threat-models` - Create threat model
- `GET /api/threat-models/:id` - Get threat model details
- `POST /api/threat-models/:id/assets` - Add asset
- `POST /api/threat-models/:id/threats` - Add threat
- `POST /api/threat-models/:id/mitigations` - Add mitigation

### Reports
- `POST /api/reports/compliance` - Generate compliance report
- `GET /api/reports/compliance/:id` - Get compliance report metadata
- `GET /api/reports/compliance/:id/download` - Download compliance PDF
- `POST /api/reports/threat` - Generate threat report
- `GET /api/reports/threat/:id` - Get threat report metadata
- `GET /api/reports/threat/:id/download` - Download threat PDF

For detailed API documentation, see the `*_TESTING.md` files.

## Testing

### Run Tests
```bash
npm test
```

### Manual Testing
Use the provided PowerShell test scripts:
- `test-auth.ps1` - Test authentication
- `test-assessment-workflow.ps1` - Test assessments
- `test-evidence-workflow.ps1` - Test evidence management
- `test-threat-modeling.ps1` - Test threat modeling
- `test-api-complete.ps1` - Complete API test suite

### API Documentation
- `API_TESTING.md` - General API testing guide
- `ASSESSMENT_TESTING.md` - Assessment API examples
- `EVIDENCE_TESTING.md` - Evidence management examples
- `THREAT_MODELING_TESTING.md` - Threat modeling examples
- `REPORT_TESTING.md` - Report generation examples

## Database Schema

The platform uses PostgreSQL with the following main tables:

- `users` - User accounts
- `organizations` - Organizations/companies
- `compliance_assessments` - NIST CSF assessments
- `compliance_control_assessments` - Control assessment results
- `evidence` - Uploaded evidence files (BYTEA storage)
- `threat_models` - STRIDE threat models
- `threats` - Identified threats
- `assets` - System assets
- `mitigations` - Threat mitigations
- `compliance_reports` - Generated compliance PDFs
- `threat_reports` - Generated threat analysis PDFs

See `src/config/migrations/001_initial_schema.sql` for complete schema.

## Default Credentials

After seeding, you can login with:
- **Email**: admin@example.com
- **Password**: admin123

⚠️ **Change these credentials in production!**

## Development

### Code Style
The project uses ESLint for code quality. Run:
```bash
npm run lint
```

### Database Migrations
To add new migrations:
1. Create SQL file in `src/config/migrations/`
2. Name it with sequential number: `002_description.sql`
3. Run: `psql -U postgres -d compliance_platform -f src/config/migrations/002_description.sql`

### Adding New Features
1. Create model in `src/models/`
2. Create controller in `src/controllers/`
3. Create routes in `src/routes/`
4. Register routes in `src/app.js`
5. Add tests
6. Update documentation

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <process_id> /F
```

### Database Connection Failed
- Check PostgreSQL is running: `pg_ctl status`
- Verify credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### File Upload Errors
- Check `MAX_FILE_SIZE` in `.env`
- Verify disk space
- Check file permissions

## Performance

- Uses connection pooling for PostgreSQL
- JWT tokens for stateless auth
- Efficient BYTEA storage for files
- Indexed database queries
- Request validation and sanitization

## Security

- Helmet.js for HTTP headers
- bcrypt for password hashing
- JWT for authentication
- Input validation with express-validator
- SQL injection protection
- File type validation
- File size limits
- Organization-based access control

## License

ISC

## Support

For issues or questions, please refer to the documentation in the `*_TESTING.md` files or contact the development team.
