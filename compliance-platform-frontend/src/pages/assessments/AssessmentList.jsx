import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { getAssessments } from '../../api/assessments';
import Loading from '../../components/common/Loading';

const AssessmentList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await getAssessments();
      setAssessments(response.data);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Assessments</Typography>
        <Button variant="contained" color="primary">
          New Assessment
        </Button>
      </Box>
      <Paper>
        {/* Assessment list will go here */}
        <Typography p={2}>No assessments yet</Typography>
      </Paper>
    </Box>
  );
};

export default AssessmentList;
