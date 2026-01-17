import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import useThreatStore from '../../store/threatStore';
import { deleteThreatModel } from '../../api/threats';
import { formatDate } from '../../utils/formatters';

const ThreatModelListPage = () => {
  const navigate = useNavigate();
  const { threatModels, fetchThreatModels, loading: storeLoading } = useThreatStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedThreatModel, setSelectedThreatModel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadThreatModels();
  }, []);

  const loadThreatModels = async () => {
    setLoading(true);
    setError('');
    try {
      await fetchThreatModels();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load threat models');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/threat-models/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/threat-models/${id}/edit`);
  };

  const handleDeleteClick = (threatModel) => {
    setSelectedThreatModel(threatModel);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedThreatModel) return;

    setDeleting(true);
    setError('');

    try {
      await deleteThreatModel(selectedThreatModel.id);
      setDeleteDialogOpen(false);
      setSelectedThreatModel(null);
      await loadThreatModels(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete threat model');
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedThreatModel(null);
  };

  const handleCreateNew = () => {
    navigate('/threat-models/new');
  };

  const getHighRiskThreatsCount = (threatModel) => {
    // Count threats with risk_score >= 15
    if (!threatModel.threats || !Array.isArray(threatModel.threats)) {
      return 0;
    }
    return threatModel.threats.filter((threat) => threat.risk_score >= 15).length;
  };

  const getTotalThreatsCount = (threatModel) => {
    if (!threatModel.threats || !Array.isArray(threatModel.threats)) {
      return threatModel.threat_count || 0;
    }
    return threatModel.threats.length;
  };

  if (loading || storeLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Threat Models
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Create New Threat Model
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Threat Models Table */}
      {threatModels.length === 0 ? (
        <Card>
          <Box p={6} textAlign="center">
            <WarningIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Threat Models Found
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Get started by creating your first threat model to identify and assess security threats.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateNew}>
              Create First Threat Model
            </Button>
          </Box>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography fontWeight="bold">Name</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">Description</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">Assessment Date</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold">Total Threats</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold">High-Risk Threats</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">Actions</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {threatModels.map((threatModel) => {
                  const totalThreats = getTotalThreatsCount(threatModel);
                  const highRiskThreats = getHighRiskThreatsCount(threatModel);

                  return (
                    <TableRow
                      key={threatModel.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {threatModel.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {threatModel.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(threatModel.assessment_date || threatModel.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={totalThreats}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {highRiskThreats > 0 ? (
                          <Tooltip title="Threats with risk score ≥ 15">
                            <Chip
                              label={highRiskThreats}
                              color="error"
                              size="small"
                              icon={<WarningIcon />}
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            label="0"
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewDetails(threatModel.id)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => handleEdit(threatModel.id)}
                            sx={{ ml: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(threatModel)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Threat Model</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the threat model "
            <strong>{selectedThreatModel?.name}</strong>"? This action cannot be undone
            and will also delete all associated threats, assets, and mitigations.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThreatModelListPage;
