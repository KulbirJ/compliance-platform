import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { createMitigation, updateMitigation } from '../../api/threats';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'deferred', label: 'Deferred' },
  { value: 'cancelled', label: 'Cancelled' },
];

const MitigationForm = ({
  threatId,
  existingMitigation = null,
  onSave,
  onCancel,
  open = true,
}) => {
  const isEditMode = Boolean(existingMitigation);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      mitigation_name: '',
      description: '',
      status: 'planned',
      residual_risk_score: '',
      assignee: '',
      target_date: '',
    },
  });

  useEffect(() => {
    if (existingMitigation) {
      reset({
        mitigation_name: existingMitigation.mitigation_name || '',
        description: existingMitigation.description || '',
        status: existingMitigation.status || 'planned',
        residual_risk_score: existingMitigation.residual_risk_score || '',
        assignee: existingMitigation.assignee || '',
        target_date: existingMitigation.target_date
          ? new Date(existingMitigation.target_date).toISOString().split('T')[0]
          : '',
      });
    }
  }, [existingMitigation, reset]);

  const onSubmit = async (data) => {
    if (!threatId) {
      setError('Threat ID is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        ...data,
        residual_risk_score: data.residual_risk_score ? parseInt(data.residual_risk_score) : null,
      };

      if (isEditMode) {
        await updateMitigation(existingMitigation.id, payload);
      } else {
        await createMitigation(threatId, payload);
      }

      // Call success callback
      if (onSave) {
        onSave();
      }

      // Reset form
      reset();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} mitigation`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setError('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit Mitigation' : 'Add New Mitigation'}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Mitigation Name */}
            <Controller
              name="mitigation_name"
              control={control}
              rules={{
                required: 'Mitigation name is required',
                minLength: {
                  value: 3,
                  message: 'Mitigation name must be at least 3 characters',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mitigation Name"
                  placeholder="e.g., Implement Multi-Factor Authentication"
                  fullWidth
                  required
                  autoFocus
                  error={!!errors.mitigation_name}
                  helperText={errors.mitigation_name?.message}
                  disabled={loading}
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
                  placeholder="Describe the mitigation strategy and implementation approach..."
                  multiline
                  rows={4}
                  fullWidth
                  required
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={loading}
                />
              )}
            />

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
                  disabled={loading}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Residual Risk Score */}
            <Controller
              name="residual_risk_score"
              control={control}
              rules={{
                min: {
                  value: 1,
                  message: 'Risk score must be at least 1',
                },
                max: {
                  value: 25,
                  message: 'Risk score must not exceed 25',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Residual Risk Score"
                  type="number"
                  placeholder="1-25"
                  fullWidth
                  error={!!errors.residual_risk_score}
                  helperText={
                    errors.residual_risk_score?.message ||
                    'Expected risk score after implementing this mitigation (1-25)'
                  }
                  disabled={loading}
                  InputProps={{
                    inputProps: { min: 1, max: 25 },
                  }}
                />
              )}
            />

            {/* Assignee */}
            <Controller
              name="assignee"
              control={control}
              rules={{
                required: 'Assignee is required',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Assigned To"
                  placeholder="e.g., John Doe, Security Team"
                  fullWidth
                  required
                  error={!!errors.assignee}
                  helperText={errors.assignee?.message || 'Person or team responsible for this mitigation'}
                  disabled={loading}
                />
              )}
            />

            {/* Target Date */}
            <Controller
              name="target_date"
              control={control}
              rules={{
                required: 'Target date is required',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Target Date"
                  type="date"
                  fullWidth
                  required
                  error={!!errors.target_date}
                  helperText={errors.target_date?.message || 'Expected completion date'}
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              )}
            />

            {!isEditMode && (
              <Alert severity="info">
                After creating the mitigation, you can track its progress and update its status.
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCancel}
            startIcon={<CancelIcon />}
            disabled={loading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditMode ? 'Update' : 'Create'} Mitigation</>
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MitigationForm;
