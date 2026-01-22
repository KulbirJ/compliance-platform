import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  Tabs,
  Tab,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import {
  generateComplianceReport,
  getComplianceReports,
  downloadComplianceReport,
  generateThreatReport,
  getThreatReports,
  downloadThreatReport,
} from '../../api/reports';
import { getAssessments } from '../../api/assessments';
import { getThreatModels } from '../../api/threats';
import { formatDate } from '../../utils/formatters';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Compliance Reports State
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [complianceReports, setComplianceReports] = useState([]);
  const [generatingCompliance, setGeneratingCompliance] = useState(false);

  // Threat Reports State
  const [threatModels, setThreatModels] = useState([]);
  const [selectedThreatModelId, setSelectedThreatModelId] = useState('');
  const [threatReports, setThreatReports] = useState([]);
  const [generatingThreat, setGeneratingThreat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load assessments
      const assessmentsResponse = await getAssessments();
      setAssessments(assessmentsResponse.data?.data || []);

      // Load threat models
      const threatModelsResponse = await getThreatModels();
      setThreatModels(threatModelsResponse.data?.data || []);

      // Load existing reports
      await loadComplianceReports();
      await loadThreatReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceReports = async () => {
    try {
      const response = await getComplianceReports();
      setComplianceReports(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load compliance reports:', err);
    }
  };

  const loadThreatReports = async () => {
    try {
      const response = await getThreatReports();
      setThreatReports(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load threat reports:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleGenerateComplianceReport = async () => {
    if (!selectedAssessmentId) {
      setError('Please select an assessment');
      return;
    }

    setGeneratingCompliance(true);
    setError('');
    setSuccess('');

    try {
      await generateComplianceReport(selectedAssessmentId);
      setSuccess('Compliance report generated successfully!');
      await loadComplianceReports();
      setSelectedAssessmentId('');

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate compliance report');
    } finally {
      setGeneratingCompliance(false);
    }
  };

  const handleGenerateThreatReport = async () => {
    if (!selectedThreatModelId) {
      setError('Please select a threat model');
      return;
    }

    setGeneratingThreat(true);
    setError('');
    setSuccess('');

    try {
      await generateThreatReport(selectedThreatModelId);
      setSuccess('Threat report generated successfully!');
      await loadThreatReports();
      setSelectedThreatModelId('');

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate threat report');
    } finally {
      setGeneratingThreat(false);
    }
  };

  const handleDownloadComplianceReport = async (reportId, assessmentName) => {
    try {
      const response = await downloadComplianceReport(reportId);
      const filename = `compliance-report-${assessmentName || reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
      saveAs(response.data, filename);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download compliance report');
    }
  };

  const handleDownloadThreatReport = async (reportId, threatModelName) => {
    try {
      const response = await downloadThreatReport(reportId);
      const filename = `threat-report-${threatModelName || reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
      saveAs(response.data, filename);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download threat report');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Reports
      </Typography>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Compliance Reports (${complianceReports.length})`} />
          <Tab label={`Threat Reports (${threatReports.length})`} />
        </Tabs>

        <Box p={3}>
          {/* Compliance Reports Tab */}
          {activeTab === 0 && (
            <Box>
              {/* Generate New Report Section */}
              <Card variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Generate New Compliance Report
                </Typography>
                <Box display="flex" gap={2} alignItems="flex-start" mt={2}>
                  <TextField
                    select
                    label="Select Assessment"
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    fullWidth
                    disabled={generatingCompliance}
                  >
                    <MenuItem value="">
                      <em>-- Select an assessment --</em>
                    </MenuItem>
                    {assessments.map((assessment) => (
                      <MenuItem key={assessment.id} value={assessment.id}>
                        {assessment.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="contained"
                    startIcon={generatingCompliance ? <CircularProgress size={20} /> : <AddIcon />}
                    onClick={handleGenerateComplianceReport}
                    disabled={!selectedAssessmentId || generatingCompliance}
                    sx={{ minWidth: 200, height: 56 }}
                  >
                    {generatingCompliance ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Box>
              </Card>

              {/* Existing Reports Table */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Existing Compliance Reports
              </Typography>

              {complianceReports.length === 0 ? (
                <Alert severity="info">
                  No compliance reports generated yet. Select an assessment and generate your first report.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography fontWeight="bold">Assessment Name</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">Generated Date</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">Generated By</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">Status</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">Actions</Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {complianceReports.map((report) => (
                        <TableRow key={report.id} hover>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {report.assessment_name || `Assessment ${report.assessment_id}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(report.generated_date || report.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {report.generated_by || 'System'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.status || 'Generated'}
                              size="small"
                              color="success"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Download PDF">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  handleDownloadComplianceReport(report.id, report.assessment_name)
                                }
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Threat Reports Tab */}
          {activeTab === 1 && (
            <Box>
              {/* Generate New Report Section */}
              <Card variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Generate New Threat Report
                </Typography>
                <Box display="flex" gap={2} alignItems="flex-start" mt={2}>
                  <TextField
                    select
                    label="Select Threat Model"
                    value={selectedThreatModelId}
                    onChange={(e) => setSelectedThreatModelId(e.target.value)}
                    fullWidth
                    disabled={generatingThreat}
                  >
                    <MenuItem value="">
                      <em>-- Select a threat model --</em>
                    </MenuItem>
                    {threatModels.map((threatModel) => (
                      <MenuItem key={threatModel.id} value={threatModel.id}>
                        {threatModel.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="contained"
                    startIcon={generatingThreat ? <CircularProgress size={20} /> : <AddIcon />}
                    onClick={handleGenerateThreatReport}
                    disabled={!selectedThreatModelId || generatingThreat}
                    sx={{ minWidth: 200, height: 56 }}
                  >
                    {generatingThreat ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Box>
              </Card>

              {/* Existing Reports Table */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Existing Threat Reports
              </Typography>

              {threatReports.length === 0 ? (
                <Alert severity="info">
                  No threat reports generated yet. Select a threat model and generate your first report.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography fontWeight="bold">Threat Model Name</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">Generated Date</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">Generated By</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">Status</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">Actions</Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {threatReports.map((report) => (
                        <TableRow key={report.id} hover>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {report.threat_model_name || `Threat Model ${report.threat_model_id}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(report.generated_date || report.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {report.generated_by || 'System'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.status || 'Generated'}
                              size="small"
                              color="success"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Download PDF">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  handleDownloadThreatReport(report.id, report.threat_model_name)
                                }
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default ReportsPage;
