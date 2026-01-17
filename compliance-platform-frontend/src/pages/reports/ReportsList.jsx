import { Box, Typography, Paper, Button } from '@mui/material';

const ReportsList = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Reports</Typography>
        <Button variant="contained" color="primary">
          Generate Report
        </Button>
      </Box>
      <Paper>
        <Typography p={2}>No reports generated yet</Typography>
      </Paper>
    </Box>
  );
};

export default ReportsList;
