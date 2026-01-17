import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import useAssessmentStore from '../../store/assessmentStore';
import useThreatStore from '../../store/threatStore';
import { formatDate } from '../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const RISK_COLORS = {
  high: '#f44336',
  medium: '#ff9800',
  low: '#4caf50',
};

const StatCard = ({ title, value, icon, color = 'primary' }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography color="textSecondary" variant="overline" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: 2,
              p: 1.5,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardPage = () => {
  const { assessments, fetchAssessments, loading: assessmentLoading } = useAssessmentStore();
  const { threatModels, threats, fetchThreatModels, fetchThreats, loading: threatLoading } = useThreatStore();
  const [complianceData, setComplianceData] = useState([]);
  const [strideData, setStrideData] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Fetch data on component mount
    fetchAssessments();
    fetchThreatModels();
  }, [fetchAssessments, fetchThreatModels]);

  useEffect(() => {
    // Process compliance data for chart
    if (assessments.length > 0) {
      const data = assessments.slice(0, 5).map((assessment) => ({
        name: assessment.name?.substring(0, 15) + '...' || 'Assessment',
        score: assessment.compliance_score || 0,
      }));
      setComplianceData(data);

      // Prepare recent activity
      const activities = assessments
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          type: 'assessment',
          title: a.name,
          date: a.created_at,
          status: a.status,
        }));
      setRecentActivity(activities);
    }
  }, [assessments]);

  useEffect(() => {
    // Process STRIDE data for pie chart
    if (threats.length > 0) {
      const strideCounts = threats.reduce((acc, threat) => {
        const category = threat.stride_category || 'Unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      const data = Object.entries(strideCounts).map(([name, value]) => ({
        name,
        value,
      }));
      setStrideData(data);

      // Process risk data
      const riskCounts = threats.reduce((acc, threat) => {
        const risk = threat.risk_level || 'low';
        acc[risk] = (acc[risk] || 0) + 1;
        return acc;
      }, {});

      const riskChartData = [
        { name: 'High', count: riskCounts.high || 0, color: RISK_COLORS.high },
        { name: 'Medium', count: riskCounts.medium || 0, color: RISK_COLORS.medium },
        { name: 'Low', count: riskCounts.low || 0, color: RISK_COLORS.low },
      ];
      setRiskData(riskChartData);
    }
  }, [threats]);

  const highRiskCount = threats.filter((t) => t.risk_level === 'high' || t.risk_level === 'critical').length;
  const loading = assessmentLoading || threatLoading;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Overview of your compliance and security posture
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assessments"
            value={assessments.length}
            icon={<AssessmentIcon fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Threat Models"
            value={threatModels.length}
            icon={<SecurityIcon fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="High Risk Threats"
            value={highRiskCount}
            icon={<WarningIcon fontSize="large" />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Threats"
            value={threats.length}
            icon={<TrendingUpIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Compliance Score Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Scores by Assessment
              </Typography>
              {complianceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#667eea" name="Compliance Score %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box py={10} textAlign="center">
                  <Typography color="textSecondary">No assessment data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* STRIDE Categories Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Threats by STRIDE Category
              </Typography>
              {strideData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={strideData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {strideData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box py={10} textAlign="center">
                  <Typography color="textSecondary">No threat data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Risk Distribution and Recent Activity Row */}
      <Grid container spacing={3}>
        {/* Risk Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Distribution
              </Typography>
              {riskData.length > 0 && riskData.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Threat Count">
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box py={10} textAlign="center">
                  <Typography color="textSecondary">No risk data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {recentActivity.length > 0 ? (
                <List>
                  {recentActivity.map((activity, index) => (
                    <Box key={activity.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1">{activity.title}</Typography>
                              {activity.status && (
                                <Chip
                                  label={activity.status}
                                  size="small"
                                  color={
                                    activity.status === 'completed'
                                      ? 'success'
                                      : activity.status === 'in_progress'
                                      ? 'primary'
                                      : 'default'
                                  }
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="textSecondary">
                              {activity.date ? formatDate(activity.date) : 'Unknown date'}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < recentActivity.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              ) : (
                <Box py={10} textAlign="center">
                  <Typography color="textSecondary">No recent activity</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
