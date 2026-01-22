import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { getAssessmentById } from '../../api/assessments';
import Loading from '../../components/common/Loading';

const AssessmentDetail = () => {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const response = await getAssessmentById(id);
      setAssessment(response.data);
    } catch (error) {
      console.error('Failed to fetch assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Assessment Details
      </Typography>
      <Paper p={3}>
        {/* Assessment details will go here */}
      </Paper>
    </Box>
  );
};

export default AssessmentDetail;
