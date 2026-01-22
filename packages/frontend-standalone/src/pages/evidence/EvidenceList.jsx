import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import { getEvidenceList, downloadEvidence, deleteEvidence } from '../../api/evidence';
import EvidenceUpload from '../../components/evidence/EvidenceUpload';
import Loading from '../../components/common/Loading';
import { formatDate, formatFileSize } from '../../utils/formatters';

const EvidenceList = () => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedControlAssessmentId, setSelectedControlAssessmentId] = useState(null);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      const response = await getEvidenceList();
      setEvidence(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUploadModal = () => {
    setUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    fetchEvidence(); // Refresh list after upload
  };

  const handleDownload = async (evidenceItem) => {
    try {
      const response = await downloadEvidence(evidenceItem.id);
      const filename = evidenceItem.file_name || evidenceItem.filename || 'evidence-file';
      saveAs(response.data, filename);
    } catch (error) {
      console.error('Failed to download evidence:', error);
      alert('Failed to download evidence');
    }
  };

  const handleDelete = async (evidenceId) => {
    if (!window.confirm('Are you sure you want to delete this evidence?')) {
      return;
    }

    try {
      await deleteEvidence(evidenceId);
      fetchEvidence();
    } catch (error) {
      console.error('Failed to delete evidence:', error);
      alert('Failed to delete evidence');
    }
  };

  const getQualityColor = (quality) => {
    switch (quality?.toLowerCase()) {
      case 'strong':
        return 'success';
      case 'medium':
        return 'warning';
      case 'weak':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Evidence Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadIcon />}
          onClick={handleOpenUploadModal}
        >
          Upload Evidence
        </Button>
      </Box>

      {evidence.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No evidence uploaded yet
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Upload evidence files to support your compliance assessments
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadIcon />}
            onClick={handleOpenUploadModal}
          >
            Upload Your First Evidence
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Quality</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evidence.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.file_name || item.filename || 'Unknown'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {item.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.evidence_quality || 'medium'}
                      color={getQualityColor(item.evidence_quality)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatFileSize(item.file_size)}</TableCell>
                  <TableCell>{formatDate(item.uploaded_at || item.created_at)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleDownload(item)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Upload Modal */}
      <Dialog
        open={uploadModalOpen}
        onClose={handleCloseUploadModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Upload Evidence</Typography>
            <IconButton onClick={handleCloseUploadModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <EvidenceUpload
            controlAssessmentId={selectedControlAssessmentId}
            onUploadComplete={handleCloseUploadModal}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EvidenceList;
