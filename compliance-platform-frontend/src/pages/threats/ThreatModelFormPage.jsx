import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { createThreatModel, getThreatModelById, updateThreatModel } from '../../api/threats';

const ThreatModelFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchLoading, setFetchLoading] = useState(isEditMode);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      modelName: '',
      description: '',
      assessmentDate: new Date().toISOString().split('T')[0],
      modelVersion: '1.0',
    },
  });

  useEffect(() => {
    if (isEditMode) {
      loadThreatModel();
    }
  }, [id]);

  const loadThreatModel = async () => {
    setFetchLoading(true);
    setError('');

    try {
      const response = await getThreatModelById(id);
      const threatModel = response.data?.data;

      reset({
        modelName: threatModel.name || '',
        description: threatModel.description || '',
        assessmentDate: threatModel.assessment_date
          ? new Date(threatModel.assessment_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        modelVersion: threatModel.version || '1.0',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load threat model');
    } finally {
      setFetchLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        await updateThreatModel(id, data);
      } else {
        await createThreatModel(data);
      }

      navigate('/threat-models');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} threat model`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/threat-models');
  };

  if (fetchLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        {isEditMode ? 'Edit Threat Model' : 'Create New Threat Model'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Name Field */}
              <Controller
                name="modelName"
                control={control}
                rules={{
                  required: 'Threat model name is required',
                  minLength: {
                    value: 3,
                    message: 'Name must be at least 3 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Threat Model Name"
                    placeholder="e.g., Web Application Security Assessment"
                    fullWidth
                    required
                    error={!!errors.modelName}
                    helperText={errors.modelName?.message}
                    disabled={loading}
                  />
                )}
              />

              {/* Description Field */}
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
                    placeholder="Describe the scope and objectives of this threat model..."
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

              {/* Assessment Date Field */}
              <Controller
                name="assessmentDate"
                control={control}
                rules={{
                  required: 'Assessment date is required',
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Assessment Date"
                    type="date"
                    fullWidth
                    required
                    error={!!errors.assessmentDate}
                    helperText={errors.assessmentDate?.message}
                    disabled={loading}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />

              {/* Version Field */}
              <Controller
                name="modelVersion"
                control={control}
                rules={{
                  required: 'Version is required',
                  pattern: {
                    value: /^\d+\.\d+$/,
                    message: 'Version must be in format X.Y (e.g., 1.0)',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Version"
                    placeholder="e.g., 1.0"
                    fullWidth
                    required
                    error={!!errors.modelVersion}
                    helperText={errors.modelVersion?.message || 'Format: X.Y (e.g., 1.0, 2.1)'}
                    disabled={loading}
                  />
                )}
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                After creating the threat model, you can add assets, identify threats using the STRIDE
                methodology, and define mitigations.
              </Alert>

              {/* Action Buttons */}
              <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
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
                    <>{isEditMode ? 'Update' : 'Create'} Threat Model</>
                  )}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ThreatModelFormPage;
