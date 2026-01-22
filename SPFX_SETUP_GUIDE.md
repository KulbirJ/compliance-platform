# SharePoint Framework Setup Guide

## Prerequisites Installed ✅
- Node.js 18+
- Yeoman (`yo`)
- SharePoint Framework generator (`@microsoft/generator-sharepoint`)

## Creating the SPFx Project

### Option 1: Interactive Generator (Recommended)

```bash
cd C:\Users\user1-baseNaultha\compliance-platform\packages
yo @microsoft/sharepoint
```

When prompted, enter:
- **Solution Name**: `frontend-spfx`
- **Baseline packages**: SharePoint Online only (latest)
- **Location**: Use current folder
- **Tenant admin**: No
- **Component type**: WebPart
- **Web part name**: `ComplianceAssessments`
- **Description**: `Compliance assessments management web part`
- **Framework**: React
- **Additional web parts**: Add 3 more:
  - `ThreatModeling` - STRIDE threat modeling interface
  - `EvidenceManager` - Evidence upload and management
  - `ComplianceReports` - Compliance reporting dashboard

### Option 2: Non-Interactive

```bash
cd C:\Users\user1-baseNaultha\compliance-platform\packages
mkdir frontend-spfx
cd frontend-spfx
yo @microsoft/sharepoint --skip-install
```

Then answer the prompts as shown above.

## Post-Generation Setup

### 1. Install Dependencies

```bash
cd frontend-spfx
pnpm install
```

### 2. Add Shared Components Dependency

Edit `package.json`:

```json
{
  "dependencies": {
    "@compliance/shared-components": "workspace:*",
    // ... other dependencies
  }
}
```

### 3. Configure Package Name

Update `package.json`:

```json
{
  "name": "@compliance/frontend-spfx",
  "version": "1.0.0"
}
```

### 4. Test SPFx Workbench

```bash
pnpm dev:spfx
# or
gulp serve
```

This opens the SharePoint Workbench at `https://localhost:4321/temp/workbench.html`

## SharePoint List Schema

Create these lists in SharePoint Online:

### Assessments List
- **Title** (Single line text)
- **Description** (Multiple lines text)
- **Framework** (Choice: NIST CSF 2.0)
- **Status** (Choice: Draft, In Progress, Completed)
- **OrganizationName** (Single line text)
- **CreatedDate** (Date)
- **CompletedDate** (Date)

### ControlAssessments List
- **AssessmentID** (Lookup → Assessments)
- **SubcategoryID** (Single line text)
- **Status** (Choice: fully_implemented, largely_implemented, partially_implemented, not_implemented, not_applicable)
- **QuestionnaireResponse** (Multiple lines text)
- **Comments** (Multiple lines text)
- **RemediationPlan** (Multiple lines text)

### ThreatModels List
- **Title** (Single line text)
- **Description** (Multiple lines text)
- **AssetType** (Choice: Application, Database, API, Infrastructure)
- **Status** (Choice: Draft, In Progress, Completed)
- **CreatedDate** (Date)

### Evidence Document Library
- Create a standard Document Library
- Add custom columns:
  - **AssessmentID** (Lookup → Assessments)
  - **ControlID** (Single line text)
  - **EvidenceType** (Choice: Document, Screenshot, Report, Certificate)
  - **EvidenceQuality** (Choice: high, medium, low)

## Using Shared Components in SPFx

### Example Web Part Code

```tsx
import * as React from 'react';
import { 
  ControlAssessmentModal, 
  StatsCard,
  formatDate 
} from '@compliance/shared-components';
import { createApiAdapter } from '@compliance/shared-components';

export default class ComplianceAssessmentsWebPart extends React.Component {
  private apiAdapter: any;

  constructor(props: any) {
    super(props);
    
    // Initialize SharePoint adapter
    this.apiAdapter = createApiAdapter('sharepoint', {
      context: this.props.context
    });
  }

  render() {
    return (
      <div>
        <StatsCard 
          title="Total Assessments"
          value={this.state.assessments?.length || 0}
          icon={<AssessmentIcon />}
        />
        
        <ControlAssessmentModal
          open={this.state.modalOpen}
          onClose={this.handleClose}
          control={this.state.selectedControl}
          onAssessControl={this.apiAdapter.createControlAssessment}
          onUploadEvidence={this.apiAdapter.uploadEvidence}
          onDeleteEvidence={this.apiAdapter.deleteEvidence}
        />
      </div>
    );
  }
}
```

## Implementing SharePoint Adapter

Edit `packages/shared-components/src/api/sharepointAdapter.js`:

```javascript
import { sp } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/files';

export class SharePointApiAdapter {
  constructor(config) {
    this.context = config.context;
    sp.setup({
      spfxContext: this.context
    });
  }

  async getAssessments() {
    const items = await sp.web.lists
      .getByTitle('Assessments')
      .items
      .select('Id', 'Title', 'Description', 'Framework', 'Status', 'Created')
      .get();
    
    return { data: items };
  }

  async createControlAssessment(assessmentId, data) {
    const item = await sp.web.lists
      .getByTitle('ControlAssessments')
      .items
      .add({
        AssessmentIDId: assessmentId,
        SubcategoryID: data.subcategory_id,
        Status: data.status,
        QuestionnaireResponse: data.questionnaire_response,
        Comments: data.comments,
        RemediationPlan: data.remediation_plan
      });
    
    return { data: item };
  }

  // Implement other methods...
}
```

## Deployment

### 1. Build Package

```bash
cd packages/frontend-spfx
gulp bundle --ship
gulp package-solution --ship
```

### 2. Deploy to SharePoint

1. Navigate to **SharePoint Admin Center** → **More features** → **Apps**
2. Click **App Catalog**
3. Upload the `.sppkg` file from `sharepoint/solution/` folder
4. Click **Deploy**
5. Install the app on your SharePoint site

### 3. Add Web Part to Page

1. Go to your SharePoint site
2. Create/Edit a page
3. Click **+** to add a web part
4. Search for "Compliance Assessments"
5. Add to page and publish

## Troubleshooting

### Token Expired Error
```bash
npm logout
npm login
```

### Build Errors
```bash
# Clear gulp cache
rd /s /q node_modules
rd /s /q temp
pnpm install
```

### PnP/SP Issues
```bash
pnpm add @pnp/sp @pnp/common
```

## Resources

- [SPFx Documentation](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [PnP/SP Documentation](https://pnp.github.io/pnpjs/)
- [Fluent UI Components](https://developer.microsoft.com/en-us/fluentui)
