const { body, param, query: queryValidator, validationResult } = require('express-validator');
const evidenceModel = require('../models/evidenceModel');
const controlAssessmentModel = require('../models/controlAssessmentModel');
const assessmentModel = require('../models/assessmentModel');
const { validateFileBuffer, getFileInfo } = require('../middleware/uploadMiddleware');
const { query } = require('../config/database');

/**
 * Evidence Controller
 * Handles evidence file uploads and management
 */

const evidenceController = {
  /**
   * Validation rules for uploading evidence
   */
  uploadEvidenceValidation: [
    body('controlAssessmentId')
      .optional()
      .isInt()
      .withMessage('Control assessment ID must be a valid number'),
    body('evidenceQuality')
      .optional()
      .isIn(['low', 'medium', 'high', 'excellent', 'weak', 'medium', 'strong'])
      .withMessage('Invalid evidence quality rating'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters')
  ],

  /**
   * Validation rules for updating evidence
   */
  updateEvidenceValidation: [
    param('id')
      .isInt()
      .withMessage('Evidence ID must be a valid number'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('evidenceQuality')
      .optional()
      .isIn(['low', 'medium', 'high', 'excellent'])
      .withMessage('Invalid evidence quality rating')
  ],

  /**
   * Upload new evidence file
   * @route POST /api/evidence
   * @access Private
   */
  async uploadEvidence(req, res, next) {
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

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please attach a file.'
        });
      }

      // Validate file buffer
      try {
        validateFileBuffer(req.file);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      const { controlAssessmentId, evidenceQuality, description } = req.body;
      const userId = req.user.userId;

      let organizationId = null;
      let assessmentId = null;

      // If controlAssessmentId is provided, verify it exists and get organization
      if (controlAssessmentId) {
        const controlAssessment = await controlAssessmentModel.getControlAssessmentById(
          controlAssessmentId
        );

        if (!controlAssessment) {
          return res.status(404).json({
            success: false,
            message: 'Control assessment not found'
          });
        }

        // Get parent assessment to check permissions
        const assessment = await assessmentModel.getAssessmentById(
          controlAssessment.assessment_id
        );

        if (!assessment) {
          return res.status(404).json({
            success: false,
            message: 'Parent assessment not found'
          });
        }

        organizationId = assessment.organization_id;
        assessmentId = assessment.id;

        // Check if user has access to this assessment's organization
        const accessCheck = await query(
          'SELECT role FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
          [userId, organizationId]
        );

        if (accessCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to upload evidence for this assessment.'
          });
        }
      } else {
        // For general evidence uploads (not tied to a specific control assessment),
        // use the user's default organization
        const userOrgQuery = await query(
          'SELECT organization_id FROM user_organizations WHERE user_id = $1 LIMIT 1',
          [userId]
        );

        if (userOrgQuery.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'User is not associated with any organization'
          });
        }

        organizationId = userOrgQuery.rows[0].organization_id;
      }

      // Extract file info
      const fileInfo = getFileInfo(req.file);

      // Store evidence in database
      const evidence = await evidenceModel.createEvidence(
        organizationId,
        controlAssessmentId || null,
        fileInfo.originalName,
        fileInfo.buffer, // Binary data
        fileInfo.mimeType,
        fileInfo.size,
        evidenceQuality || 'medium',
        description || null,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Evidence uploaded successfully',
        data: {
          id: evidence.id,
          evidenceName: evidence.evidence_name,
          fileType: evidence.file_type,
          fileSize: evidence.file_size,
          fileSizeFormatted: formatFileSize(evidence.file_size),
          evidenceType: evidence.evidence_type,
          qualityRating: evidence.quality_rating,
          description: evidence.description,
          controlAssessmentId: evidence.control_assessment_id,
          organizationId: evidence.organization_id,
          uploadedBy: userId,
          isVerified: evidence.is_verified,
          createdAt: evidence.created_at,
          updatedAt: evidence.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get evidence list for a control assessment
   * @route GET /api/evidence?controlAssessmentId=1
   * @access Private
   */
  async getEvidenceList(req, res, next) {
    try {
      const controlAssessmentId = req.query.controlAssessmentId ? parseInt(req.query.controlAssessmentId) : null;
      const userId = req.user.userId;

      let evidenceList;

      if (controlAssessmentId) {
        // Get evidence for specific control assessment
        if (isNaN(controlAssessmentId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid control assessment ID'
          });
        }

        // Get control assessment to verify access
        const controlAssessment = await controlAssessmentModel.getControlAssessmentById(
          controlAssessmentId
        );

        if (!controlAssessment) {
          return res.status(404).json({
            success: false,
            message: 'Control assessment not found'
          });
        }

        // Get parent assessment to check permissions
        const assessment = await assessmentModel.getAssessmentById(
          controlAssessment.assessment_id
        );

        if (!assessment) {
          return res.status(404).json({
            success: false,
            message: 'Parent assessment not found'
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
            message: 'Access denied. You do not have permission to view this evidence.'
          });
        }

        // Get evidence list for this control assessment (without file data)
        evidenceList = await evidenceModel.getEvidenceByControlAssessment(
          controlAssessmentId
        );
      } else {
        // Get all evidence for user's organizations
        const userOrgsQuery = await query(
          'SELECT organization_id FROM user_organizations WHERE user_id = $1',
          [userId]
        );

        if (userOrgsQuery.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'User is not associated with any organization'
          });
        }

        const organizationIds = userOrgsQuery.rows.map(row => row.organization_id);

        // Get all evidence for these organizations
        const result = await evidenceModel.getEvidenceByOrganizations(organizationIds);
        evidenceList = result.evidence || result;
      }

      res.json({
        success: true,
        data: Array.isArray(evidenceList) ? evidenceList : evidenceList.evidence || []
      });
    } catch (error) {
      console.error('Error in getEvidenceList:', error);
      next(error);
    }
  },

  /**
   * Get evidence metadata by ID
   * @route GET /api/evidence/:id
   * @access Private
   */
  async getEvidenceById(req, res, next) {
    try {
      const evidenceId = parseInt(req.params.id);
      const userId = req.user.userId;

      if (isNaN(evidenceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid evidence ID'
        });
      }

      // Get evidence (without file data for metadata view)
      const evidence = await evidenceModel.getEvidenceById(evidenceId);

      if (!evidence) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      // Check if user has access to this evidence's organization
      const accessCheck = await query(
        'SELECT id FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, evidence.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this evidence.'
        });
      }

      res.json({
        success: true,
        data: {
          id: evidence.id,
          evidenceName: evidence.evidence_name,
          fileType: evidence.file_type,
          fileSize: evidence.file_size,
          fileSizeFormatted: formatFileSize(evidence.file_size),
          evidenceType: evidence.evidence_type,
          qualityRating: evidence.quality_rating,
          description: evidence.description,
          controlAssessmentId: evidence.control_assessment_id,
          assessmentId: evidence.assessment_id,
          controlCode: evidence.control_code,
          controlName: evidence.control_name,
          organizationId: evidence.organization_id,
          isVerified: evidence.is_verified,
          verifiedBy: {
            username: evidence.verified_by_username,
            fullName: evidence.verified_by_name
          },
          verifiedAt: evidence.verified_at,
          uploadedBy: {
            username: evidence.uploaded_by_username,
            fullName: evidence.uploaded_by_name
          },
          expirationDate: evidence.expiration_date,
          tags: evidence.tags,
          createdAt: evidence.created_at,
          updatedAt: evidence.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Download evidence file
   * @route GET /api/evidence/:id/download
   * @access Private
   */
  async downloadEvidence(req, res, next) {
    try {
      const evidenceId = parseInt(req.params.id);
      const userId = req.user.userId;

      if (isNaN(evidenceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid evidence ID'
        });
      }

      // Get evidence metadata first to check permissions
      const evidenceMetadata = await evidenceModel.getEvidenceById(evidenceId);

      if (!evidenceMetadata) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      // Check if user has access
      const accessCheck = await query(
        'SELECT id FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, evidenceMetadata.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to download this evidence.'
        });
      }

      // Get file data
      const evidenceFile = await evidenceModel.getEvidenceFile(evidenceId);

      if (!evidenceFile || !evidenceFile.file_data) {
        return res.status(404).json({
          success: false,
          message: 'File data not found'
        });
      }

      // Set response headers for file download
      res.setHeader('Content-Type', evidenceFile.file_type || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(evidenceFile.evidence_name)}"`
      );
      res.setHeader('Content-Length', evidenceFile.file_size);

      // Send file buffer
      res.send(evidenceFile.file_data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update evidence metadata
   * @route PUT /api/evidence/:id
   * @access Private
   */
  async updateEvidence(req, res, next) {
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

      const evidenceId = parseInt(req.params.id);
      const userId = req.user.userId;
      const { description, evidenceQuality, tags, expirationDate } = req.body;

      if (isNaN(evidenceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid evidence ID'
        });
      }

      // Get evidence to check permissions
      const existingEvidence = await evidenceModel.getEvidenceById(evidenceId);

      if (!existingEvidence) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      // Check if user has access
      const accessCheck = await query(
        'SELECT role FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, existingEvidence.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to update this evidence.'
        });
      }

      // Build updates object
      const updates = {};
      if (description !== undefined) updates.description = description;
      if (evidenceQuality !== undefined) updates.quality_rating = evidenceQuality;
      if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [tags];
      if (expirationDate !== undefined) updates.expiration_date = expirationDate;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      // Update evidence
      const updatedEvidence = await evidenceModel.updateEvidence(evidenceId, updates);

      res.json({
        success: true,
        message: 'Evidence updated successfully',
        data: {
          id: updatedEvidence.id,
          evidenceName: updatedEvidence.evidence_name,
          fileType: updatedEvidence.file_type,
          fileSize: updatedEvidence.file_size,
          evidenceType: updatedEvidence.evidence_type,
          qualityRating: updatedEvidence.quality_rating,
          description: updatedEvidence.description,
          tags: updatedEvidence.tags,
          expirationDate: updatedEvidence.expiration_date,
          isVerified: updatedEvidence.is_verified,
          updatedAt: updatedEvidence.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete evidence
   * @route DELETE /api/evidence/:id
   * @access Private
   */
  async deleteEvidence(req, res, next) {
    try {
      const evidenceId = parseInt(req.params.id);
      const userId = req.user.userId;

      if (isNaN(evidenceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid evidence ID'
        });
      }

      // Get evidence to check permissions
      const existingEvidence = await evidenceModel.getEvidenceById(evidenceId);

      if (!existingEvidence) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      // Check if user has access
      const accessCheck = await query(
        'SELECT role FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, existingEvidence.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to delete this evidence.'
        });
      }

      // Check if user is owner/admin or the uploader
      const userRole = accessCheck.rows[0].role;
      const isUploader = existingEvidence.uploaded_by === userId;

      if (!['owner', 'admin'].includes(userRole) && !isUploader) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only evidence uploaders, owners, or admins can delete evidence.'
        });
      }

      // Delete evidence
      const deletedEvidence = await evidenceModel.deleteEvidence(evidenceId);

      res.json({
        success: true,
        message: 'Evidence deleted successfully',
        data: {
          id: deletedEvidence.id,
          evidenceName: deletedEvidence.evidence_name
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify evidence
   * @route POST /api/evidence/:id/verify
   * @access Private (Admin/Owner only)
   */
  async verifyEvidence(req, res, next) {
    try {
      const evidenceId = parseInt(req.params.id);
      const userId = req.user.userId;

      if (isNaN(evidenceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid evidence ID'
        });
      }

      // Get evidence to check permissions
      const existingEvidence = await evidenceModel.getEvidenceById(evidenceId);

      if (!existingEvidence) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      // Check if user has access and proper role
      const accessCheck = await query(
        'SELECT role FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, existingEvidence.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to verify this evidence.'
        });
      }

      const userRole = accessCheck.rows[0].role;

      if (!['owner', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only owners or admins can verify evidence.'
        });
      }

      // Verify evidence
      const verifiedEvidence = await evidenceModel.verifyEvidence(evidenceId, userId);

      res.json({
        success: true,
        message: 'Evidence verified successfully',
        data: {
          id: verifiedEvidence.id,
          evidenceName: verifiedEvidence.evidence_name,
          isVerified: verifiedEvidence.is_verified,
          verifiedBy: userId,
          verifiedAt: verifiedEvidence.verified_at
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

/**
 * Helper function to format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

module.exports = evidenceController;
