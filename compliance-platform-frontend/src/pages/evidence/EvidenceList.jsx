import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { getEvidenceList } from '../../api/evidence';
import Loading from '../../components/common/Loading';

const EvidenceList = () => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      const response = await getEvidenceList();
      setEvidence(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Evidence</Typography>
        <Button variant="contained" color="primary">
          Upload Evidence
        </Button>
      </Box>
      <Paper>
        <Typography p={2}>No evidence yet</Typography>
      </Paper>
    </Box>
  );
};

export default EvidenceList;
