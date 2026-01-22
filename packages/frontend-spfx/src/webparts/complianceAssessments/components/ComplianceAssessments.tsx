import * as React from 'react';
import styles from './ComplianceAssessments.module.scss';
import { IComplianceAssessmentsProps } from './IComplianceAssessmentsProps';
import { 
  StatsCard,
  ControlAssessmentModal,
  createApiAdapter,
  useAssessments,
  formatDate
} from '@compliance/shared-components';
import { 
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon 
} from '@mui/icons-material';

interface IComplianceAssessmentsState {
  assessments: any[];
  loading: boolean;
  error: string;
  selectedControl: any;
  modalOpen: boolean;
}

export default class ComplianceAssessments extends React.Component<IComplianceAssessmentsProps, IComplianceAssessmentsState> {
  private apiAdapter: any;

  constructor(props: IComplianceAssessmentsProps) {
    super(props);
    
    this.state = {
      assessments: [],
      loading: true,
      error: '',
      selectedControl: null,
      modalOpen: false
    };

    // Initialize SharePoint API adapter
    this.apiAdapter = createApiAdapter('sharepoint', {
      context: this.props.context
    });
  }

  public async componentDidMount(): Promise<void> {
    await this.loadAssessments();
  }

  private async loadAssessments(): Promise<void> {
    try {
      this.setState({ loading: true, error: '' });
      const response = await this.apiAdapter.getAssessments();
      this.setState({ 
        assessments: response.data || [], 
        loading: false 
      });
    } catch (error) {
      this.setState({ 
        error: 'Failed to load assessments. Please ensure SharePoint lists are configured.',
        loading: false 
      });
    }
  }

  private handleControlClick(control: any): void {
    this.setState({
      selectedControl: control,
      modalOpen: true
    });
  }

  private handleModalClose(): void {
    this.setState({
      selectedControl: null,
      modalOpen: false
    });
  }

  private async handleAssessmentSuccess(): Promise<void> {
    await this.loadAssessments();
  }

  public render(): React.ReactElement<IComplianceAssessmentsProps> {
    const { assessments, loading, error, selectedControl, modalOpen } = this.state;
    const { description } = this.props;

    if (loading) {
      return (
        <div className={styles.complianceAssessments}>
          <div className={styles.container}>
            <p>Loading assessments...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.complianceAssessments}>
          <div className={styles.container}>
            <div style={{ color: 'red' }}>{error}</div>
            <p>Please follow the setup guide to create SharePoint lists:</p>
            <ul>
              <li>Assessments List</li>
              <li>ControlAssessments List</li>
              <li>Evidence Document Library</li>
            </ul>
          </div>
        </div>
      );
    }

    const completedAssessments = assessments.filter(a => a.Status === 'Completed').length;
    const inProgressAssessments = assessments.filter(a => a.Status === 'In Progress').length;

    return (
      <div className={styles.complianceAssessments}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.column}>
              <h2>Compliance Assessments</h2>
              <p>{description}</p>

              {/* Statistics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatsCard
                  title="Total Assessments"
                  value={assessments.length}
                  icon={<AssessmentIcon style={{ fontSize: 40 }} />}
                  color="primary"
                />
                <StatsCard
                  title="Completed"
                  value={completedAssessments}
                  icon={<CheckCircleIcon style={{ fontSize: 40 }} />}
                  color="success"
                />
                <StatsCard
                  title="In Progress"
                  value={inProgressAssessments}
                  icon={<WarningIcon style={{ fontSize: 40 }} />}
                  color="warning"
                />
              </div>

              {/* Assessment List */}
              <div>
                <h3>Recent Assessments</h3>
                {assessments.length === 0 ? (
                  <p>No assessments found. Create your first assessment in SharePoint.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {assessments.slice(0, 5).map((assessment) => (
                      <div 
                        key={assessment.Id} 
                        style={{ 
                          padding: '16px', 
                          border: '1px solid #edebe9', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => this.handleControlClick(assessment)}
                      >
                        <h4 style={{ margin: '0 0 8px 0' }}>{assessment.Title}</h4>
                        <p style={{ margin: '0 0 8px 0', color: '#605e5c' }}>
                          {assessment.Description || 'No description'}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#605e5c' }}>
                          <span>Status: <strong>{assessment.Status}</strong></span>
                          <span>Framework: {assessment.Framework}</span>
                          {assessment.Created && (
                            <span>Created: {formatDate(assessment.Created)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Control Assessment Modal - Using Shared Component */}
        {selectedControl && (
          <ControlAssessmentModal
            open={modalOpen}
            onClose={this.handleModalClose}
            control={selectedControl}
            assessmentId={selectedControl.Id}
            existingAssessment={null}
            onSuccess={this.handleAssessmentSuccess}
            onAssessControl={this.apiAdapter.createControlAssessment}
            onUploadEvidence={this.apiAdapter.uploadEvidence}
            onDeleteEvidence={this.apiAdapter.deleteEvidence}
          />
        )}
      </div>
    );
  }
}
