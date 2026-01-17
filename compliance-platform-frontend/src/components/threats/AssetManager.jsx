import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  Visibility as ViewIcon,
  LinkOff as UnlinkIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { createAsset, linkAsset, getAssets } from '../../api/threats';

const CRITICALITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'error' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'low', label: 'Low', color: 'success' },
];

const AssetManager = ({ threatModelId, assets = [], onAssetAdded }) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Create Asset Form State
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('');
  const [newAssetDescription, setNewAssetDescription] = useState('');
  const [newAssetCriticality, setNewAssetCriticality] = useState('medium');

  // Link Asset State
  const [allAssets, setAllAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    if (linkDialogOpen) {
      loadAllAssets();
    }
  }, [linkDialogOpen]);

  const loadAllAssets = async () => {
    setLoadingAssets(true);
    try {
      // Fetch all assets from the organization (not filtered by threat model)
      const response = await getAssets();
      // Filter out assets already linked to this threat model
      const linkedAssetIds = assets.map((a) => a.id);
      const availableAssets = (response.data?.data || []).filter(
        (asset) => !linkedAssetIds.includes(asset.id)
      );
      setAllAssets(availableAssets);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assets');
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
    setError('');
    setSuccess('');
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setNewAssetName('');
    setNewAssetType('');
    setNewAssetDescription('');
    setNewAssetCriticality('medium');
    setError('');
  };

  const handleLinkDialogOpen = () => {
    setLinkDialogOpen(true);
    setError('');
    setSuccess('');
    setSearchQuery('');
    setSelectedAssetId(null);
  };

  const handleLinkDialogClose = () => {
    setLinkDialogOpen(false);
    setSearchQuery('');
    setSelectedAssetId(null);
    setError('');
  };

  const handleCreateAsset = async () => {
    if (!newAssetName.trim()) {
      setError('Asset name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createAsset(threatModelId, {
        name: newAssetName,
        type: newAssetType,
        description: newAssetDescription,
        criticality: newAssetCriticality,
      });

      setSuccess('Asset created successfully');
      handleCreateDialogClose();

      // Callback to refresh parent
      if (onAssetAdded) {
        onAssetAdded();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAsset = async () => {
    if (!selectedAssetId) {
      setError('Please select an asset to link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await linkAsset(threatModelId, selectedAssetId);

      setSuccess('Asset linked successfully');
      handleLinkDialogClose();

      // Callback to refresh parent
      if (onAssetAdded) {
        onAssetAdded();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link asset');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to unlink this asset?')) {
      return;
    }

    // Note: Unlink API endpoint would need to be implemented
    alert('Unlink asset feature - API endpoint to be implemented');
  };

  const handleViewThreats = (assetId) => {
    // Navigate or filter threats by asset
    alert(`View threats for asset ${assetId} - feature to be implemented`);
  };

  const getCriticalityColor = (criticality) => {
    const option = CRITICALITY_OPTIONS.find((opt) => opt.value === criticality);
    return option?.color || 'default';
  };

  const getThreatCount = (assetId) => {
    // This would be provided from parent or fetched from API
    const asset = assets.find((a) => a.id === assetId);
    return asset?.threat_count || 0;
  };

  const filteredAssets = allAssets.filter((asset) =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Assets ({assets.length})
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LinkIcon />}
            onClick={handleLinkDialogOpen}
          >
            Link Existing
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
          >
            Create New
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Assets List */}
      {assets.length === 0 ? (
        <Alert severity="info">
          No assets defined yet. Add assets to identify potential threats.
        </Alert>
      ) : (
        <List>
          {assets.map((asset) => (
            <Box key={asset.id}>
              <ListItem
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: 'background.paper',
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1" fontWeight="medium">
                        {asset.name}
                      </Typography>
                      {asset.type && (
                        <Chip label={asset.type} size="small" variant="outlined" />
                      )}
                      {asset.criticality && (
                        <Chip
                          label={asset.criticality}
                          size="small"
                          color={getCriticalityColor(asset.criticality)}
                        />
                      )}
                      <Chip
                        label={`${getThreatCount(asset.id)} threats`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={asset.description}
                />
                <Box display="flex" gap={1}>
                  <Tooltip title="View Threats">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewThreats(asset.id)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Unlink Asset">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleUnlinkAsset(asset.id)}
                    >
                      <UnlinkIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            </Box>
          ))}
        </List>
      )}

      {/* Create Asset Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Asset Name"
              placeholder="e.g., User Database, Payment API"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
              fullWidth
              required
              autoFocus
            />

            <TextField
              label="Asset Type"
              placeholder="e.g., Database, API, Server, Application"
              value={newAssetType}
              onChange={(e) => setNewAssetType(e.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Criticality"
              value={newAssetCriticality}
              onChange={(e) => setNewAssetCriticality(e.target.value)}
              fullWidth
            >
              {CRITICALITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={option.label}
                      size="small"
                      color={option.color}
                      sx={{ width: 80 }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </TextField>

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
          <Button onClick={handleCreateDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateAsset}
            variant="contained"
            disabled={!newAssetName.trim() || loading}
          >
            {loading ? 'Creating...' : 'Create Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link Existing Asset Dialog */}
      <Dialog
        open={linkDialogOpen}
        onClose={handleLinkDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Link Existing Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* Search Box */}
            <TextField
              placeholder="Search assets by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {/* Loading State */}
            {loadingAssets && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}

            {/* Assets List */}
            {!loadingAssets && (
              <>
                {filteredAssets.length === 0 ? (
                  <Alert severity="info">
                    {searchQuery
                      ? 'No assets found matching your search'
                      : 'No available assets to link. All assets are already linked or none exist.'}
                  </Alert>
                ) : (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Select an asset to link:</FormLabel>
                    <RadioGroup
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(parseInt(e.target.value))}
                    >
                      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {filteredAssets.map((asset) => (
                          <Box key={asset.id}>
                            <ListItem
                              button
                              onClick={() => setSelectedAssetId(asset.id)}
                              selected={selectedAssetId === asset.id}
                              sx={{
                                border: '1px solid',
                                borderColor:
                                  selectedAssetId === asset.id ? 'primary.main' : 'divider',
                                borderRadius: 1,
                                mb: 1,
                              }}
                            >
                              <FormControlLabel
                                value={asset.id}
                                control={<Radio />}
                                label={
                                  <Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Typography variant="body1" fontWeight="medium">
                                        {asset.name}
                                      </Typography>
                                      {asset.type && (
                                        <Chip label={asset.type} size="small" variant="outlined" />
                                      )}
                                      {asset.criticality && (
                                        <Chip
                                          label={asset.criticality}
                                          size="small"
                                          color={getCriticalityColor(asset.criticality)}
                                        />
                                      )}
                                    </Box>
                                    {asset.description && (
                                      <Typography variant="body2" color="textSecondary">
                                        {asset.description}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                                sx={{ width: '100%', m: 0 }}
                              />
                            </ListItem>
                          </Box>
                        ))}
                      </List>
                    </RadioGroup>
                  </FormControl>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLinkDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleLinkAsset}
            variant="contained"
            disabled={!selectedAssetId || loading}
          >
            {loading ? 'Linking...' : 'Link Asset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetManager;
