import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { getThreatModels } from '../../api/threats';
import Loading from '../../components/common/Loading';

const ThreatModelList = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await getThreatModels();
      setModels(response.data);
    } catch (error) {
      console.error('Failed to fetch threat models:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Threat Models</Typography>
        <Button variant="contained" color="primary">
          New Threat Model
        </Button>
      </Box>
      <Paper>
        <Typography p={2}>No threat models yet</Typography>
      </Paper>
    </Box>
  );
};

export default ThreatModelList;
