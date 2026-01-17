const { body, param, validationResult } = require('express-validator');
const assessmentModel = require('../models/assessmentModel');
const controlAssessmentModel = require('../models/controlAssessmentModel');
const { query } = require('../config/database');

/**
 * Assessment Controller
 * Handles compliance assessment operations
 */

const assessmentController = {
  /**
   * Validation rules for creating assessment
   */
  createAssessmentValidation: [
    body('assessmentName')
      .trim()
      .notEmpty()
      .withMessage('Assessment name is required')
      .isLength({ min: 3, max: 255 })
      .withMessage('Assessment name must be between 3 and 255 characters'),
    body('assessmentType')
      .optional()
      .isIn(['initial', 'annual', 'continuous', 'incident_response'])
      .withMessage('Invalid assessment type'),
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
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('organizationId')
      .optional()
      .isInt()
      .withMessage('Organization ID must be a number')
  ],

  /**
   * Validation rules for updating assessment
   */
  updateAssessmentValidation: [
    param('id').isInt().withMessage('Assessment ID must be a valid number'),
    body('assessmentName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Assessment name must be between 3 and 255 characters'),
    body('status')
      .optional()
      .isIn(['draft', 'in_progress', 'under_review', 'completed', 'archived'])
      .withMessage('Invalid status value'),
    body('scope')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Scope must not exceed 5000 characters')
  ],

  /**
   * Create a new compliance assessment
   * @route POST /api/assessments
   * @access Private
   */
  async createAssessment(req, res, next) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }

      const { assessmentName, assessmentType, description, assessmentDate, scope, dueDate, organizationId } = req.body;
      const userId = req.user.userId;

      // Get user's organization(s)
      let targetOrgId = organizationId;
      
      if (!targetOrgId) {
        // If no organizationId provided, get user's first organization
        const orgResult = await query(
          'SELECT organization_id FROM user_organizations WHERE user_id = $1 LIMIT 1',
          [userId]
        );

        if (orgResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'User is not associated with any organization. Please provide organizationId.'
          });
        }

        targetOrgId = orgResult.rows[0].organization_id;
      } else {
        // Verify user has access to the specified organization
        const accessCheck = await query(
          'SELECT id FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
          [userId, targetOrgId]
        );

        if (accessCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to create assessments for this organization.'
          });
        }
      }

      // Create assessment
      const assessment = await assessmentModel.createAssessment(
        targetOrgId,
        userId,
        assessmentName,
        description,
        assessmentDate || new Date(),
        scope || description
      );

      // If due date provided, update it
      if (dueDate) {
        await assessmentModel.updateAssessment(assessment.id, { due_date: dueDate });
        assessment.due_date = dueDate;
      }

      res.status(201).json({
        success: true,
        message: 'Assessment created successfully',
        data: {
          id: assessment.id,
          organizationId: assessment.organization_id,
          name: assessment.assessment_name,
          version: assessment.assessment_version,
          status: assessment.status,
          scope: assessment.scope,
          assessmentDate: assessment.assessment_date,
          dueDate: assessment.due_date,
          completionPercentage: assessment.completion_percentage,
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all assessments for user's organization(s)
   * @route GET /api/assessments
   * @access Private
   */
  async getAssessments(req, res, next) {
    try {
      const userId = req.user.userId;
      const { status, limit = 50, offset = 0 } = req.query;

      // Get user's organizations
      const orgResult = await query(
        'SELECT organization_id FROM user_organizations WHERE user_id = $1',
        [userId]
      );

      if (orgResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User is not associated with any organization'
        });
      }

      // Get assessments for all user's organizations
      const organizationIds = orgResult.rows.map(row => row.organization_id);
      const assessments = [];

      for (const orgId of organizationIds) {
        const orgAssessments = await assessmentModel.getAssessmentsByOrganization(
          orgId,
          { limit: parseInt(limit), offset: parseInt(offset), status }
        );
        assessments.push(...orgAssessments);
      }

      // Sort by creation date
      assessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json({
        success: true,
        data: assessments.map(assessment => ({
          id: assessment.id,
          organizationId: assessment.organization_id,
          organizationName: assessment.organization_name,
          name: assessment.assessment_name,
          version: assessment.assessment_version,
          status: assessment.status,
          assessmentDate: assessment.assessment_date,
          dueDate: assessment.due_date,
          completionPercentage: parseFloat(assessment.completion_percentage) || 0,
          totalControls: parseInt(assessment.total_controls) || 0,
          assessedControls: parseInt(assessment.assessed_controls) || 0,
          createdBy: assessment.created_by_name || assessment.created_by_username,
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: assessments.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get detailed assessment info by ID
   * @route GET /api/assessments/:id
   * @access Private
   */
  async getAssessmentById(req, res, next) {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.userId;

      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assessment ID'
        });
      }

      // Get assessment with progress
      const assessment = await assessmentModel.getAssessmentWithProgress(assessmentId);

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // Check if user has access to this assessment's organization
      const accessCheck = await query(
        'SELECT id FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, assessment.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this assessment.'
        });
      }

      res.json({
        success: true,
        data: {
          id: assessment.id,
          organizationId: assessment.organization_id,
          organizationName: assessment.organization_name,
          name: assessment.assessment_name,
          version: assessment.assessment_version,
          status: assessment.status,
          scope: assessment.scope,
          assessmentDate: assessment.assessment_date,
          dueDate: assessment.due_date,
          completionPercentage: parseFloat(assessment.completion_percentage) || 0,
          overallScore: parseFloat(assessment.overall_score) || null,
          createdBy: {
            username: assessment.created_by_username,
            fullName: assessment.created_by_name
          },
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at,
          completedAt: assessment.completed_at,
          progress: {
            totalAvailableControls: parseInt(assessment.total_available_controls) || 0,
            totalAssessedControls: parseInt(assessment.total_assessed_controls) || 0,
            fullyImplemented: parseInt(assessment.fully_implemented_count) || 0,
            largelyImplemented: parseInt(assessment.largely_implemented_count) || 0,
            partiallyImplemented: parseInt(assessment.partially_implemented_count) || 0,
            notImplemented: parseInt(assessment.not_implemented_count) || 0,
            notApplicable: parseInt(assessment.not_applicable_count) || 0,
            averageComplianceScore: parseFloat(assessment.average_compliance_score) || 0,
            calculatedCompletionPercentage: parseFloat(assessment.calculated_completion_percentage) || 0,
            implementationRate: parseInt(assessment.implementation_rate) || 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update assessment details
   * @route PUT /api/assessments/:id
   * @access Private
   */
  async updateAssessment(req, res, next) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }

      const assessmentId = parseInt(req.params.id);
      const userId = req.user.userId;

      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assessment ID'
        });
      }

      // Get assessment to check permissions
      const existingAssessment = await assessmentModel.getAssessmentById(assessmentId);

      if (!existingAssessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // Check if user has access to this assessment's organization
      const accessCheck = await query(
        'SELECT role FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, existingAssessment.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to update this assessment.'
        });
      }

      // Check if user has appropriate role (owner, admin, or creator)
      const userRole = accessCheck.rows[0].role;
      const isCreator = existingAssessment.created_by === userId;

      if (!['owner', 'admin'].includes(userRole) && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only assessment creators, owners, or admins can update assessments.'
        });
      }

      // Build updates object
      const updates = {};
      const allowedFields = ['assessmentName', 'status', 'scope', 'assessmentDate', 'dueDate', 'overallScore', 'description'];
      const fieldMapping = {
        assessmentName: 'assessment_name',
        assessmentDate: 'assessment_date',
        dueDate: 'due_date',
        overallScore: 'overall_score'
      };

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          const dbField = fieldMapping[field] || field;
          updates[dbField] = req.body[field];
        }
      }

      // If status is being changed to 'completed', set completed_at
      if (updates.status === 'completed' && existingAssessment.status !== 'completed') {
        updates.completed_at = new Date();
      }

      // Update assessment
      const updatedAssessment = await assessmentModel.updateAssessment(assessmentId, updates);

      res.json({
        success: true,
        message: 'Assessment updated successfully',
        data: {
          id: updatedAssessment.id,
          organizationId: updatedAssessment.organization_id,
          name: updatedAssessment.assessment_name,
          version: updatedAssessment.assessment_version,
          status: updatedAssessment.status,
          scope: updatedAssessment.scope,
          assessmentDate: updatedAssessment.assessment_date,
          dueDate: updatedAssessment.due_date,
          completionPercentage: updatedAssessment.completion_percentage,
          overallScore: updatedAssessment.overall_score,
          createdAt: updatedAssessment.created_at,
          updatedAt: updatedAssessment.updated_at,
          completedAt: updatedAssessment.completed_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an assessment
   * @route DELETE /api/assessments/:id
   * @access Private
   */
  async deleteAssessment(req, res, next) {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.userId;

      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assessment ID'
        });
      }

      // Get assessment to check permissions
      const existingAssessment = await assessmentModel.getAssessmentById(assessmentId);

      if (!existingAssessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // Check if user has access to this assessment's organization
      const accessCheck = await query(
        'SELECT role FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, existingAssessment.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to delete this assessment.'
        });
      }

      // Check if user has appropriate role (only owner or admin can delete)
      const userRole = accessCheck.rows[0].role;

      if (!['owner', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only organization owners or admins can delete assessments.'
        });
      }

      // Delete assessment (will cascade to control_assessments)
      await assessmentModel.deleteAssessment(assessmentId);

      res.json({
        success: true,
        message: 'Assessment deleted successfully',
        data: {
          id: assessmentId,
          name: existingAssessment.assessment_name
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get detailed progress for an assessment
   * @route GET /api/assessments/:id/progress
   * @access Private
   */
  async getAssessmentProgress(req, res, next) {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.userId;

      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assessment ID'
        });
      }

      // Get assessment to check permissions
      const assessment = await assessmentModel.getAssessmentById(assessmentId);

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // Check if user has access
      const accessCheck = await query(
        'SELECT id FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, assessment.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this assessment.'
        });
      }

      // Get detailed statistics
      const stats = await controlAssessmentModel.getControlAssessmentStats(assessmentId);

      // Get progress by function
      const progressByFunction = await controlAssessmentModel.getControlAssessmentsByFunction(assessmentId);

      res.json({
        success: true,
        data: {
          assessmentId: assessmentId,
          assessmentName: assessment.assessment_name,
          status: assessment.status,
          overallStatistics: {
            totalAvailableControls: parseInt(stats.total_available_controls) || 0,
            totalAssessed: parseInt(stats.total_assessed) || 0,
            completionPercentage: parseFloat(stats.completion_percentage) || 0,
            implementationRate: parseFloat(stats.implementation_rate) || 0,
            averageComplianceScore: parseFloat(stats.average_compliance_score) || 0
          },
          implementationStatus: {
            fullyImplemented: parseInt(stats.fully_implemented) || 0,
            largelyImplemented: parseInt(stats.largely_implemented) || 0,
            partiallyImplemented: parseInt(stats.partially_implemented) || 0,
            notImplemented: parseInt(stats.not_implemented) || 0,
            notApplicable: parseInt(stats.not_applicable) || 0
          },
          maturityLevels: {
            initial: parseInt(stats.maturity_initial) || 0,
            managed: parseInt(stats.maturity_managed) || 0,
            defined: parseInt(stats.maturity_defined) || 0,
            quantitativelyManaged: parseInt(stats.maturity_quantitatively_managed) || 0,
            optimizing: parseInt(stats.maturity_optimizing) || 0
          },
          progressByFunction: progressByFunction.map(func => ({
            functionId: func.function_id,
            functionCode: func.function_code,
            functionName: func.function_name,
            assessedControlsCount: parseInt(func.assessed_controls_count) || 0,
            fullyImplementedCount: parseInt(func.fully_implemented_count) || 0,
            averageScore: parseFloat(func.average_score) || 0
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = assessmentController;