import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassIcon,
  PictureAsPdf as PdfIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import useAssessmentStore from '../../store/assessmentStore';
import { getControlAssessments, getNistCsfFramework } from '../../api/assessments';
import { formatDate } from '../../utils/formatters';
import ControlAssessmentModal from '../../components/assessments/ControlAssessmentModal';

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'compliant':
    case 'implemented':
      return 'success';
    case 'partially_compliant':
    case 'partial':
      return 'warning';
    case 'non_compliant':
    case 'not_implemented':
      return 'error';
    case 'not_applicable':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'compliant':
    case 'implemented':
      return <CheckCircleIcon />;
    case 'partially_compliant':
    case 'partial':
      return <HourglassIcon />;
    case 'non_compliant':
    case 'not_implemented':
      return <CancelIcon />;
    default:
      return null;
  }
};

const StatCard = ({ label, value, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Typography color="textSecondary" variant="overline">
        {label}
      </Typography>
      <Typography variant="h4" color={color} fontWeight="bold">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const AssessmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentAssessment, fetchAssessmentById, loading: assessmentLoading } = useAssessmentStore();
  
  const [controlAssessments, setControlAssessments] = useState([]);
  const [nistFramework, setNistFramework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFunction, setExpandedFunction] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch assessment details
      await fetchAssessmentById(id);

      // Fetch control assessments for this assessment
      const controlsResponse = await getControlAssessments(id);
      setControlAssessments(controlsResponse.data?.data || []);

      // Fetch NIST CSF framework
      const frameworkResponse = await getNistCsfFramework();
      setNistFramework(frameworkResponse.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedFunction(isExpanded ? panel : false);
  };

  const handleEdit = () => {
    navigate(`/assessments/${id}/edit`);
  };

  const handleGenerateReport = () => {
    navigate(`/reports/compliance?assessmentId=${id}`);
  };

  const getControlStatus = (controlId) => {
    const assessment = controlAssessments.find(
      (ca) => ca.control_id === controlId || ca.subcategory_id === controlId
    );
    return assessment?.status || 'not_assessed';
  };

  const getEvidenceCount = (controlId) => {
    const assessment = controlAssessments.find(
      (ca) => ca.control_id === controlId || ca.subcategory_id === controlId
    );
    return assessment?.evidence_count || 0;
  };

  const handleControlClick = (control) => {
    setSelectedControl(control);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedControl(null);
  };

  const handleAssessmentSuccess = () => {
    // Refresh control assessments after saving
    loadData();
  };

  // Calculate statistics
  const totalControls = controlAssessments.length;
  const compliantControls = controlAssessments.filter(
    (ca) => ca.status === 'compliant' || ca.status === 'implemented'
  ).length;
  const partialControls = controlAssessments.filter(
    (ca) => ca.status === 'partially_compliant' || ca.status === 'partial'
  ).length;
  const nonCompliantControls = controlAssessments.filter(
    (ca) => ca.status === 'non_compliant' || ca.status === 'not_implemented'
  ).length;
  const completionRate = totalControls > 0 ? Math.round((compliantControls / totalControls) * 100) : 0;

  // Group framework by functions
  const functions = nistFramework.reduce((acc, item) => {
    const funcName = item.function_name || 'Unknown';
    if (!acc[funcName]) {
      acc[funcName] = {
        categories: {},
      };
    }
    
    const catName = item.category_name || 'Unknown';
    if (!acc[funcName].categories[catName]) {
      acc[funcName].categories[catName] = [];
    }
    
    acc[funcName].categories[catName].push(item);
    return acc;
  }, {});

  if (loading || assessmentLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!currentAssessment) {
    return (
      <Box>
        <Alert severity="warning">Assessment not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            {currentAssessment.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {currentAssessment.description}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleGenerateReport}
            color="secondary"
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Assessment Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="textSecondary">
                Assessment Date
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {currentAssessment.assessment_date
                  ? formatDate(currentAssessment.assessment_date)
                  : 'Not set'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="textSecondary">
                Scope
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {currentAssessment.scope || 'Not specified'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="textSecondary">
                Status
              </Typography>
              <Chip
                label={currentAssessment.status || 'Draft'}
                color={getStatusColor(currentAssessment.status)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="textSecondary">
                Overall Progress
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <LinearProgress
                  variant="determinate"
                  value={currentAssessment.compliance_score || completionRate}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {currentAssessment.compliance_score || completionRate}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Controls" value={totalControls} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Compliant" value={compliantControls} color="success.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Partial" value={partialControls} color="warning.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Non-Compliant" value={nonCompliantControls} color="error.main" />
        </Grid>
      </Grid>

      {/* NIST CSF Framework */}
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
        NIST CSF Framework Controls
      </Typography>

      {Object.keys(functions).length === 0 ? (
        <Alert severity="info">
          No NIST CSF framework data available. Please ensure the framework has been loaded.
        </Alert>
      ) : (
        Object.entries(functions).map(([functionName, functionData]) => (
          <Accordion
            key={functionName}
            expanded={expandedFunction === functionName}
            onChange={handleAccordionChange(functionName)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <AssessmentIcon color="primary" />
                <Typography variant="h6" fontWeight="medium">
                  {functionName}
                </Typography>
                <Chip
                  label={`${Object.keys(functionData.categories).length} Categories`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {Object.entries(functionData.categories).map(([categoryName, controls]) => (
                <Accordion key={categoryName} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="medium">{categoryName}</Typography>
                    <Chip
                      label={`${controls.length} Controls`}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {controls.map((control) => {
                        const status = getControlStatus(control.subcategory_id);
                        const evidenceCount = getEvidenceCount(control.subcategory_id);

                        return (
                          <Box key={control.subcategory_id}>
                            <ListItem
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                              onClick={() => handleControlClick(control)}
                              secondaryAction={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Tooltip title="Evidence Count">
                                    <Badge badgeContent={evidenceCount} color="primary">
                                      <FolderIcon color="action" />
                                    </Badge>
                                  </Tooltip>
                                  <Chip
                                    icon={getStatusIcon(status)}
                                    label={status.replace('_', ' ')}
                                    color={getStatusColor(status)}
                                    size="small"
                                  />
                                </Box>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body1" fontWeight="medium">
                                    {control.subcategory_id} - {control.subcategory_name}
                                  </Typography>
                                }
                                secondary={control.subcategory_description}
                              />
                            </ListItem>
                            <Divider />
                          </Box>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Control Assessment Modal */}
      <ControlAssessmentModal
        open={modalOpen}
        onClose={handleModalClose}
        control={selectedControl}
        assessmentId={id}
        existingAssessment={selectedControl ? controlAssessments.find(
          (ca) => ca.subcategory_id === selectedControl.subcategory_id
        ) : null}
        onSuccess={handleAssessmentSuccess}
      />
    </Box>
  );
};

export default AssessmentDetailPage;
