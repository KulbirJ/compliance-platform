import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Slider,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { updateThreat, getMitigations, deleteMitigation } from '../../api/threats';
import { formatDate } from '../../utils/formatters';

const STRIDE_CATEGORIES = [
  { value: 'S', label: 'Spoofing', color: '#f44336' },
  { value: 'T', label: 'Tampering', color: '#ff9800' },
  { value: 'R', label: 'Repudiation', color: '#ffeb3b' },
  { value: 'I', label: 'Information Disclosure', color: '#4caf50' },
  { value: 'D', label: 'Denial of Service', color: '#2196f3' },
  { value: 'E', label: 'Elevation of Privilege', color: '#9c27b0' },
];

const STATUS_OPTIONS = [
  { value: 'identified', label: 'Identified', color: 'default' },
  { value: 'analyzing', label: 'Analyzing', color: 'info' },
  { value: 'mitigating', label: 'Mitigating', color: 'warning' },
  { value: 'mitigated', label: 'Mitigated', color: 'success' },
  { value: 'accepted', label: 'Accepted', color: 'error' },
];

const getRiskColor = (riskScore) => {
  if (riskScore >= 15) return 'error';
  if (riskScore >= 10) return 'warning';
  return 'success';
};

const getRiskLabel = (riskScore) => {
  if (riskScore >= 15) return 'High Risk';
  if (riskScore >= 10) return 'Medium Risk';
  return 'Low Risk';
};

const ThreatDetailModal = ({ open, onClose, threat, onUpdate }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mitigations, setMitigations] = useState([]);
  const [loadingMitigations, setLoadingMitigations] = useState(false);
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      threat_name: '',
      description: '',
      stride_category: 'S',
      status: 'identified',
      comments: '',
    },
  });

  useEffect(() => {
    if (open && threat) {
      reset({
        threat_name: threat.threat_name || '',
        description: threat.description || '',
        stride_category: threat.stride_category || 'S',
        status: threat.status || 'identified',
        comments: threat.comments || '',
      });
      setLikelihood(threat.likelihood || 3);
      setImpact(threat.impact || 3);
      loadMitigations();
    }
  }, [open, threat, reset]);

  const loadMitigations = async () => {
    if (!threat?.id) return;

    setLoadingMitigations(true);
    try {
      const response = await getMitigations(threat.id);
      setMitigations(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load mitigations:', err);
    } finally {
      setLoadingMitigations(false);
    }
  };

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...data,
        likelihood,
        impact,
        risk_score: likelihood * impact,
      };

      await updateThreat(threat.id, payload);

      if (onUpdate) {
        onUpdate();
      }

      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update threat');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    setLikelihood(3);
    setImpact(3);
    onClose();
  };

  const handleDeleteMitigation = async (mitigationId) => {
    if (!window.confirm('Are you sure you want to delete this mitigation?')) {
      return;
    }

    try {
      await deleteMitigation(mitigationId);
      await loadMitigations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete mitigation');
    }
  };

  const handleAddMitigation = () => {
    // Open add mitigation modal/form
    alert('Add mitigation feature - to be implemented');
  };

  const handleEditMitigation = (mitigationId) => {
    // Open edit mitigation modal/form
    alert(`Edit mitigation ${mitigationId} - to be implemented`);
  };

  const riskScore = likelihood * impact;

  const getStrideCategory = (code) => {
    return STRIDE_CATEGORIES.find((cat) => cat.value === code);
  };

  if (!threat) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Threat Details</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Threat Name */}
            <Controller
              name="threat_name"
              control={control}
              rules={{
                required: 'Threat name is required',
                minLength: {
                  value: 3,
                  message: 'Threat name must be at least 3 characters',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Threat Name"
                  fullWidth
                  required
                  error={!!errors.threat_name}
                  helperText={errors.threat_name?.message}
                />
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              rules={{
                required: 'Description is required',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  rows={3}
                  fullWidth
                  required
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            {/* Asset Info (Read-only) */}
            {threat.asset_name && (
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Asset
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {threat.asset_name}
                </Typography>
              </Box>
            )}

            {/* STRIDE Category */}
            <Controller
              name="stride_category"
              control={control}
              rules={{ required: 'STRIDE category is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="STRIDE Category"
                  fullWidth
                  required
                  error={!!errors.stride_category}
                  helperText={errors.stride_category?.message}
                >
                  {STRIDE_CATEGORIES.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: category.color,
                          }}
                        />
                        <Typography>
                          {category.value} - {category.label}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Divider />

            {/* Risk Assessment */}
            <Typography variant="h6" fontWeight="bold">
              Risk Assessment
            </Typography>

            {/* Likelihood Slider */}
            <Box>
              <Typography gutterBottom>
                Likelihood: {likelihood}
              </Typography>
              <Slider
                value={likelihood}
                onChange={(e, value) => setLikelihood(value)}
                min={1}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="textSecondary">
                  Very Unlikely
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Very Likely
                </Typography>
              </Box>
            </Box>

            {/* Impact Slider */}
            <Box>
              <Typography gutterBottom>
                Impact: {impact}
              </Typography>
              <Slider
                value={impact}
                onChange={(e, value) => setImpact(value)}
                min={1}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="textSecondary">
                  Negligible
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Critical
                </Typography>
              </Box>
            </Box>

            {/* Risk Score Display */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
                border: '2px solid',
                borderColor: `${getRiskColor(riskScore)}.main`,
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <Typography variant="overline" color="textSecondary">
                    Risk Score
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={`${getRiskColor(riskScore)}.main`}>
                    {riskScore}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Chip
                    label={getRiskLabel(riskScore)}
                    color={getRiskColor(riskScore)}
                    icon={<WarningIcon />}
                    sx={{ fontSize: '1rem', px: 2, py: 3 }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Status */}
            <Controller
              name="status"
              control={control}
              rules={{ required: 'Status is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Status"
                  fullWidth
                  required
                  error={!!errors.status}
                  helperText={errors.status?.message}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip label={option.label} size="small" color={option.color} />
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Comments */}
            <Controller
              name="comments"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Comments"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Additional notes or observations..."
                  error={!!errors.comments}
                  helperText={errors.comments?.message}
                />
              )}
            />

            <Divider />

            {/* Mitigations Section */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Mitigations ({mitigations.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddMitigation}
                >
                  Add Mitigation
                </Button>
              </Box>

              {loadingMitigations ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={30} />
                </Box>
              ) : mitigations.length === 0 ? (
                <Alert severity="info">
                  No mitigations defined yet. Add mitigations to address this threat.
                </Alert>
              ) : (
                mitigations.map((mitigation) => (
                  <Accordion key={mitigation.id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1} width="100%">
                        <Typography fontWeight="medium">
                          {mitigation.mitigation_name}
                        </Typography>
                        {mitigation.status && (
                          <Chip
                            label={mitigation.status}
                            size="small"
                            color={
                              mitigation.status === 'completed'
                                ? 'success'
                                : mitigation.status === 'in_progress'
                                ? 'warning'
                                : 'default'
                            }
                          />
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          {mitigation.description}
                        </Typography>

                        <Grid container spacing={2}>
                          {mitigation.assignee && (
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Assignee
                              </Typography>
                              <Typography variant="body2">
                                {mitigation.assignee}
                              </Typography>
                            </Grid>
                          )}
                          {mitigation.target_date && (
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Target Date
                              </Typography>
                              <Typography variant="body2">
                                {formatDate(mitigation.target_date)}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>

                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditMitigation(mitigation.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteMitigation(mitigation.id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={loading || isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ThreatDetailModal;
