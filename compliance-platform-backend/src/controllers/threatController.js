const { body, param, validationResult } = require('express-validator');
const threatModel = require('../models/threatModel');
const threatModelModel = require('../models/threatModelModel');
const assetModel = require('../models/assetModel');

/**
 * Threat Controller
 * Handles individual threat operations within threat models
 */

const threatController = {
  /**
   * Validation rules for creating threat
   */
  createThreatValidation: [
    body('threatModelId')
      .notEmpty()
      .withMessage('Threat model ID is required')
      .isInt()
      .withMessage('Threat model ID must be a valid number'),
    body('assetId')
      .optional()
      .isInt()
      .withMessage('Asset ID must be a valid number'),
    body('strideCategoryId')
      .notEmpty()
      .withMessage('STRIDE category ID is required')
      .isInt({ min: 1, max: 6 })
      .withMessage('STRIDE category ID must be between 1 and 6'),
    body('threatTitle')
      .trim()
      .notEmpty()
      .withMessage('Threat title is required')
      .isLength({ min: 3, max: 255 })
      .withMessage('Threat title must be between 3 and 255 characters'),
    body('threatDescription')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Threat description must not exceed 5000 characters'),
    body('impactDescription')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Impact description must not exceed 5000 characters'),
    body('likelihood')
      .notEmpty()
      .withMessage('Likelihood is required')
      .isIn(['very_low', 'low', 'medium', 'high', 'very_high'])
      .withMessage('Invalid likelihood value. Must be one of: very_low, low, medium, high, very_high'),
    body('impact')
      .notEmpty()
      .withMessage('Impact is required')
      .isIn(['very_low', 'low', 'medium', 'high', 'very_high'])
      .withMessage('Invalid impact value. Must be one of: very_low, low, medium, high, very_high')
  ],

  /**
   * Validation rules for updating threat
   */
  updateThreatValidation: [
    param('id').isInt().withMessage('Threat ID must be a valid number'),
    body('threatTitle')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Threat title must be between 3 and 255 characters'),
    body('threatDescription')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Threat description must not exceed 5000 characters'),
    body('impactDescription')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Impact description must not exceed 5000 characters'),
    body('likelihood')
      .optional()
      .isIn(['very_low', 'low', 'medium', 'high', 'very_high'])
      .withMessage('Invalid likelihood value'),
    body('impact')
      .optional()
      .isIn(['very_low', 'low', 'medium', 'high', 'very_high'])
      .withMessage('Invalid impact value'),
    body('status')
      .optional()
      .isIn(['identified', 'analyzing', 'mitigating', 'mitigated', 'accepted', 'transferred'])
      .withMessage('Invalid status value'),
    body('assetId')
      .optional()
      .isInt()
      .withMessage('Asset ID must be a valid number')
  ],

  /**
   * Validation rules for threat ID parameter
   */
  idValidation: [
    param('id').isInt().withMessage('Threat ID must be a valid number')
  ],

  /**
   * Validation rules for threat model ID parameter
   */
  threatModelIdValidation: [
    param('threatModelId').isInt().withMessage('Threat model ID must be a valid number')
  ],

  /**
   * Create a new threat
   * POST /api/threats
   */
  async createThreat(req, res) {
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
        threatModelId,
        assetId,
        strideCategoryId,
        threatTitle,
        threatDescription,
        impactDescription,
        likelihood,
        impact
      } = req.body;

      const userId = req.user.userId;

      // Check if user has access to the threat model
      const hasThreatModelAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasThreatModelAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Verify threat model exists
      const threatModelExists = await threatModelModel.getThreatModelById(threatModelId);
      if (!threatModelExists) {
        return res.status(404).json({
          success: false,
          message: 'Threat model not found'
        });
      }

      // If assetId provided, verify asset exists and user has access
      if (assetId) {
        const hasAssetAccess = await assetModel.checkUserAccess(assetId, userId);
        if (!hasAssetAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this asset'
          });
        }

        const assetExists = await assetModel.getAssetById(assetId);
        if (!assetExists) {
          return res.status(404).json({
            success: false,
            message: 'Asset not found'
          });
        }
      }

      // Create threat (risk_score and risk_level auto-calculated in model)
      const threat = await threatModel.createThreat(
        threatModelId,
        assetId,
        strideCategoryId,
        threatTitle,
        threatDescription,
        likelihood,
        impact,
        userId
      );

      // Update impact_description if provided
      if (impactDescription) {
        const updatedThreat = await threatModel.updateThreat(threat.id, {
          impact_description: impactDescription
        });
        
        return res.status(201).json({
          success: true,
          message: 'Threat created successfully',
          data: updatedThreat
        });
      }

      res.status(201).json({
        success: true,
        message: 'Threat created successfully',
        data: threat
      });
    } catch (error) {
      console.error('Error creating threat:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create threat',
        error: error.message
      });
    }
  },

  /**
   * Get threats for a threat model, grouped by STRIDE category
   * GET /api/threat-models/:threatModelId/threats
   */
  async getThreats(req, res) {
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

      const threatModelId = parseInt(req.params.threatModelId);
      const userId = req.user.userId;

      // Check if user has access to the threat model
      const hasThreatModelAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasThreatModelAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Extract query parameters for filtering
      const {
        riskLevel,
        status,
        strideCategory
      } = req.query;

      // Build options object
      const options = {};
      if (riskLevel) options.riskLevel = riskLevel;
      if (status) options.status = status;
      if (strideCategory) options.strideCategory = strideCategory;

      // Get threats for threat model (already includes asset info and sorted by risk_score DESC)
      const threats = await threatModel.getThreatsByThreatModel(threatModelId, options);

      // Group threats by STRIDE category
      const groupedThreats = threats.reduce((acc, threat) => {
        const category = threat.stride_category_name || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = {
            category_code: threat.stride_category_code,
            category_name: category,
            category_description: threat.stride_category_description,
            threats: []
          };
        }
        acc[category].threats.push(threat);
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        message: 'Threats retrieved successfully',
        data: {
          threatModelId,
          totalThreats: threats.length,
          groupedByStride: Object.values(groupedThreats)
        }
      });
    } catch (error) {
      console.error('Error retrieving threats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve threats',
        error: error.message
      });
    }
  },

  /**
   * Get specific threat details by ID
   * GET /api/threats/:id
   */
  async getThreatById(req, res) {
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

      const threatId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to this threat
      const hasAccess = await threatModel.checkUserAccess(threatId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat'
        });
      }

      // Get threat with full details (includes asset, STRIDE category, user, mitigations)
      const threat = await threatModel.getThreatById(threatId);

      if (!threat) {
        return res.status(404).json({
          success: false,
          message: 'Threat not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Threat retrieved successfully',
        data: threat
      });
    } catch (error) {
      console.error('Error retrieving threat:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve threat',
        error: error.message
      });
    }
  },

  /**
   * Update threat details
   * PUT /api/threats/:id
   */
  async updateThreat(req, res) {
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

      const threatId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to this threat
      const hasAccess = await threatModel.checkUserAccess(threatId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat'
        });
      }

      // Extract update fields from request body
      const {
        threatTitle,
        threatDescription,
        impactDescription,
        likelihood,
        impact,
        status,
        assetId
      } = req.body;

      // Build updates object with only provided fields
      const updates = {};
      if (threatTitle !== undefined) updates.threat_title = threatTitle;
      if (threatDescription !== undefined) updates.threat_description = threatDescription;
      if (impactDescription !== undefined) updates.impact_description = impactDescription;
      if (likelihood !== undefined) updates.likelihood = likelihood;
      if (impact !== undefined) updates.impact = impact;
      if (status !== undefined) updates.status = status;
      if (assetId !== undefined) updates.asset_id = assetId;

      // Check if there are any updates
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update'
        });
      }

      // If assetId is being updated and is not null, verify asset exists and user has access
      if (assetId !== undefined && assetId !== null) {
        const hasAssetAccess = await assetModel.checkUserAccess(assetId, userId);
        if (!hasAssetAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this asset'
          });
        }

        const assetExists = await assetModel.getAssetById(assetId);
        if (!assetExists) {
          return res.status(404).json({
            success: false,
            message: 'Asset not found'
          });
        }
      }

      // Update threat (risk_score and risk_level auto-recalculated if likelihood/impact changes)
      const updatedThreat = await threatModel.updateThreat(threatId, updates);

      if (!updatedThreat) {
        return res.status(404).json({
          success: false,
          message: 'Threat not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Threat updated successfully',
        data: updatedThreat
      });
    } catch (error) {
      console.error('Error updating threat:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update threat',
        error: error.message
      });
    }
  },

  /**
   * Delete a threat
   * DELETE /api/threats/:id
   */
  async deleteThreat(req, res) {
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

      const threatId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to this threat
      const hasAccess = await threatModel.checkUserAccess(threatId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat'
        });
      }

      // Delete threat (will cascade to mitigations)
      const result = await threatModel.deleteThreat(threatId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Threat not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Threat and all associated mitigations deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting threat:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete threat',
        error: error.message
      });
    }
  },

  /**
   * Get high-risk threats for a threat model
   * GET /api/threat-models/:threatModelId/threats/high-risk
   */
  async getHighRiskThreats(req, res) {
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

      const threatModelId = parseInt(req.params.threatModelId);
      const userId = req.user.userId;

      // Check if user has access to the threat model
      const hasThreatModelAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasThreatModelAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Get minimum risk score from query params (default 15 = high risk)
      const minRiskScore = parseInt(req.query.minRiskScore) || 15;

      // Get high-risk threats
      const threats = await threatModel.getThreatsByRiskLevel(threatModelId, minRiskScore);

      res.status(200).json({
        success: true,
        message: 'High-risk threats retrieved successfully',
        data: {
          threatModelId,
          minRiskScore,
          totalHighRiskThreats: threats.length,
          threats
        }
      });
    } catch (error) {
      console.error('Error retrieving high-risk threats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve high-risk threats',
        error: error.message
      });
    }
  }
};

module.exports = threatController;
