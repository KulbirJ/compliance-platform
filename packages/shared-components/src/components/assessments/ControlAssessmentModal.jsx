import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';

const STATUS_OPTIONS = [
  { value: 'fully_implemented', label: 'Fully Implemented' },
  { value: 'largely_implemented', label: 'Largely Implemented' },
  { value: 'partially_implemented', label: 'Partially Implemented' },
  { value: 'not_implemented', label: 'Not Implemented' },
  { value: 'not_applicable', label: 'Not Applicable' },
];

/**
 * ControlAssessmentModal - Shared component for assessing NIST CSF controls
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.control - Control data (subcategory_id, subcategory_name, etc.)
 * @param {string|number} props.assessmentId - Assessment ID
 * @param {Object} props.existingAssessment - Existing assessment data
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onAssessControl - Function to save control assessment
 * @param {Function} props.onUploadEvidence - Function to upload evidence
 * @param {Function} props.onDeleteEvidence - Function to delete evidence
 */
const ControlAssessmentModal = ({
  open,
  onClose,
  control,
  assessmentId,
  existingAssessment,
  onSuccess,
  onAssessControl, // API adapter function
  onUploadEvidence, // API adapter function
  onDeleteEvidence, // API adapter function
}) => {
  const [error, setError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [evidence, setEvidence] = useState([]);

  const {
    control: formControl,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      status: 'not_implemented',
      questionnaire_response: '',
      comments: '',
      remediation_plan: '',
    },
  });

  // Load existing assessment data when modal opens
  useEffect(() => {
    if (open && existingAssessment) {
      reset({
        status: existingAssessment.status || 'not_implemented',
        questionnaire_response: existingAssessment.questionnaire_response || '',
        comments: existingAssessment.comments || '',
        remediation_plan: existingAssessment.remediation_plan || '',
      });
      setEvidence(existingAssessment.evidence || []);
    } else if (open) {
      reset({
        status: 'not_implemented',
        questionnaire_response: '',
        comments: '',
        remediation_plan: '',
      });
      setEvidence([]);
    }
    setError('');
  }, [open, existingAssessment, reset]);

  const onSubmit = async (data) => {
    setError('');

    try {
      const payload = {
        subcategory_id: control.subcategory_id,
        status: data.status,
        questionnaire_response: data.questionnaire_response,
        comments: data.comments,
        remediation_plan: data.remediation_plan,
      };

      await onAssessControl(assessmentId, payload);

      // Call success callback to refresh parent
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save control assessment');
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    setEvidence([]);
    onClose();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    setError('');

    try {
      const controlAssessmentId = existingAssessment?.id;
      
      if (!controlAssessmentId) {
        setError('Please save the control assessment before uploading evidence');
        setUploadLoading(false);
        return;
      }

      const response = await onUploadEvidence(
        file,
        controlAssessmentId,
        'high', // evidence quality
        `Evidence for ${control.subcategory_id}`
      );

      // Add uploaded evidence to list
      setEvidence([...evidence, response.data?.data || response]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload evidence');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId) => {
    try {
      await onDeleteEvidence(evidenceId);
      setEvidence(evidence.filter((e) => e.id !== evidenceId));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete evidence');
    }
  };

  if (!control) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Assess Control</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {/* Control Information */}
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {control.subcategory_id} - {control.subcategory_name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {control.subcategory_description}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Assessment Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Status Dropdown */}
            <Controller
              name="status"
              control={formControl}
              rules={{ required: 'Status is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Assessment Status"
                  fullWidth
                  required
                  error={!!errors.status}
                  helperText={errors.status?.message}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Questionnaire Response */}
            <Controller
              name="questionnaire_response"
              control={formControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Questionnaire Response"
                  placeholder="Describe how this control is implemented or addressed..."
                  multiline
                  rows={4}
                  fullWidth
                  error={!!errors.questionnaire_response}
                  helperText={errors.questionnaire_response?.message}
                />
              )}
            />

            {/* Comments */}
            <Controller
              name="comments"
              control={formControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Comments"
                  placeholder="Additional notes or observations..."
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.comments}
                  helperText={errors.comments?.message}
                />
              )}
            />

            {/* Remediation Plan */}
            <Controller
              name="remediation_plan"
              control={formControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Remediation Plan"
                  placeholder="Steps to address non-compliance or gaps..."
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.remediation_plan}
                  helperText={errors.remediation_plan?.message}
                />
              )}
            />

            <Divider />

            {/* Evidence Section */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Evidence
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={uploadLoading || !existingAssessment?.id}
                  size="small"
                >
                  Upload File
                  <input
                    type="file"
                    hidden
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                </Button>
              </Box>

              {!existingAssessment?.id && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please save the control assessment first before uploading evidence.
                </Alert>
              )}

              {uploadLoading && (
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Uploading...</Typography>
                </Box>
              )}

              {evidence.length > 0 ? (
                <List dense>
                  {evidence.map((item) => (
                    <ListItem key={item.id}>
                      <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                      <ListItemText
                        primary={item.file_name || item.filename || 'Uploaded file'}
                        secondary={
                          <>
                            {item.file_type && <Chip label={item.file_type} size="small" sx={{ mr: 1 }} />}
                            {item.evidence_quality && (
                              <Chip label={item.evidence_quality} size="small" color="primary" />
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          color="error"
                          onClick={() => handleDeleteEvidence(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" py={2}>
                  No evidence uploaded yet
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save Assessment'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export { STATUS_OPTIONS };
export default ControlAssessmentModal;
