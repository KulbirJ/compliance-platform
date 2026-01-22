# @compliance/shared-components

Shared React components and business logic for the Compliance Platform.

## Overview

This package contains reusable UI components, hooks, utilities, and business logic that are shared between:
- **Frontend 1**: SharePoint Framework (SPFx) web parts
- **Frontend 2**: Standalone React SPA

## Structure

```
src/
├── components/          # Reusable UI components
│   ├── assessments/    # Assessment-related components
│   ├── threats/        # Threat modeling components
│   ├── evidence/       # Evidence management components
│   └── common/         # Common UI components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # Shared constants
├── api/                # API client abstractions
└── index.js            # Main export file
```

## Installation

```bash
# From monorepo root
pnpm install

# Build shared components
pnpm --filter @compliance/shared-components build
```

## Usage

### In Frontend Projects

```javascript
import { 
  AssessmentCard,
  ControlAssessmentModal,
  ThreatModelCard 
} from '@compliance/shared-components';

function MyComponent() {
  return <AssessmentCard assessment={data} />;
}
```

## Development

```bash
# Watch mode for development
pnpm --filter @compliance/shared-components dev

# Run tests
pnpm --filter @compliance/shared-components test

# Lint code
pnpm --filter @compliance/shared-components lint
```

## Components

### Assessment Components
- `AssessmentCard` - Display assessment summary
- `ControlAssessmentModal` - Edit control assessments
- `AssessmentList` - List of assessments with filtering

### Threat Components
- `ThreatModelCard` - Display threat model summary
- `STRIDEAnalysis` - STRIDE threat analysis interface
- `ThreatList` - List threats with categorization

### Evidence Components
- `EvidenceUpload` - File upload interface
- `EvidenceCard` - Display evidence details
- `EvidenceList` - List evidence with filtering

### Common Components
- `DataTable` - Generic data table with sorting/filtering
- `StatusChip` - Status indicator chips
- `ConfirmDialog` - Confirmation dialogs
- `LoadingSpinner` - Loading indicators

## API Adapters

The package provides abstract API interfaces that can be implemented differently for each frontend:

- **SharePoint (Frontend 1)**: Uses PnP/SP API with SharePoint Lists
- **Standalone (Frontend 2)**: Uses REST API with Node.js backend

```javascript
import { createApiAdapter } from '@compliance/shared-components';

// For SharePoint
const api = createApiAdapter('sharepoint', { context: spContext });

// For Standalone
const api = createApiAdapter('rest', { baseURL: 'http://localhost:3000/api' });
```

## License

MIT
