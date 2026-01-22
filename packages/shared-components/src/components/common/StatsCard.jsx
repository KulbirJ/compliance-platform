import { Card, CardContent, Typography, Box } from '@mui/material';

/**
 * StatsCard - Reusable statistics card component
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Display value
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.color - MUI color name (default: 'primary')
 */
const StatsCard = ({ title, value, icon, color = 'primary' }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Box color={`${color}.main`}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
