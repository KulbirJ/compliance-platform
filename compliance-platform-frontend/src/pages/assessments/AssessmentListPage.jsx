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
  IconButton,
  Typography,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import useAssessmentStore from '../../store/assessmentStore';
import { deleteAssessment } from '../../api/assessments';
import { formatDate } from '../../utils/formatters';

const AssessmentListPage = () => {
  const navigate = useNavigate();
  const { assessments, fetchAssessments, loading, error } = useAssessmentStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleCreateNew = () => {
    navigate('/assessments/new');
  };

  const handleView = (id) => {
    navigate(`/assessments/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/assessments/${id}/edit`);
  };

  const handleDeleteClick = (assessment) => {
    setSelectedAssessment(assessment);
    setDeleteDialogOpen(true);
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssessment) return;

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteAssessment(selectedAssessment.id);
      await fetchAssessments(); // Refresh the list
      setDeleteDialogOpen(false);
      setSelectedAssessment(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete assessment');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedAssessment(null);
    setDeleteError('');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'primary';
    if (progress >= 30) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading assessments...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Compliance Assessments
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage and track your compliance assessments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          size="large"
        >
          Create New Assessment
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Assessments Table */}
      {assessments.length === 0 ? (
        <Card>
          <Box py={10} textAlign="center">
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Assessments Found
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Get started by creating your first compliance assessment
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{ mt: 2 }}
            >
              Create Assessment
            </Button>
          </Box>
        </Card>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Progress</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow
                  key={assessment.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {assessment.name || 'Untitled Assessment'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {assessment.description
                        ? assessment.description.length > 60
                          ? assessment.description.substring(0, 60) + '...'
                          : assessment.description
                        : 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {assessment.assessment_date
                        ? formatDate(assessment.assessment_date)
                        : formatDate(assessment.created_at || new Date())}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={assessment.status || 'Draft'}
                      color={getStatusColor(assessment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ minWidth: 120 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={assessment.compliance_score || 0}
                          color={getProgressColor(assessment.compliance_score || 0)}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          {assessment.compliance_score || 0}%
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleView(assessment.id)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => handleEdit(assessment.id)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(assessment)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete the assessment{' '}
            <strong>"{selectedAssessment?.name}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssessmentListPage;
