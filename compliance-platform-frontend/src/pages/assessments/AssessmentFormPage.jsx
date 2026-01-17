import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import {
  createAssessment,
  getAssessmentById,
  updateAssessment,
} from '../../api/assessments';

const AssessmentFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      assessmentName: '',
      description: '',
      assessmentDate: new Date().toISOString().split('T')[0],
      scope: '',
    },
  });

  // Fetch assessment data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchAssessment();
    }
  }, [id]);

  const fetchAssessment = async () => {
    setFetchLoading(true);
    setError('');
    try {
      const response = await getAssessmentById(id);
      const assessment = response.data?.data;
      
      // Populate form with existing data
      reset({
        assessmentName: assessment.name || '',
        description: assessment.description || '',
        assessmentDate: assessment.assessment_date
          ? new Date(assessment.assessment_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        scope: assessment.scope || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment');
    } finally {
      setFetchLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        // Update existing assessment
        await updateAssessment(id, data);
      } else {
        // Create new assessment
        await createAssessment(data);
      }

      // Redirect to assessments list on success
      navigate('/assessments');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? 'update' : 'create'} assessment`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/assessments');
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
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {isEditMode ? 'Edit Assessment' : 'Create New Assessment'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isEditMode
            ? 'Update the assessment details below'
            : 'Fill in the details to create a new compliance assessment'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Assessment Name */}
              <Grid item xs={12}>
                <Controller
                  name="assessmentName"
                  control={control}
                  rules={{
                    required: 'Assessment name is required',
                    minLength: {
                      value: 3,
                      message: 'Name must be at least 3 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Assessment Name"
                      placeholder="e.g., Q1 2026 Security Assessment"
                      error={!!errors.assessmentName}
                      helperText={errors.assessmentName?.message}
                      required
                    />
                  )}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
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
                      fullWidth
                      label="Description"
                      placeholder="Describe the purpose and scope of this assessment"
                      multiline
                      rows={4}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      required
                    />
                  )}
                />
              </Grid>

              {/* Assessment Date */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="assessmentDate"
                  control={control}
                  rules={{
                    required: 'Assessment date is required',
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Assessment Date"
                      type="date"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      error={!!errors.assessmentDate}
                      helperText={errors.assessmentDate?.message}
                      required
                    />
                  )}
                />
              </Grid>

              {/* Scope */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="scope"
                  control={control}
                  rules={{
                    required: 'Scope is required',
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Scope"
                      placeholder="e.g., Enterprise-wide, IT Infrastructure"
                      error={!!errors.scope}
                      helperText={errors.scope?.message}
                      required
                    />
                  )}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={isSubmitting || loading}
                    size="large"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting || loading}
                    size="large"
                  >
                    {loading || isSubmitting ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        {isEditMode ? 'Updating...' : 'Creating...'}
                      </>
                    ) : isEditMode ? (
                      'Update Assessment'
                    ) : (
                      'Create Assessment'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Helper Text */}
      <Box mt={3}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Tip:</strong> After creating the assessment, you'll be able to add
            control assessments and evidence from the assessment detail page.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default AssessmentFormPage;
