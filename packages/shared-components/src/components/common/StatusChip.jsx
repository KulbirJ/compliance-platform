import { Chip } from '@mui/material';

/**
 * StatusChip - Reusable status indicator chip
 * 
 * @param {Object} props
 * @param {string} props.status - Status value
 * @param {Object} props.statusConfig - Status configuration map
 */
const StatusChip = ({ status, statusConfig, ...chipProps }) => {
  const config = statusConfig?.[status] || { label: status, color: 'default' };
  
  return (
    <Chip 
      label={config.label || status}
      color={config.color || 'default'}
      size="small"
      {...chipProps}
    />
  );
};

export default StatusChip;
