import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
  Add as AddIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import useThreatStore from '../../store/threatStore';
import { 
  getThreatModelById, 
  getAssets, 
  getThreats, 
  createAsset,
  linkAsset 
} from '../../api/threats';
import { formatDate } from '../../utils/formatters';

const STRIDE_CATEGORIES = [
  { code: 'S', name: 'Spoofing', color: '#f44336' },
  { code: 'T', name: 'Tampering', color: '#ff9800' },
  { code: 'R', name: 'Repudiation', color: '#ffeb3b' },
  { code: 'I', name: 'Information Disclosure', color: '#4caf50' },
  { code: 'D', name: 'Denial of Service', color: '#2196f3' },
  { code: 'E', name: 'Elevation of Privilege', color: '#9c27b0' },
];

const getRiskColor = (riskScore) => {
  if (riskScore >= 15) return 'error';
  if (riskScore >= 10) return 'warning';
  return 'success';
};

const getRiskLabel = (riskScore) => {
  if (riskScore >= 15) return 'High';
  if (riskScore >= 10) return 'Medium';
  return 'Low';
};

const StatCard = ({ label, value, color = 'primary', icon }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={2}>
        {icon}
        <Box>
          <Typography color="textSecondary" variant="overline">
            {label}
          </Typography>
          <Typography variant="h4" color={color} fontWeight="bold">
            {value}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const ThreatModelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentThreatModel, fetchThreatModelById } = useThreatStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [assets, setAssets] = useState([]);
  const [threats, setThreats] = useState([]);
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('');
  const [newAssetDescription, setNewAssetDescription] = useState('');
  const [addingAsset, setAddingAsset] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch threat model details
      await fetchThreatModelById(id);

      // Fetch assets
      const assetsResponse = await getAssets(id);
      setAssets(assetsResponse.data?.data || []);

      // Fetch threats
      const threatsResponse = await getThreats(id);
      setThreats(threatsResponse.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load threat model details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/threats/${id}/edit`);
  };

  const handleGenerateReport = () => {
    navigate(`/reports/threat?threatModelId=${id}`);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddAsset = async () => {
    if (!newAssetName.trim()) {
      return;
    }

    setAddingAsset(true);
    setError('');

    try {
      await createAsset(id, {
        name: newAssetName,
        type: newAssetType,
        description: newAssetDescription,
      });

      setAddAssetDialogOpen(false);
      setNewAssetName('');
      setNewAssetType('');
      setNewAssetDescription('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add asset');
    } finally {
      setAddingAsset(false);
    }
  };

  const handleThreatClick = (threatId) => {
    // Navigate to threat detail or open modal
    navigate(`/threats/${id}/threat/${threatId}`);
  };

  // Calculate statistics
  const totalThreats = threats.length;
  const highRiskThreats = threats.filter((t) => t.risk_score >= 15).length;
  const mediumRiskThreats = threats.filter((t) => t.risk_score >= 10 && t.risk_score < 15).length;
  const lowRiskThreats = threats.filter((t) => t.risk_score < 10).length;

  // Group threats by STRIDE category
  const threatsByStride = STRIDE_CATEGORIES.map((category) => ({
    ...category,
    threats: threats.filter((t) => t.stride_category === category.code),
  }));

  // Risk matrix data (5x5 grid)
  const riskMatrixData = [];
  for (let likelihood = 5; likelihood >= 1; likelihood--) {
    for (let impact = 1; impact <= 5; impact++) {
      const count = threats.filter(
        (t) => t.likelihood === likelihood && t.impact === impact
      ).length;
      riskMatrixData.push({ likelihood, impact, count });
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentThreatModel) {
    return (
      <Alert severity="error">
        Threat model not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {currentThreatModel.name}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {currentThreatModel.description}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleGenerateReport}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Threat Model Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography color="textSecondary" variant="overline">
                Assessment Date
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatDate(currentThreatModel.assessment_date)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography color="textSecondary" variant="overline">
                Version
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {currentThreatModel.version || '1.0'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography color="textSecondary" variant="overline">
                Total Assets
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {assets.length}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Total Threats"
            value={totalThreats}
            icon={<AssessmentIcon color="primary" />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="High Risk"
            value={highRiskThreats}
            color="error.main"
            icon={<ErrorIcon color="error" />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Medium Risk"
            value={mediumRiskThreats}
            color="warning.main"
            icon={<WarningIcon color="warning" />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Low Risk"
            value={lowRiskThreats}
            color="success.main"
            icon={<CheckCircleIcon color="success" />}
          />
        </Grid>
      </Grid>

      {/* Risk Matrix */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Risk Matrix
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">
                      <Typography variant="caption" fontWeight="bold">
                        Likelihood / Impact
                      </Typography>
                    </TableCell>
                    {[1, 2, 3, 4, 5].map((impact) => (
                      <TableCell key={impact} align="center">
                        <Typography variant="caption" fontWeight="bold">
                          {impact}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[5, 4, 3, 2, 1].map((likelihood) => (
                    <TableRow key={likelihood}>
                      <TableCell align="center">
                        <Typography variant="caption" fontWeight="bold">
                          {likelihood}
                        </Typography>
                      </TableCell>
                      {[1, 2, 3, 4, 5].map((impact) => {
                        const riskScore = likelihood * impact;
                        const count = threats.filter(
                          (t) => t.likelihood === likelihood && t.impact === impact
                        ).length;
                        const color = getRiskColor(riskScore);

                        return (
                          <TableCell
                            key={impact}
                            align="center"
                            sx={{
                              bgcolor: count > 0
                                ? color === 'error'
                                  ? 'error.light'
                                  : color === 'warning'
                                  ? 'warning.light'
                                  : 'success.light'
                                : 'background.default',
                              fontWeight: count > 0 ? 'bold' : 'normal',
                            }}
                          >
                            {count > 0 ? count : '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs: Assets and Threats */}
      <Card>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Assets (${assets.length})`} />
          <Tab label={`Threats (${totalThreats})`} />
        </Tabs>

        <CardContent>
          {/* Assets Tab */}
          {activeTab === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Assets
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => alert('Link existing asset - feature coming soon')}
                  >
                    Link Existing
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setAddAssetDialogOpen(true)}
                  >
                    Add New Asset
                  </Button>
                </Box>
              </Box>

              {assets.length === 0 ? (
                <Alert severity="info">
                  No assets defined yet. Add assets to identify potential threats.
                </Alert>
              ) : (
                <List>
                  {assets.map((asset) => (
                    <Box key={asset.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="medium">
                                {asset.name}
                              </Typography>
                              {asset.type && (
                                <Chip label={asset.type} size="small" variant="outlined" />
                              )}
                            </Box>
                          }
                          secondary={asset.description}
                        />
                      </ListItem>
                      <Divider />
                    </Box>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Threats Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Threats by STRIDE Category
              </Typography>

              {totalThreats === 0 ? (
                <Alert severity="info">
                  No threats identified yet. Start by adding assets, then identify threats using the STRIDE methodology.
                </Alert>
              ) : (
                threatsByStride.map((category) => (
                  <Box key={category.code} mb={3}>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      mb={1}
                      sx={{
                        bgcolor: category.color + '22',
                        p: 1.5,
                        borderRadius: 1,
                        borderLeft: `4px solid ${category.color}`,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {category.code} - {category.name}
                      </Typography>
                      <Chip
                        label={`${category.threats.length} threats`}
                        size="small"
                        sx={{ bgcolor: category.color, color: 'white' }}
                      />
                    </Box>

                    {category.threats.length === 0 ? (
                      <Typography variant="body2" color="textSecondary" ml={2}>
                        No threats in this category
                      </Typography>
                    ) : (
                      <List>
                        {category.threats.map((threat) => (
                          <ListItem
                            key={threat.id}
                            button
                            onClick={() => handleThreatClick(threat.id)}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 1,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {threat.threat_name}
                                  </Typography>
                                  <Chip
                                    label={`Risk: ${threat.risk_score}`}
                                    size="small"
                                    color={getRiskColor(threat.risk_score)}
                                  />
                                  <Chip
                                    label={getRiskLabel(threat.risk_score)}
                                    size="small"
                                    color={getRiskColor(threat.risk_score)}
                                    variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="body2" color="textSecondary">
                                    {threat.description}
                                  </Typography>
                                  <Box display="flex" gap={2} mt={0.5}>
                                    <Typography variant="caption">
                                      Asset: {threat.asset_name || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption">
                                      Likelihood: {threat.likelihood}/5
                                    </Typography>
                                    <Typography variant="caption">
                                      Impact: {threat.impact}/5
                                    </Typography>
                                    {threat.status && (
                                      <Chip
                                        label={threat.status}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20 }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                ))
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Asset Dialog */}
      <Dialog
        open={addAssetDialogOpen}
        onClose={() => setAddAssetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Asset Name"
              placeholder="e.g., User Database"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Asset Type"
              placeholder="e.g., Database, API, Server"
              value={newAssetType}
              onChange={(e) => setNewAssetType(e.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              placeholder="Describe the asset and its purpose..."
              value={newAssetDescription}
              onChange={(e) => setNewAssetDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAssetDialogOpen(false)} disabled={addingAsset}>
            Cancel
          </Button>
          <Button
            onClick={handleAddAsset}
            variant="contained"
            disabled={!newAssetName.trim() || addingAsset}
          >
            {addingAsset ? 'Adding...' : 'Add Asset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThreatModelDetailPage;
