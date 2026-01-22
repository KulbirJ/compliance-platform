import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider
} from '@mui/material';

/**
 * Risk Form Component
 * Form for creating and editing risk register entries
 */
const RiskForm = ({ open, risk, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    assessment_id: '',
    control_id: '',
    risk_description: '',
    likelihood: 3,
    impact: 3,
    risk_category: '',
    affected_assets: '',
    mitigation_strategy: '',
    mitigation_status: 'open',
    risk_owner: '',
    target_closure_date: '',
    residual_likelihood: null,
    residual_impact: null,
    mitigation_notes: ''
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Initialize form when risk prop changes
  useEffect(() => {
    if (risk) {
      setFormData({
        assessment_id: risk.assessment_id || '',
        control_id: risk.control_id || '',
        risk_description: risk.risk_description || '',
        likelihood: risk.likelihood || 3,
        impact: risk.impact || 3,
        risk_category: risk.risk_category || '',
        affected_assets: risk.affected_assets || '',
        mitigation_strategy: risk.mitigation_strategy || '',
        mitigation_status: risk.mitigation_status || 'open',
        risk_owner: risk.risk_owner || '',
        target_closure_date: risk.target_closure_date 
          ? new Date(risk.target_closure_date).toISOString().split('T')[0]
          : '',
        residual_likelihood: risk.residual_likelihood || null,
        residual_impact: risk.residual_impact || null,
        mitigation_notes: risk.mitigation_notes || ''
      });
    } else {
      // Reset form for new risk
      setFormData({
        assessment_id: '',
        control_id: '',
        risk_description: '',
        likelihood: 3,
        impact: 3,
        risk_category: '',
        affected_assets: '',
        mitigation_strategy: '',
        mitigation_status: 'open',
        risk_owner: '',
        target_closure_date: '',
        residual_likelihood: null,
        residual_impact: null,
        mitigation_notes: ''
      });
    }
    setError(null);
  }, [risk, open]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!formData.risk_description) {
        setError('Risk description is required');
        return;
      }

      await onSave(formData);
    } catch (err) {
      console.error('Error saving risk:', err);
      setError(err.response?.data?.message || 'Failed to save risk');
    } finally {
      setSaving(false);
    }
  };

  const calculateRiskScore = (likelihood, impact) => {
    return likelihood * impact;
  };

  const getRiskLevel = (score) => {
    if (score >= 17) return 'Critical';
    if (score >= 10) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
  };

  const initialRiskScore = calculateRiskScore(formData.likelihood, formData.impact);
  const initialRiskLevel = getRiskLevel(initialRiskScore);
  
  const residualRiskScore = formData.residual_likelihood && formData.residual_impact
    ? calculateRiskScore(formData.residual_likelihood, formData.residual_impact)
    : null;
  const residualRiskLevel = residualRiskScore ? getRiskLevel(residualRiskScore) : null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {risk ? 'Edit Risk' : 'Add New Risk'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Assessment ID"
              value={formData.assessment_id}
              onChange={handleChange('assessment_id')}
              type="number"
              helperText="Optional: Link to specific assessment"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Control ID"
              value={formData.control_id}
              onChange={handleChange('control_id')}
              helperText="Optional: Link to specific control"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Risk Description"
              value={formData.risk_description}
              onChange={handleChange('risk_description')}
              multiline
              rows={3}
              placeholder="Describe the risk in detail..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Risk Category"
              value={formData.risk_category}
              onChange={handleChange('risk_category')}
            >
              <MenuItem value="">Select category</MenuItem>
              <MenuItem value="Strategic">Strategic</MenuItem>
              <MenuItem value="Operational">Operational</MenuItem>
              <MenuItem value="Financial">Financial</MenuItem>
              <MenuItem value="Compliance">Compliance</MenuItem>
              <MenuItem value="Reputational">Reputational</MenuItem>
              <MenuItem value="Technology">Technology</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Affected Assets"
              value={formData.affected_assets}
              onChange={handleChange('affected_assets')}
              placeholder="e.g., Customer Data, Payment Systems"
            />
          </Grid>

          {/* Initial Risk Assessment */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Initial Risk Assessment
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Likelihood (1-5)</InputLabel>
              <Select
                value={formData.likelihood}
                onChange={handleChange('likelihood')}
                label="Likelihood (1-5)"
              >
                <MenuItem value={1}>1 - Rare</MenuItem>
                <MenuItem value={2}>2 - Unlikely</MenuItem>
                <MenuItem value={3}>3 - Possible</MenuItem>
                <MenuItem value={4}>4 - Likely</MenuItem>
                <MenuItem value={5}>5 - Almost Certain</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Impact (1-5)</InputLabel>
              <Select
                value={formData.impact}
                onChange={handleChange('impact')}
                label="Impact (1-5)"
              >
                <MenuItem value={1}>1 - Insignificant</MenuItem>
                <MenuItem value={2}>2 - Minor</MenuItem>
                <MenuItem value={3}>3 - Moderate</MenuItem>
                <MenuItem value={4}>4 - Major</MenuItem>
                <MenuItem value={5}>5 - Catastrophic</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2">
                Initial Risk Score: <strong>{initialRiskScore}</strong> ({initialRiskLevel})
              </Typography>
            </Box>
          </Grid>

          {/* Mitigation */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Mitigation
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mitigation Strategy"
              value={formData.mitigation_strategy}
              onChange={handleChange('mitigation_strategy')}
              multiline
              rows={3}
              placeholder="Describe how this risk will be mitigated..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Mitigation Status</InputLabel>
              <Select
                value={formData.mitigation_status}
                onChange={handleChange('mitigation_status')}
                label="Mitigation Status"
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="mitigated">Mitigated</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="transferred">Transferred</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Risk Owner"
              value={formData.risk_owner}
              onChange={handleChange('risk_owner')}
              placeholder="Person responsible for this risk"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Target Closure Date"
              type="date"
              value={formData.target_closure_date}
              onChange={handleChange('target_closure_date')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Residual Risk */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Residual Risk (After Mitigation)
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Residual Likelihood</InputLabel>
              <Select
                value={formData.residual_likelihood || ''}
                onChange={handleChange('residual_likelihood')}
                label="Residual Likelihood"
              >
                <MenuItem value="">Not assessed</MenuItem>
                <MenuItem value={1}>1 - Rare</MenuItem>
                <MenuItem value={2}>2 - Unlikely</MenuItem>
                <MenuItem value={3}>3 - Possible</MenuItem>
                <MenuItem value={4}>4 - Likely</MenuItem>
                <MenuItem value={5}>5 - Almost Certain</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Residual Impact</InputLabel>
              <Select
                value={formData.residual_impact || ''}
                onChange={handleChange('residual_impact')}
                label="Residual Impact"
              >
                <MenuItem value="">Not assessed</MenuItem>
                <MenuItem value={1}>1 - Insignificant</MenuItem>
                <MenuItem value={2}>2 - Minor</MenuItem>
                <MenuItem value={3}>3 - Moderate</MenuItem>
                <MenuItem value={4}>4 - Major</MenuItem>
                <MenuItem value={5}>5 - Catastrophic</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {residualRiskScore && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="body2">
                  Residual Risk Score: <strong>{residualRiskScore}</strong> ({residualRiskLevel})
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mitigation Notes"
              value={formData.mitigation_notes}
              onChange={handleChange('mitigation_notes')}
              multiline
              rows={2}
              placeholder="Additional notes about mitigation efforts..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Saving...' : (risk ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RiskForm;
