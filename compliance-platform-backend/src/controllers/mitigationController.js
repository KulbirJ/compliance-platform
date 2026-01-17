const { body, param, validationResult } = require('express-validator');
const mitigationModel = require('../models/mitigationModel');
const threatModel = require('../models/threatModel');

/**
 * Mitigation Controller
 * Handles threat mitigation plan operations
 */

const mitigationController = {
  /**
   * Validation rules for creating mitigation
   */
  createMitigationValidation: [
    body('threatId')
      .notEmpty()
      .withMessage('Threat ID is required')
      .isInt()
      .withMessage('Threat ID must be a valid number'),
    body('mitigationStrategy')
      .notEmpty()
      .withMessage('Mitigation strategy is required')
      .isIn(['eliminate', 'reduce', 'transfer', 'accept'])
      .withMessage('Invalid mitigation strategy. Must be one of: eliminate, reduce, transfer, accept'),
    body('mitigationDescription')
      .trim()
      .notEmpty()
      .withMessage('Mitigation description is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Mitigation description must be between 10 and 5000 characters'),
    body('implementationStatus')
      .optional()
      .isIn(['proposed', 'approved', 'in_progress', 'implemented', 'verified', 'rejected'])
      .withMessage('Invalid implementation status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority level'),
    body('assignedTo')
      .optional()
      .isInt()
      .withMessage('Assigned to must be a valid user ID'),
    body('implementationDate')
      .optional()
      .isISO8601()
      .withMessage('Implementation date must be a valid date'),
    body('estimatedEffort')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Estimated effort must not exceed 255 characters'),
    body('costEstimate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost estimate must be a positive number'),
    body('verificationMethod')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Verification method must not exceed 1000 characters')
  ],

  /**
   * Validation rules for updating mitigation
   */
  updateMitigationValidation: [
    param('id').isInt().withMessage('Mitigation ID must be a valid number'),
    body('mitigationDescription')
      .optional()
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Mitigation description must be between 10 and 5000 characters'),
    body('mitigationStrategy')
      .optional()
      .isIn(['eliminate', 'reduce', 'transfer', 'accept'])
      .withMessage('Invalid mitigation strategy'),
    body('implementationStatus')
      .optional()
      .isIn(['proposed', 'approved', 'in_progress', 'implemented', 'verified', 'rejected'])
      .withMessage('Invalid implementation status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority level'),
    body('assignedTo')
      .optional()
      .isInt()
      .withMessage('Assigned to must be a valid user ID'),
    body('implementationDate')
      .optional()
      .isISO8601()
      .withMessage('Implementation date must be a valid date'),
    body('estimatedEffort')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Estimated effort must not exceed 255 characters'),
    body('costEstimate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost estimate must be a positive number'),
    body('verificationMethod')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Verification method must not exceed 1000 characters'),
    body('effectivenessRating')
      .optional()
      .isIn(['low', 'medium', 'high', 'excellent'])
      .withMessage('Invalid effectiveness rating')
  ],

  /**
   * Validation rules for mitigation ID parameter
   */
  idValidation: [
    param('id').isInt().withMessage('Mitigation ID must be a valid number')
  ],

  /**
   * Validation rules for threat ID parameter
   */
  threatIdValidation: [
    param('threatId').isInt().withMessage('Threat ID must be a valid number')
  ],

  /**
   * Create a new mitigation plan for a threat
   * POST /api/mitigations
   */
  async createMitigation(req, res) {
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
        threatId,
        mitigationStrategy,
        mitigationDescription,
        implementationStatus = 'proposed',
        priority = 'medium',
        assignedTo,
        implementationDate,
        estimatedEffort,
        costEstimate,
        verificationMethod
      } = req.body;

      const userId = req.user.userId;

      // Check if user has access to the threat
      const hasThreatAccess = await threatModel.checkUserAccess(threatId, userId);
      if (!hasThreatAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat'
        });
      }

      // Verify threat exists
      const threat = await threatModel.getThreatById(threatId);
      if (!threat) {
        return res.status(404).json({
          success: false,
          message: 'Threat not found'
        });
      }

      // Create mitigation
      const mitigation = await mitigationModel.createMitigation(
        threatId,
        mitigationStrategy,
        mitigationDescription,
        implementationStatus,
        priority,
        assignedTo,
        implementationDate,
        estimatedEffort
      );

      // Update cost_estimate and verification_method if provided
      if (costEstimate !== undefined || verificationMethod !== undefined) {
        const updates = {};
        if (costEstimate !== undefined) updates.cost_estimate = costEstimate;
        if (verificationMethod !== undefined) updates.verification_method = verificationMethod;
        
        const updatedMitigation = await mitigationModel.updateMitigation(mitigation.id, updates);
        
        return res.status(201).json({
          success: true,
          message: 'Mitigation plan created successfully',
          data: updatedMitigation
        });
      }

      res.status(201).json({
        success: true,
        message: 'Mitigation plan created successfully',
        data: mitigation
      });
    } catch (error) {
      console.error('Error creating mitigation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create mitigation plan',
        error: error.message
      });
    }
  },

  /**
   * Get mitigations for a specific threat
   * GET /api/threats/:threatId/mitigations
   */
  async getMitigations(req, res) {
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

      const threatId = parseInt(req.params.threatId);
      const userId = req.user.userId;

      // Check if user has access to the threat
      const hasThreatAccess = await threatModel.checkUserAccess(threatId, userId);
      if (!hasThreatAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this threat'
        });
      }

      // Get mitigations for threat (sorted by priority and status)
      const mitigations = await mitigationModel.getMitigationsByThreat(threatId);

      res.status(200).json({
        success: true,
        message: 'Mitigations retrieved successfully',
        data: {
          threatId,
          totalMitigations: mitigations.length,
          mitigations
        }
      });
    } catch (error) {
      console.error('Error retrieving mitigations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mitigations',
        error: error.message
      });
    }
  },

  /**
   * Get specific mitigation details by ID
   * GET /api/mitigations/:id
   */
  async getMitigationById(req, res) {
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

      const mitigationId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to this mitigation
      const hasAccess = await mitigationModel.checkUserAccess(mitigationId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this mitigation'
        });
      }

      // Get mitigation with full details (includes threat, asset, threat model, assignee)
      const mitigation = await mitigationModel.getMitigationById(mitigationId);

      if (!mitigation) {
        return res.status(404).json({
          success: false,
          message: 'Mitigation not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Mitigation retrieved successfully',
        data: mitigation
      });
    } catch (error) {
      console.error('Error retrieving mitigation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mitigation',
        error: error.message
      });
    }
  },

  /**
   * Update mitigation details
   * PUT /api/mitigations/:id
   */
  async updateMitigation(req, res) {
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

      const mitigationId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to this mitigation
      const hasAccess = await mitigationModel.checkUserAccess(mitigationId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this mitigation'
        });
      }

      // Extract update fields from request body
      const {
        mitigationDescription,
        mitigationStrategy,
        implementationStatus,
        priority,
        assignedTo,
        implementationDate,
        estimatedEffort,
        costEstimate,
        verificationMethod,
        effectivenessRating
      } = req.body;

      // Build updates object with only provided fields
      const updates = {};
      if (mitigationDescription !== undefined) updates.mitigation_description = mitigationDescription;
      if (mitigationStrategy !== undefined) updates.mitigation_strategy = mitigationStrategy;
      if (implementationStatus !== undefined) updates.implementation_status = implementationStatus;
      if (priority !== undefined) updates.priority = priority;
      if (assignedTo !== undefined) updates.assigned_to = assignedTo;
      if (implementationDate !== undefined) updates.implementation_date = implementationDate;
      if (estimatedEffort !== undefined) updates.estimated_effort = estimatedEffort;
      if (costEstimate !== undefined) updates.cost_estimate = costEstimate;
      if (verificationMethod !== undefined) updates.verification_method = verificationMethod;
      if (effectivenessRating !== undefined) updates.effectiveness_rating = effectivenessRating;

      // Check if there are any updates
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update'
        });
      }

      // Update mitigation (auto-sets completed_at when status becomes implemented/verified)
      const updatedMitigation = await mitigationModel.updateMitigation(mitigationId, updates);

      if (!updatedMitigation) {
        return res.status(404).json({
          success: false,
          message: 'Mitigation not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Mitigation updated successfully',
        data: updatedMitigation
      });
    } catch (error) {
      console.error('Error updating mitigation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update mitigation',
        error: error.message
      });
    }
  },

  /**
   * Delete a mitigation
   * DELETE /api/mitigations/:id
   */
  async deleteMitigation(req, res) {
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

      const mitigationId = parseInt(req.params.id);
      const userId = req.user.userId;

      // Check if user has access to this mitigation
      const hasAccess = await mitigationModel.checkUserAccess(mitigationId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this mitigation'
        });
      }

      // Delete mitigation
      const result = await mitigationModel.deleteMitigation(mitigationId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Mitigation not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Mitigation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting mitigation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete mitigation',
        error: error.message
      });
    }
  },

  /**
   * Get all mitigations assigned to the current user
   * GET /api/mitigations/my-assignments
   */
  async getMyMitigations(req, res) {
    try {
      const userId = req.user.userId;
      
      // Extract query parameters for filtering and pagination
      const {
        status,
        page = 1,
        limit = 50
      } = req.query;

      // Build options object
      const options = {
        offset: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit)
      };

      if (status) options.status = status;

      // Get mitigations assigned to user (includes threat and threat model info)
      const mitigations = await mitigationModel.getMitigationsByAssignee(userId, options);

      res.status(200).json({
        success: true,
        message: 'Assigned mitigations retrieved successfully',
        data: {
          userId,
          totalAssignments: mitigations.length,
          mitigations
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mitigations.length
        }
      });
    } catch (error) {
      console.error('Error retrieving assigned mitigations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assigned mitigations',
        error: error.message
      });
    }
  }
};

module.exports = mitigationController;
