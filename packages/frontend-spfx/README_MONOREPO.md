# @compliance/frontend-spfx

SharePoint Framework (SPFx) web parts for the Compliance Platform.

## Overview

This package contains SPFx web parts that integrate with SharePoint Online, using the shared component library (`@compliance/shared-components`) for consistent UI and business logic.

## Web Parts

### 1. Compliance Assessments
- **Location:** `src/webparts/complianceAssessments/`
- **Features:**
  - View all compliance assessments from SharePoint list
  - Display assessment statistics (total, completed, in progress)
  - Uses shared `StatsCard` and `ControlAssessmentModal` components
  - Integrates with SharePoint API adapter

## Prerequisites

⚠️ **IMPORTANT:** SPFx 1.11.0 requires **Node.js 14.x** to build and run. Modern Node.js versions (18+, 20+, 24+) are not compatible.

### Required Software
- **Node.js 14.21.3** (use NVM or fnm to manage versions) - See [NODE_VERSION_GUIDE.md](./NODE_VERSION_GUIDE.md)
- **gulp-cli** installed globally: `npm install -g gulp-cli`
- **PNPM 8.x** (compatible with Node 14)
- SharePoint Online environment
- SharePoint App Catalog access for deployment

### Quick Setup with NVM

```powershell
# Install Node.js 14
nvm install 14.21.3
nvm use 14.21.3

# Install global tools
npm install -g gulp-cli pnpm@8

# Verify
node --version  # Should show v14.21.3
gulp --version  # Should show CLI version
```

For detailed Node.js version management, see [NODE_VERSION_GUIDE.md](./NODE_VERSION_GUIDE.md).

## SharePoint Lists Required

Create these lists in your SharePoint site before using the web parts:

### Assessments List
- **Title** (Single line text)
- **Description** (Multiple lines text)
- **Framework** (Choice: NIST CSF 2.0, ISO 27001, SOC 2)
- **Status** (Choice: Draft, In Progress, Completed, Archived)
- **OrganizationName** (Single line text)
- **Created** (Date - auto-created)
- **CompletedDate** (Date)

### ControlAssessments List
- **AssessmentID** (Lookup → Assessments list)
- **SubcategoryID** (Single line text)
- **Status** (Choice: fully_implemented, largely_implemented, partially_implemented, not_implemented, not_applicable)
- **QuestionnaireResponse** (Multiple lines text)
- **Comments** (Multiple lines text)
- **RemediationPlan** (Multiple lines text)

### Evidence Document Library
Standard document library with custom columns:
- **AssessmentID** (Lookup → Assessments)
- **ControlID** (Single line text)
- **EvidenceType** (Choice: Document, Screenshot, Report, Certificate)
- **EvidenceQuality** (Choice: high, medium, low)

## Development

### Build shared components first
```bash
# From monorepo root
pnpm build:shared
```

### Start development server
```bash
cd packages/frontend-spfx
gulp serve
```

This opens the SharePoint Workbench at `https://localhost:4321/temp/workbench.html`

### Test in SharePoint Workbench
1. Click **+** to add a web part
2. Select "ComplianceAssessments"
3. Configure properties in the property pane

## Building for Production

```bash
# Bundle the solution
gulp bundle --ship

# Package the solution
gulp package-solution --ship
```

This creates a `.sppkg` file in `sharepoint/solution/` directory.

## Deployment

### 1. Upload to App Catalog
1. Go to **SharePoint Admin Center**
2. Navigate to **More features** → **Apps** → **App Catalog**
3. Upload the `.sppkg` file
4. Click **Deploy**
5. Check "Make this solution available to all sites"

### 2. Install on SharePoint Site
1. Go to your SharePoint site
2. Click **Settings** → **Add an app**
3. Find "frontend-spfx-client-side-solution"
4. Click **Add**
5. Wait for installation to complete

### 3. Add Web Part to Page
1. Create or edit a SharePoint page
2. Click **+** to add a web part
3. Search for "Compliance Assessments"
4. Add to page and configure
5. Publish the page

## Using Shared Components

This web part uses components from `@compliance/shared-components`:

```typescript
import { 
  StatsCard,
  ControlAssessmentModal,
  createApiAdapter,
  formatDate
} from '@compliance/shared-components';

// Initialize SharePoint adapter
const apiAdapter = createApiAdapter('sharepoint', {
  context: this.props.context
});

// Use shared components
<StatsCard 
  title="Total Assessments"
  value={assessments.length}
  icon={<AssessmentIcon />}
/>
```

## Architecture

```
ComplianceAssessmentsWebPart (SPFx Web Part)
  └── ComplianceAssessments.tsx (React Component)
      ├── Uses @compliance/shared-components
      ├── SharePoint API Adapter
      └── Renders shared UI components
```

## Troubleshooting

### Build Errors

**Issue:** TypeScript errors
```bash
# Clear cache and rebuild
gulp clean
pnpm install
gulp build
```

**Issue:** Shared components not found
```bash
# From monorepo root
pnpm build:shared
pnpm install
```

### Runtime Errors

**Issue:** "Failed to load assessments"
- Ensure SharePoint lists are created
- Check list names match exactly
- Verify permissions to access lists

**Issue:** Web part not appearing
- Check if solution is deployed in App Catalog
- Verify solution is installed on the site
- Clear browser cache

## Configuration

### config/config.json
Main SPFx configuration file

### config/package-solution.json
Solution packaging configuration
- Solution name: frontend-spfx-client-side-solution
- Version: 1.0.0.0

### tsconfig.json
TypeScript compiler configuration
- Target: ES5
- Module: CommonJS
- JSX: React

## Dependencies

### Runtime Dependencies
- `@compliance/shared-components` - Shared component library
- `react` 16.8.5
- `react-dom` 16.8.5
- `office-ui-fabric-react` 6.214.0
- `@microsoft/sp-*` - SharePoint Framework libraries

### Development Dependencies
- `@microsoft/sp-build-web` - SPFx build tools
- `gulp` - Task runner
- `typescript` - Type checking

## API Adapter Implementation

The SharePoint adapter needs to be implemented in:
`packages/shared-components/src/api/sharepointAdapter.js`

Example implementation:
```javascript
import { sp } from '@pnp/sp';

export class SharePointApiAdapter {
  constructor(config) {
    sp.setup({ spfxContext: config.context });
  }

  async getAssessments() {
    const items = await sp.web.lists
      .getByTitle('Assessments')
      .items
      .get();
    return { data: items };
  }
  
  // Implement other methods...
}
```

## Resources

- [SPFx Documentation](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [PnP/SP Documentation](https://pnp.github.io/pnpjs/)
- [Office UI Fabric React](https://developer.microsoft.com/en-us/fluentui#/controls/web)
- [SharePoint REST API](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/get-to-know-the-sharepoint-rest-service)

## License

MIT
