import { Card, CardContent, Typography, Box } from '@mui/material';

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
