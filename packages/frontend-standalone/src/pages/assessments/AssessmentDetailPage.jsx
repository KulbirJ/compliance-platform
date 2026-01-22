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
    case 'fully_implemented':
    case 'largely_implemented':
      return 'success';
    case 'partially_implemented':
      return 'warning';
    case 'at_risk':
      return 'error';
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
    case 'fully_implemented':
    case 'largely_implemented':
      return <CheckCircleIcon />;
    case 'partially_implemented':
      return <HourglassIcon />;
    case 'at_risk':
      return <CancelIcon />;
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
    console.log('Assessment ID:', id);
    console.log('Current assessment:', currentAssessment);
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
      console.log('Control assessments response:', controlsResponse);
      setControlAssessments(controlsResponse.data?.data || []);

      // Fetch NIST CSF framework
      const frameworkResponse = await getNistCsfFramework();
      console.log('NIST framework response:', frameworkResponse);
      console.log('NIST framework data length:', frameworkResponse.data?.data?.length);
      setNistFramework(frameworkResponse.data?.data || []);
    } catch (err) {
      console.error('Error loading assessment details:', err);
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

  // Extract all controls from the nested structure
  const allControls = [];
  if (controlAssessments?.functions) {
    controlAssessments.functions.forEach(func => {
      func.categories?.forEach(cat => {
        if (Array.isArray(cat.controls)) {
          allControls.push(...cat.controls);
        }
      });
    });
  }
  console.log('🔍 allControls extracted:', allControls.length, 'controls');
  if (allControls.length > 0) {
    console.log('🔍 Sample control with fields:', {
      controlCode: allControls[0].controlCode,
      questionnaire_response: allControls[0].questionnaire_response,
      comments: allControls[0].comments,
      remediation_plan: allControls[0].remediation_plan
    });
  }

  const getControlStatus = (controlId) => {
    const assessment = allControls.find(
      (ca) => ca.controlId === controlId || ca.controlCode === controlId || ca.subcategory_id === controlId
    );
    return assessment?.implementationStatus || assessment?.status || 'not_assessed';
  };

  const getEvidenceCount = (controlId) => {
    const assessment = allControls.find(
      (ca) => ca.controlId === controlId || ca.controlCode === controlId || ca.subcategory_id === controlId
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

  console.log('Render - loading:', loading, 'assessmentLoading:', assessmentLoading);
  console.log('Render - error:', error);
  console.log('Render - currentAssessment:', currentAssessment);
  console.log('Render - controlAssessments:', controlAssessments, 'Type:', typeof controlAssessments, 'IsArray:', Array.isArray(controlAssessments));

  const safeNistFramework = Array.isArray(nistFramework) ? nistFramework : [];

  // Calculate statistics from extracted controls
  const totalControls = allControls.length;
  const compliantControls = allControls.filter(
    (ca) => {
      const status = ca.implementationStatus || ca.status;
      return status === 'fully_implemented' || status === 'largely_implemented';
    }
  ).length;
  const partialControls = allControls.filter(
    (ca) => {
      const status = ca.implementationStatus || ca.status;
      return status === 'partially_implemented';
    }
  ).length;
  const nonCompliantControls = allControls.filter(
    (ca) => {
      const status = ca.implementationStatus || ca.status;
      return status === 'not_implemented';
    }
  ).length;
  
  // Use completion percentage from assessment if available, otherwise calculate
  const completionRate = currentAssessment?.completionPercentage || 
    (totalControls > 0 ? Math.round((compliantControls / totalControls) * 100) : 0);

  // Group framework by functions
  const functions = safeNistFramework.reduce((acc, item) => {
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
                  value={completionRate}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {completionRate}%
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
        existingAssessment={(() => {
          console.log('🔍 selectedControl:', selectedControl);
          console.log('🔍 allControls sample:', allControls[0]);
          const existing = selectedControl ? allControls.find(
            (ca) => {
              const match = ca.controlCode === selectedControl.subcategory_id || ca.subcategory_id === selectedControl.subcategory_id;
              console.log('🔍 Checking control:', ca.controlCode, ca.subcategory_id, 'against', selectedControl.subcategory_id, '=', match);
              return match;
            }
          ) : null;
          console.log('🔍 existingAssessment for modal:', existing);
          return existing;
        })()}
        onSuccess={handleAssessmentSuccess}
      />
    </Box>
  );
};

export default AssessmentDetailPage;
