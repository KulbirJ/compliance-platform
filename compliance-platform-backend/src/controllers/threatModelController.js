const { body, param, validationResult } = require('express-validator');
const threatModelModel = require('../models/threatModelModel');
const { query } = require('../config/database');

/**
 * Threat Model Controller
 * Handles threat model operations for STRIDE threat modeling
 */

const threatModelController = {
  /**
   * Validation rules for creating threat model
   */
  createThreatModelValidation: [
    body('modelName')
      .trim()
      .notEmpty()
      .withMessage('Model name is required')
      .isLength({ min: 3, max: 255 })
      .withMessage('Model name must be between 3 and 255 characters'),
    body('systemName')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('System name must not exceed 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('scope')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Scope must not exceed 5000 characters'),
    body('assessmentDate')
      .optional()
      .isISO8601()
      .withMessage('Assessment date must be a valid date'),
    body('modelVersion')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Model version must not exceed 50 characters')
  ],

  /**
   * Validation rules for updating threat model
   */
  updateThreatModelValidation: [
    param('id').isInt().withMessage('Threat model ID must be a valid number'),
    body('modelName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Model name must be between 3 and 255 characters'),
    body('systemName')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('System name must not exceed 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('scope')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Scope must not exceed 5000 characters'),
    body('status')
      .optional()
      .isIn(['draft', 'in_review', 'approved', 'archived'])
      .withMessage('Invalid status value'),
    body('riskScore')
      .optional()
      .isFloat({ min: 0, max: 25 })
      .withMessage('Risk score must be between 0 and 25'),
    body('modelVersion')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Model version must not exceed 50 characters')
  ],

  /**
   * Validation rules for threat model ID parameter
   */
  idValidation: [
    param('id').isInt().withMessage('Threat model ID must be a valid number')
  ],

  /**
   * Create a new threat model
   * POST /api/threat-models
   */
  async createThreatModel(req, res) {
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
        modelName,
        systemName,
        description,
        scope,
        assessmentDate,
        modelVersion
      } = req.body;

      const userId = req.user.userId;

      // Get user's organization(s)
      const orgResult = await query(
        'SELECT organization_id FROM user_organizations WHERE user_id = $1 LIMIT 1',
        [userId]
      );

      if (orgResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User is not associated with any organization.'
        });
      }

      const organizationId = orgResult.rows[0].organization_id;

      // Create threat model
      const threatModel = await threatModelModel.createThreatModel(
        organizationId,
        userId,
        modelName,
        description,
        assessmentDate,
        modelVersion || '1.0'
      );

      // Update system_name and scope if provided (these aren't in createThreatModel params)
      if (systemName || scope) {
        const updates = {};
        if (systemName) updates.system_name = systemName;
        if (scope) updates.scope = scope;
        
        const updatedModel = await threatModelModel.updateThreatModel(
          threatModel.id,
          updates
        );
        
        return res.status(201).json({
          success: true,
          message: 'Threat model created successfully',
          data: updatedModel
        });
      }

      res.status(201).json({
        success: true,
        message: 'Threat model created successfully',
        data: threatModel
      });
    } catch (error) {
      console.error('Error creating threat model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create threat model',
        error: error.message
      });
    }
  },

  /**
   * Get all threat models for user's organization
   * GET /api/threat-models
   */
  async getThreatModels(req, res) {
    try {
      const organizationId = req.user.organizationId;
      
      // Extract query parameters for filtering and pagination
      const {
        status,
        search,
        page = 1,
        limit = 20
      } = req.query;

      // Build filters object
      const filters = {};
      if (status) filters.status = status;
      if (search) filters.search = search;

      // Get threat models with statistics
      const threatModels = await threatModelModel.getThreatModelsByOrganization(
        organizationId,
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: 'Threat models retrieved successfully',
        data: threatModels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: threatModels.length
        }
      });
    } catch (error) {
      console.error('Error retrieving threat models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve threat models',
        error: error.message
      });
    }
  },

  /**
   * Get detailed threat model information by ID
   * GET /api/threat-models/:id
   */
  async getThreatModelById(req, res) {
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
      const userId = req.user.userId;

      // Check if user has access to this threat model
      const hasAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Get threat model with full statistics
      const threatModel = await threatModelModel.getThreatModelWithStats(threatModelId);

      if (!threatModel) {
        return res.status(404).json({
          success: false,
          message: 'Threat model not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Threat model retrieved successfully',
        data: threatModel
      });
    } catch (error) {
      console.error('Error retrieving threat model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve threat model',
        error: error.message
      });
    }
  },

  /**
   * Update threat model details
   * PUT /api/threat-models/:id
   */
  async updateThreatModel(req, res) {
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
      const userId = req.user.userId;

      // Check if user has access to this threat model
      const hasAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Extract update fields from request body
      const {
        modelName,
        systemName,
        description,
        scope,
        status,
        riskScore,
        modelVersion
      } = req.body;

      // Build updates object with only provided fields
      const updates = {};
      if (modelName !== undefined) updates.model_name = modelName;
      if (systemName !== undefined) updates.system_name = systemName;
      if (description !== undefined) updates.description = description;
      if (scope !== undefined) updates.scope = scope;
      if (status !== undefined) updates.status = status;
      if (riskScore !== undefined) updates.risk_score = riskScore;
      if (modelVersion !== undefined) updates.model_version = modelVersion;

      // Check if there are any updates
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update'
        });
      }

      // Update threat model
      const updatedThreatModel = await threatModelModel.updateThreatModel(
        threatModelId,
        updates
      );

      if (!updatedThreatModel) {
        return res.status(404).json({
          success: false,
          message: 'Threat model not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Threat model updated successfully',
        data: updatedThreatModel
      });
    } catch (error) {
      console.error('Error updating threat model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update threat model',
        error: error.message
      });
    }
  },

  /**
   * Delete a threat model
   * DELETE /api/threat-models/:id
   */
  async deleteThreatModel(req, res) {
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
      const userId = req.user.userId;

      // Check if user has access to this threat model
      const hasAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Delete threat model (will cascade to threats, assets, etc.)
      const result = await threatModelModel.deleteThreatModel(threatModelId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Threat model not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Threat model and all associated data deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting threat model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete threat model',
        error: error.message
      });
    }
  },

  /**
   * Get detailed statistics for a threat model
   * GET /api/threat-models/:id/stats
   */
  async getThreatModelStats(req, res) {
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
      const userId = req.user.userId;

      // Check if user has access to this threat model
      const hasAccess = await threatModelModel.checkUserAccess(userId, threatModelId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat model'
        });
      }

      // Get comprehensive statistics
      const stats = await threatModelModel.getThreatModelWithStats(threatModelId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Threat model not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Threat model statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error retrieving threat model statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve threat model statistics',
        error: error.message
      });
    }
  }
};

module.exports = threatModelController;
