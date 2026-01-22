import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import RiskRegisterTable from '../components/RiskRegisterTable';
import RiskForm from '../components/RiskForm';

/**
 * Risk Register Page
 * Displays and manages risk register entries for compliance gaps
 */
const RiskRegisterPage = () => {
  const navigate = useNavigate();
  const [risks, setRisks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    assessmentId: '',
    riskLevel: '',
    mitigationStatus: ''
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);

  // Load risks and statistics
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = {};
      if (filters.assessmentId) params.assessment_id = filters.assessmentId;
      if (filters.riskLevel) params.risk_level = filters.riskLevel;
      if (filters.mitigationStatus) params.mitigation_status = filters.mitigationStatus;

      // Load risks
      const risksResponse = await api.get('/risks', { params });
      setRisks(risksResponse.data.data);

      // Load statistics
      const statsResponse = await api.get('/risks/statistics');
      setStatistics(statsResponse.data.data);
    } catch (err) {
      console.error('Error loading risk register:', err);
      setError(err.response?.data?.message || 'Failed to load risk register');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/risks/export', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `risk-register-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting risk register:', err);
      setError('Failed to export risk register');
    }
  };

  const handleAddRisk = () => {
    setEditingRisk(null);
    setFormOpen(true);
  };

  const handleEditRisk = (risk) => {
    setEditingRisk(risk);
    setFormOpen(true);
  };

  const handleDeleteRisk = async (riskId) => {
    if (!window.confirm('Are you sure you want to delete this risk?')) {
      return;
    }

    try {
      await api.delete(`/risks/${riskId}`);
      loadData();
    } catch (err) {
      console.error('Error deleting risk:', err);
      setError('Failed to delete risk');
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingRisk(null);
  };

  const handleFormSave = async (riskData) => {
    try {
      if (editingRisk) {
        await api.put(`/risks/${editingRisk.id}`, riskData);
      } else {
        await api.post('/risks', riskData);
      }
      handleFormClose();
      loadData();
    } catch (err) {
      console.error('Error saving risk:', err);
      throw err;
    }
  };

  const getRiskLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'medium':
        return <InfoIcon color="info" />;
      case 'low':
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading && !statistics) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Risk Register
          </Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton onClick={loadData} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              sx={{ mr: 1 }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRisk}
            >
              Add Risk
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Track and manage compliance risks identified from control assessments
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {statistics.total_risks || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Risks
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {statistics.by_level?.critical || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Critical Risks
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {statistics.by_level?.high || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  High Risks
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {statistics.by_status?.mitigated || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Mitigated
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Assessment ID"
              value={filters.assessmentId}
              onChange={(e) => setFilters({ ...filters, assessmentId: e.target.value })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Risk Level"
              value={filters.riskLevel}
              onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
              size="small"
            >
              <MenuItem value="">All Levels</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Mitigation Status"
              value={filters.mitigationStatus}
              onChange={(e) => setFilters({ ...filters, mitigationStatus: e.target.value })}
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="mitigated">Mitigated</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="transferred">Transferred</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Risk Table */}
      <RiskRegisterTable
        risks={risks}
        loading={loading}
        onEdit={handleEditRisk}
        onDelete={handleDeleteRisk}
        getRiskLevelColor={getRiskLevelColor}
        getRiskLevelIcon={getRiskLevelIcon}
      />

      {/* Risk Form Dialog */}
      <RiskForm
        open={formOpen}
        risk={editingRisk}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />
    </Container>
  );
};

export default RiskRegisterPage;
