const { body, param, validationResult } = require('express-validator');
const assetModel = require('../models/assetModel');
const threatModelModel = require('../models/threatModelModel');

/**
 * Asset Controller
 * Handles reusable asset operations for threat modeling
 */

const assetController = {
  /**
   * Validation rules for creating asset
   */
  createAssetValidation: [
    body('assetName')
      .trim()
      .notEmpty()
      .withMessage('Asset name is required')
      .isLength({ min: 3, max: 255 })
      .withMessage('Asset name must be between 3 and 255 characters'),
    body('assetType')
      .notEmpty()
      .withMessage('Asset type is required')
      .isIn(['data_store', 'process', 'external_entity', 'data_flow', 'trust_boundary'])
      .withMessage('Invalid asset type. Must be one of: data_store, process, external_entity, data_flow, trust_boundary'),
    body('criticality')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid criticality level. Must be one of: low, medium, high, critical'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters')
  ],

  /**
   * Validation rules for updating asset
   */
  updateAssetValidation: [
    param('id').isInt().withMessage('Asset ID must be a valid number'),
    body('assetName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Asset name must be between 3 and 255 characters'),
    body('assetType')
      .optional()
      .isIn(['data_store', 'process', 'external_entity', 'data_flow', 'trust_boundary'])
      .withMessage('Invalid asset type'),
    body('criticality')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid criticality level'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters')
  ],

  /**
   * Validation rules for asset ID parameter
   */
  idValidation: [
    param('id').isInt().withMessage('Asset ID must be a valid number')
  ],

  /**
   * Validation rules for linking/unlinking assets
   */
  linkAssetValidation: [
    param('id').isInt().withMessage('Threat model ID must be a valid number'),
    body('assetId')
      .notEmpty()
      .withMessage('Asset ID is required')
      .isInt()
      .withMessage('Asset ID must be a valid number'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters')
  ],

  /**
   * Create a new reusable asset
   * POST /api/assets
   */
  async createAsset(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        assetName,
        assetType,
        description,
        criticality = 'medium'
      } = req.body;

      // Get organization ID and user ID from authenticated user
      const organizationId = req.user.organizationId;
      const createdBy = req.user.userId;

      // Create asset
      const asset = await assetModel.createAsset(
        organizationId,
        createdBy,
        assetName,
        assetType,
        description,
        criticality
      );

      res.status(201).json({
        success: true,
        message: 'Asset created successfully',
        data: asset
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create asset',
        error: error.message
      });
    }
  },

  /**
   * Get all assets for user's organization
   * GET /api/assets
   */
  async getAssets(req, res) {
    try {
      const organizationId = req.user.organizationId;
      
      // Extract query parameters for filtering and pagination
      const {
        type,
        criticality,
        search,
        page = 1,
        limit = 100
      } = req.query;

      // Build options object
      const options = {
        offset: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit)
      };

      if (type) options.type = type;
      if (criticality) options.criticality = criticality;

      // Get assets
      let assets;
      if (search) {
        assets = await assetModel.searchAssets(organizationId, search, options);
      } else {
        assets = await assetModel.getAssetsByOrganization(organizationId, options);
      }

      res.status(200).json({
        success: true,
        message: 'Assets retrieved successfully',
        data: assets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: assets.length
        }
      });
    } catch (error) {
      console.error('Error retrieving assets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assets',
        error: error.message
      });
    }
  },

  /**
   * Get specific asset details by ID
   * GET /api/assets/:id
   */
  async getAssetById(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const assetId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to this asset
      const hasAccess = await assetModel.checkUserAccess(assetId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this asset'
        });
      }

      // Get asset with threat counts
      const asset = await assetModel.getAssetById(assetId);

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Asset retrieved successfully',
        data: asset
      });
    } catch (error) {
      console.error('Error retrieving asset:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve asset',
        error: error.message
      });
    }
  },

  /**
   * Update asset details
   * PUT /api/assets/:id
   */
  async updateAsset(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const assetId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to this asset
      const hasAccess = await assetModel.checkUserAccess(assetId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this asset'
        });
      }

      // Extract update fields from request body
      const {
        assetName,
        assetType,
        description,
        criticality
      } = req.body;

      // Build updates object with only provided fields
      const updates = {};
      if (assetName !== undefined) updates.asset_name = assetName;
      if (assetType !== undefined) updates.asset_type = assetType;
      if (description !== undefined) updates.description = description;
      if (criticality !== undefined) updates.criticality = criticality;

      // Check if there are any updates
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update'
        });
      }

      // Update asset
      const updatedAsset = await assetModel.updateAsset(assetId, updates);

      if (!updatedAsset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Asset updated successfully',
        data: updatedAsset
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update asset',
        error: error.message
      });
    }
  },

  /**
   * Delete an asset
   * DELETE /api/assets/:id
   */
  async deleteAsset(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const assetId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to this asset
      const hasAccess = await assetModel.checkUserAccess(assetId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this asset'
        });
      }

      // Get asset details to check usage
      const asset = await assetModel.getAssetById(assetId);
      
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }

      // Check if asset is linked to any threat models or has threats
      const linkedThreatModels = parseInt(asset.linked_threat_models) || 0;
      const totalThreats = parseInt(asset.total_threats) || 0;

      if (linkedThreatModels > 0 || totalThreats > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete asset that is in use',
          details: {
            linkedThreatModels,
            totalThreats,
            suggestion: 'Please unlink this asset from all threat models or delete associated threats before deleting the asset'
          }
        });
      }

      // Delete asset
      const result = await assetModel.deleteAsset(assetId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Asset deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete asset',
        error: error.message
      });
    }
  },

  /**
   * Link asset to threat model
   * POST /api/threat-models/:id/assets
   */
  async linkAsset(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const threatModelId = parseInt(req.params.id);
      const { assetId, notes } = req.body;
      const userId = req.user.userId;

      // Check if user has access to the threat model
      const hasThreatModelAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasThreatModelAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Check if user has access to the asset
      const hasAssetAccess = await assetModel.checkUserAccess(assetId, userId);
      if (!hasAssetAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this asset'
        });
      }

      // Verify threat model exists
      const threatModel = await threatModelModel.getThreatModelById(threatModelId);
      if (!threatModel) {
        return res.status(404).json({
          success: false,
          message: 'Threat model not found'
        });
      }

      // Verify asset exists
      const asset = await assetModel.getAssetById(assetId);
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }

      // Link asset to threat model
      const result = await assetModel.linkAssetToThreatModel(
        threatModelId,
        assetId,
        notes
      );

      res.status(201).json({
        success: true,
        message: 'Asset linked to threat model successfully',
        data: result
      });
    } catch (error) {
      console.error('Error linking asset to threat model:', error);
      
      // Handle duplicate link error
      if (error.message.includes('already linked')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to link asset to threat model',
        error: error.message
      });
    }
  },

  /**
   * Unlink asset from threat model
   * DELETE /api/threat-models/:id/assets/:assetId
   */
  async unlinkAsset(req, res) {
    try {
      // Validate parameters
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const threatModelId = parseInt(req.params.id);
      const assetId = parseInt(req.params.assetId);
      const userId = req.user.userId;

      // Check if user has access to the threat model
      const hasThreatModelAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasThreatModelAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Unlink asset from threat model
      const result = await assetModel.unlinkAssetFromThreatModel(threatModelId, assetId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Asset link not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Asset unlinked from threat model successfully'
      });
    } catch (error) {
      console.error('Error unlinking asset from threat model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlink asset from threat model',
        error: error.message
      });
    }
  },

  /**
   * Get all assets for a specific threat model
   * GET /api/threat-models/:id/assets
   */
  async getThreatModelAssets(req, res) {
    try {
      // Validate parameters
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const threatModelId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to the threat model
      const hasThreatModelAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasThreatModelAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Get assets for threat model with threat counts by risk level
      const assets = await assetModel.getAssetsByThreatModel(threatModelId);

      res.status(200).json({
        success: true,
        message: 'Threat model assets retrieved successfully',
        data: assets
      });
    } catch (error) {
      console.error('Error retrieving threat model assets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve threat model assets',
        error: error.message
      });
    }
  }
};

module.exports = assetController;
