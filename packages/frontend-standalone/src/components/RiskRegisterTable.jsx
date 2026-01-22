import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon
} from '@mui/icons-material';

/**
 * Risk Register Table Component
 * Displays risks in a sortable table format
 */
const RiskRegisterTable = ({ 
  risks, 
  loading, 
  onEdit, 
  onDelete,
  getRiskLevelColor,
  getRiskLevelIcon
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getMitigationStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'mitigated':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'accepted':
        return 'default';
      case 'transferred':
        return 'secondary';
      case 'open':
      default:
        return 'error';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (risks.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No risks found. Risks will be automatically created when controls are marked as "not implemented".
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Risk ID</TableCell>
            <TableCell>Risk Description</TableCell>
            <TableCell>Level</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {risks.map((risk) => (
            <TableRow 
              key={risk.id}
              sx={{ 
                '&:hover': { backgroundColor: 'action.hover' },
                backgroundColor: risk.residual_risk_score > risk.initial_risk_score 
                  ? 'error.light' 
                  : 'inherit'
              }}
            >
              <TableCell>
                <Tooltip title="Click to view details">
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <LinkIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" fontWeight="medium">
                      {risk.risk_id}
                    </Typography>
                  </Box>
                </Tooltip>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" sx={{ maxWidth: 300 }}>
                  {risk.risk_description}
                </Typography>
                {risk.control_id && (
                  <Typography variant="caption" color="text.secondary">
                    Control: {risk.control_id}
                  </Typography>
                )}
              </TableCell>
              
              <TableCell>
                <Chip
                  icon={getRiskLevelIcon(risk.risk_level)}
                  label={risk.risk_level}
                  color={getRiskLevelColor(risk.risk_level)}
                  size="small"
                />
              </TableCell>
              
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {risk.initial_risk_score}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    L:{risk.likelihood} × I:{risk.impact}
                  </Typography>
                  {risk.residual_risk_score !== null && (
                    <Typography variant="caption" display="block" color="success.main">
                      Residual: {risk.residual_risk_score}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              
              <TableCell>
                <Chip
                  label={risk.mitigation_status?.replace('_', ' ')}
                  color={getMitigationStatusColor(risk.mitigation_status)}
                  size="small"
                />
              </TableCell>
              
              <TableCell>
                <Typography variant="body2">
                  {risk.risk_owner || '-'}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography 
                  variant="body2"
                  color={
                    new Date(risk.target_closure_date) < new Date() 
                      ? 'error' 
                      : 'text.primary'
                  }
                >
                  {formatDate(risk.target_closure_date)}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Tooltip title="Edit risk">
                  <IconButton 
                    size="small" 
                    onClick={() => onEdit(risk)}
                    sx={{ mr: 0.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete risk">
                  <IconButton 
                    size="small" 
                    onClick={() => onDelete(risk.id)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RiskRegisterTable;
