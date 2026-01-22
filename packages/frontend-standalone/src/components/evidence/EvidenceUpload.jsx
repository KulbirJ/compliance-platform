import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import { uploadEvidence, downloadEvidence, deleteEvidence, getEvidenceList } from '../../api/evidence';
import { formatDate, formatFileSize } from '../../utils/formatters';

const EVIDENCE_QUALITY_OPTIONS = [
  { value: 'weak', label: 'Weak' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const EvidenceUpload = ({ controlAssessmentId, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [quality, setQuality] = useState('medium');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [evidenceList, setEvidenceList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (controlAssessmentId) {
      loadEvidenceList();
    }
  }, [controlAssessmentId]);

  const loadEvidenceList = async () => {
    try {
      const response = await getEvidenceList({ controlAssessmentId });
      setEvidenceList(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load evidence list:', err);
    }
  };

  const validateFile = (file) => {
    if (!file) {
      setError('Please select a file');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      return false;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('File type not supported. Please upload PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, or TXT files');
      return false;
    }

    return true;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!validateFile(selectedFile)) {
      return;
    }

    // Make controlAssessmentId optional - can be null for general evidence uploads
    // if (!controlAssessmentId) {
    //   setError('Control assessment ID is required');
    //   return;
    // }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // Simulate progress (since axios doesn't easily support progress in this setup)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await uploadEvidence(selectedFile, controlAssessmentId, quality, description);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSuccess('Evidence uploaded successfully!');
      setSelectedFile(null);
      setDescription('');
      setQuality('medium');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh evidence list
      await loadEvidenceList();

      // Call the callback if provided
      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
        }, 1500);
      } else {
        // Clear success message after 3 seconds if no callback
        setTimeout(() => {
          setSuccess('');
          setUploadProgress(0);
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload evidence');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (evidence) => {
    try {
      const response = await downloadEvidence(evidence.id);
      const filename = evidence.file_name || evidence.filename || 'evidence-file';
      saveAs(response.data, filename);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download evidence');
    }
  };

  const handleDelete = async (evidenceId) => {
    if (!window.confirm('Are you sure you want to delete this evidence?')) {
      return;
    }

    try {
      await deleteEvidence(evidenceId);
      setSuccess('Evidence deleted successfully');
      await loadEvidenceList();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete evidence');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return '📊';
    if (fileType?.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <Box>
      {/* Upload Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'grey.300',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s',
          cursor: 'pointer',
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h6" align="center">
            {selectedFile ? selectedFile.name : 'Drag & drop file here or click to select'}
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            Supported: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT (Max {formatFileSize(MAX_FILE_SIZE)})
          </Typography>
          {selectedFile && (
            <Chip
              icon={<CheckCircleIcon />}
              label={`Selected: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`}
              color="success"
              variant="outlined"
            />
          )}
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
        />
      </Paper>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <TextField
          select
          label="Evidence Quality"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          fullWidth
          disabled={uploading}
        >
          {EVIDENCE_QUALITY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Description"
          placeholder="Describe this evidence and its relevance..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          fullWidth
          disabled={uploading}
        />

        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          size="large"
        >
          {uploading ? 'Uploading...' : 'Upload Evidence'}
        </Button>
      </Box>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
            {uploadProgress}% uploaded
          </Typography>
        </Box>
      )}

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Evidence List */}
      <Typography variant="h6" gutterBottom>
        Uploaded Evidence ({evidenceList.length})
      </Typography>

      {evidenceList.length === 0 ? (
        <Alert severity="info">No evidence uploaded yet</Alert>
      ) : (
        <List>
          {evidenceList.map((evidence) => (
            <ListItem
              key={evidence.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ mr: 2, fontSize: '2rem' }}>
                {getFileIcon(evidence.file_type)}
              </Box>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1" fontWeight="medium">
                      {evidence.file_name || evidence.filename || 'Unnamed file'}
                    </Typography>
                    {evidence.evidence_quality && (
                      <Chip
                        label={evidence.evidence_quality}
                        size="small"
                        color={
                          evidence.evidence_quality === 'strong'
                            ? 'success'
                            : evidence.evidence_quality === 'medium'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    {evidence.description && (
                      <Typography variant="body2" color="textSecondary">
                        {evidence.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="textSecondary">
                      {evidence.file_type && `${evidence.file_type} • `}
                      {evidence.file_size && `${formatFileSize(evidence.file_size)} • `}
                      Uploaded {formatDate(evidence.upload_date || evidence.created_at)}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleDownload(evidence)}
                  sx={{ mr: 1 }}
                  title="Download"
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDelete(evidence.id)}
                  color="error"
                  title="Delete"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default EvidenceUpload;
