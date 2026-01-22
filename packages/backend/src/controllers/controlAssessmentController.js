const { body, param, validationResult } = require('express-validator');
const controlAssessmentModel = require('../models/controlAssessmentModel');
const assessmentModel = require('../models/assessmentModel');
const RiskRegister = require('../models/riskRegisterModel');
const { query } = require('../config/database');

/**
 * Control Assessment Controller
 * Handles individual NIST CSF control assessments
 */

const controlAssessmentController = {
  /**
   * Validation rules for assessing control
   */
  assessControlValidation: [
    body('assessmentId')
      .optional()
      .isInt()
      .withMessage('Assessment ID must be a valid number'),
    body('controlId')
      .optional()
      .isInt()
      .withMessage('Control ID must be a valid number'),
    body('subcategory_id')
      .optional()
      .isString()
      .trim()
      .withMessage('Subcategory ID must be a string'),
    body('status')
      .optional()
      .isIn(['compliant', 'partially_compliant', 'non_compliant', 'not_applicable', 'not_assessed', 
             'not_implemented', 'partially_implemented', 'largely_implemented', 'fully_implemented'])
      .withMessage('Invalid implementation status'),
    body('questionnaire_response')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Questionnaire response must not exceed 5000 characters'),
    body('questionnaireResponse')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Questionnaire response must not exceed 5000 characters'),
    body('comments')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Comments must not exceed 5000 characters'),
    body('remediation_plan')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Remediation plan must not exceed 5000 characters'),
    body('remediationPlan')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Remediation plan must not exceed 5000 characters'),
    body('maturityLevel')
      .optional()
      .isIn(['initial', 'managed', 'defined', 'quantitatively_managed', 'optimizing'])
      .withMessage('Invalid maturity level'),
    body('complianceScore')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Compliance score must be between 0 and 100')
  ],

  /**
   * Validation rules for bulk assess
   */
  bulkAssessValidation: [
    body('assessmentId')
      .isInt()
      .withMessage('Assessment ID must be a valid number'),
    body('controls')
      .isArray({ min: 1 })
      .withMessage('Controls must be a non-empty array'),
    body('controls.*.controlId')
      .isInt()
      .withMessage('Each control must have a valid control ID'),
    body('controls.*.status')
      .isIn(['not_implemented', 'partially_implemented', 'largely_implemented', 'fully_implemented', 'not_applicable', 'at_risk'])
      .withMessage('Each control must have a valid implementation status')
  ],

  /**
   * Create or update a control assessment
   * @route POST /api/assessments/:assessmentId/controls
   * @access Private
   */
  async assessControl(req, res, next) {
    try {
      // Get assessmentId from URL params, not body
      const { assessmentId } = req.params;
      
      const {
        controlId,
        subcategory_id, // Frontend sends this (control_code like "ID.AM-1")
        status,
        questionnaire_response,
        questionnaireResponse,
        comments,
        remediation_plan,
        remediationPlan,
        maturityLevel,
        complianceScore
      } = req.body;
      const userId = req.user.userId;

      // Handle flexible field naming from frontend
      const finalStatus = status;
      const finalQuestionnaireResponse = questionnaire_response || questionnaireResponse;
      const finalRemediationPlan = remediation_plan || remediationPlan;

      // If subcategory_id is provided instead of controlId, look up the control ID
      let finalControlId = controlId;
      if (!finalControlId && subcategory_id) {
        const controlLookup = await query(
          'SELECT id FROM nist_csf_controls WHERE control_code = $1',
          [subcategory_id]
        );
        
        if (controlLookup.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Control not found with code: ${subcategory_id}`
          });
        }
        
        finalControlId = controlLookup.rows[0].id;
      }

      if (!finalControlId) {
        return res.status(400).json({
          success: false,
          message: 'Either controlId or subcategory_id is required'
        });
      }

      // Verify assessment exists and user has access
      console.log('DEBUG assessControl: Checking assessment ID:', assessmentId, 'Type:', typeof assessmentId);
      const assessment = await assessmentModel.getAssessmentById(assessmentId);
      console.log('DEBUG assessControl: Assessment query result:', assessment);

      if (!assessment) {
        console.log('DEBUG assessControl: Assessment not found for ID:', assessmentId);
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }
      console.log('DEBUG assessControl: Assessment found:', assessment.id, assessment.assessment_name);

      // MVP: Skip organization access check since we're using default user
      // Check if user has access to this assessment's organization
      // For MVP, we'll allow access to all assessments
      // TODO: Re-enable this check when SSO is implemented
      /*
      const accessCheck = await query(
        'SELECT role FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, assessment.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to assess controls for this assessment.'
        });
      }
      */

      // No need to verify control exists again since we already did that above

      // Check existing control assessment status before update (for status change detection)
      let existingControlAssessment = null;
      try {
        const existingCheck = await query(
          'SELECT implementation_status FROM compliance_control_assessments WHERE assessment_id = $1 AND control_id = $2',
          [assessmentId, finalControlId]
        );
        if (existingCheck.rows.length > 0) {
          existingControlAssessment = existingCheck.rows[0];
        }
      } catch (err) {
        console.log('[RISK] Could not fetch existing control assessment:', err.message);
      }

      // Create or update control assessment
      const controlAssessment = await controlAssessmentModel.createControlAssessment(
        assessmentId,
        finalControlId,
        finalStatus,
        finalQuestionnaireResponse,
        comments,
        finalRemediationPlan,
        userId
      );

      // Update maturity level and compliance score if provided
      const updates = {};
      if (maturityLevel) updates.maturity_level = maturityLevel;
      if (complianceScore !== undefined) updates.compliance_score = complianceScore;

      if (Object.keys(updates).length > 0) {
        await controlAssessmentModel.updateControlAssessment(controlAssessment.id, updates);
        Object.assign(controlAssessment, updates);
      }

      // Update assessment completion percentage
      await assessmentModel.updateCompletionPercentage(assessmentId);

      // Get full control assessment details
      const fullControlAssessment = await controlAssessmentModel.getControlAssessmentById(controlAssessment.id);

      // Auto-create risk register entry for at_risk controls
      let riskRegisterEntry = null;
      console.log(`[RISK] finalStatus="${finalStatus}" (type: ${typeof finalStatus}), matches at_risk: ${finalStatus === 'at_risk'}`);
      
      // Check if status changed FROM at_risk to something else (mitigation)
      if (existingControlAssessment && existingControlAssessment.implementation_status === 'at_risk' && finalStatus !== 'at_risk') {
        try {
          console.log(`[RISK] Status changed from at_risk to ${finalStatus} - marking risk as mitigated`);
          await RiskRegister.markRiskAsMitigated(assessmentId, finalControlId);
          console.log(`[RISK] ✓ Risk marked as mitigated`);
        } catch (mitigationError) {
          console.error(`[RISK] ✗ Failed to mark risk as mitigated: ${mitigationError.message}`);
        }
      }
      
      // Create new risk entry if status is at_risk
      if (finalStatus === 'at_risk') {
        try {
          console.log(`[RISK] Creating risk for assessment ${assessmentId}, control ${finalControlId}`);
          console.log(`[RISK] Parameters: userId=${userId}, questionnaireResponse="${finalQuestionnaireResponse}", comments="${comments}"`);
          riskRegisterEntry = await RiskRegister.createFromControlAssessment(
            assessmentId,
            finalControlId,
            userId,
            finalQuestionnaireResponse,
            comments
          );
          console.log(`[RISK] ✓ Risk created: ${riskRegisterEntry.risk_id}`);
        } catch (riskError) {
          console.error(`[RISK] ✗ Error creating risk: ${riskError.message}`);
          console.error(`[RISK] Stack trace:`, riskError.stack);
          // Don't fail the control assessment if risk creation fails
        }
      } else {
        console.log(`[RISK] Status "${finalStatus}" is not "at_risk", no risk created`);
      }

      res.status(201).json({
        success: true,
        message: 'Control assessment saved successfully',
        data: {
          id: fullControlAssessment.id,
          assessment_id: fullControlAssessment.assessment_id,
          control_id: fullControlAssessment.control_id,
          subcategory_id: fullControlAssessment.control_code, // Frontend expects this
          status: fullControlAssessment.implementation_status,
          implementation_status: fullControlAssessment.implementation_status,
          maturity_level: fullControlAssessment.maturity_level,
          compliance_score: fullControlAssessment.compliance_score,
          notes: fullControlAssessment.notes,
          recommendations: fullControlAssessment.recommendations,
          assessed_by: fullControlAssessment.assessed_by,
          assessed_at: fullControlAssessment.assessed_at,
          control_code: fullControlAssessment.control_code,
          control_name: fullControlAssessment.control_name,
          control_description: fullControlAssessment.control_description,
          control_importance: fullControlAssessment.control_importance,
          category_code: fullControlAssessment.category_code,
          category_name: fullControlAssessment.category_name,
          function_code: fullControlAssessment.function_code,
          function_name: fullControlAssessment.function_name,
          risk_register_entry: riskRegisterEntry ? riskRegisterEntry.risk_id : null
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all control assessments for an assessment
   * @route GET /api/assessments/:assessmentId/controls
   * @access Private
   */
  async getControlAssessments(req, res, next) {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      const userId = req.user.userId;
      const { status, groupBy = 'function' } = req.query;

      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assessment ID'
        });
      }

      // Verify assessment exists and user has access
      const assessment = await assessmentModel.getAssessmentById(assessmentId);

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // MVP: Skip organization access check
      // TODO: Re-enable when SSO is implemented
      /*
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
      */

      // Get control assessments
      const controlAssessments = await controlAssessmentModel.getControlAssessmentsByAssessment(
        assessmentId,
        { status }
      );

      // Group by function or category
      let groupedData;

      if (groupBy === 'function') {
        // Group by NIST CSF function
        const grouped = {};

        for (const ca of controlAssessments) {
          const functionCode = ca.function_code;

          if (!grouped[functionCode]) {
            grouped[functionCode] = {
              functionCode: ca.function_code,
              functionName: ca.function_name,
              categories: {}
            };
          }

          const categoryCode = ca.category_code;

          if (!grouped[functionCode].categories[categoryCode]) {
            grouped[functionCode].categories[categoryCode] = {
              categoryCode: ca.category_code,
              categoryName: ca.category_name,
              controls: []
            };
          }

          grouped[functionCode].categories[categoryCode].controls.push({
            id: ca.id,
            controlId: ca.control_id,
            controlCode: ca.control_code,
            controlName: ca.control_name,
            importance: ca.control_importance,
            implementationStatus: ca.implementation_status,
            status: ca.implementation_status, // Alias for frontend compatibility
            maturityLevel: ca.maturity_level,
            complianceScore: parseFloat(ca.compliance_score) || null,
            notes: ca.notes,
            recommendations: ca.recommendations,
            questionnaire_response: ca.notes || '', // notes contains both questionnaire_response and comments
            comments: '', // Comments are merged into notes
            remediation_plan: ca.recommendations || '',
            assessedBy: ca.assessed_by_name || ca.assessed_by_username,
            assessedAt: ca.assessed_at,
            evidenceCount: parseInt(ca.evidence_count) || 0,
            subcategory_id: ca.control_code // For modal lookup
          });
        }

        // Convert to array format
        groupedData = Object.values(grouped).map(func => ({
          ...func,
          categories: Object.values(func.categories)
        }));
      } else {
        // Flat list with frontend-compatible field names
        groupedData = controlAssessments.map(ca => ({
          id: ca.id,
          assessment_id: ca.assessment_id,
          control_id: ca.control_id,
          subcategory_id: ca.control_code, // Frontend expects this
          status: ca.implementation_status, // Frontend expects this
          implementation_status: ca.implementation_status,
          maturity_level: ca.maturity_level,
          compliance_score: parseFloat(ca.compliance_score) || null,
          notes: ca.notes,
          recommendations: ca.recommendations,
          assessed_by: ca.assessed_by,
          assessed_by_name: ca.assessed_by_name || ca.assessed_by_username,
          assessed_at: ca.assessed_at,
          reviewed_by: ca.reviewed_by,
          reviewed_by_name: ca.reviewed_by_name || ca.reviewed_by_username,
          reviewed_at: ca.reviewed_at,
          evidence_count: parseInt(ca.evidence_count) || 0,
          // Control details
          control_code: ca.control_code,
          control_name: ca.control_name,
          control_description: ca.control_description,
          control_guidance: ca.control_guidance,
          control_importance: ca.control_importance,
          // Category details
          category_code: ca.category_code,
          category_name: ca.category_name,
          // Function details
          function_code: ca.function_code,
          function_name: ca.function_name
        }));
      }

      res.json({
        success: true,
        data: {
          assessmentId: assessmentId,
          assessmentName: assessment.assessment_name,
          totalControls: controlAssessments.length,
          groupBy: groupBy,
          [groupBy === 'function' ? 'functions' : 'controls']: groupedData
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get specific control assessment by ID
   * @route GET /api/control-assessments/:id
   * @access Private
   */
  async getControlAssessmentById(req, res, next) {
    try {
      const controlAssessmentId = parseInt(req.params.id);
      const userId = req.user.userId;

      if (isNaN(controlAssessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid control assessment ID'
        });
      }

      // Get control assessment
      const controlAssessment = await controlAssessmentModel.getControlAssessmentById(controlAssessmentId);

      if (!controlAssessment) {
        return res.status(404).json({
          success: false,
          message: 'Control assessment not found'
        });
      }

      // Get parent assessment to check permissions
      const assessment = await assessmentModel.getAssessmentById(controlAssessment.assessment_id);

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Parent assessment not found'
        });
      }

      // MVP: Skip organization access check
      // TODO: Re-enable when SSO is implemented
      /*
      const accessCheck = await query(
        'SELECT id FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, assessment.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this control assessment.'
        });
      }
      */

      // Get evidence for this control assessment (if evidence table exists)
      let evidence = [];
      try {
        const evidenceResult = await query(
          `SELECT id, file_name, file_type, file_size, uploaded_by, uploaded_at, description
           FROM evidence
           WHERE control_assessment_id = $1
           ORDER BY uploaded_at DESC`,
          [controlAssessmentId]
        );
        evidence = evidenceResult.rows;
      } catch (err) {
        // Evidence table might not exist or be queried
        console.log('Could not fetch evidence:', err.message);
      }

      res.json({
        success: true,
        data: {
          id: controlAssessment.id,
          assessmentId: controlAssessment.assessment_id,
          assessmentName: assessment.assessment_name,
          control: {
            id: controlAssessment.control_id,
            code: controlAssessment.control_code,
            name: controlAssessment.control_name,
            description: controlAssessment.control_description,
            guidance: controlAssessment.control_guidance,
            importance: controlAssessment.control_importance,
            category: {
              code: controlAssessment.category_code,
              name: controlAssessment.category_name,
              description: controlAssessment.category_description
            },
            function: {
              code: controlAssessment.function_code,
              name: controlAssessment.function_name,
              description: controlAssessment.function_description
            }
          },
          implementationStatus: controlAssessment.implementation_status,
          maturityLevel: controlAssessment.maturity_level,
          complianceScore: parseFloat(controlAssessment.compliance_score) || null,
          notes: controlAssessment.notes,
          recommendations: controlAssessment.recommendations,
          assessedBy: {
            username: controlAssessment.assessed_by_username,
            fullName: controlAssessment.assessed_by_name,
            email: controlAssessment.assessed_by_email
          },
          assessedAt: controlAssessment.assessed_at,
          reviewedBy: controlAssessment.reviewed_by_username ? {
            username: controlAssessment.reviewed_by_username,
            fullName: controlAssessment.reviewed_by_name,
            email: controlAssessment.reviewed_by_email
          } : null,
          reviewedAt: controlAssessment.reviewed_at,
          evidence: evidence.map(e => ({
            id: e.id,
            fileName: e.file_name,
            fileType: e.file_type,
            fileSize: e.file_size,
            description: e.description,
            uploadedAt: e.uploaded_at
          })),
          createdAt: controlAssessment.created_at,
          updatedAt: controlAssessment.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk assess multiple controls
   * @route POST /api/assessments/:assessmentId/controls/bulk
   * @access Private
   */
  async bulkAssessControls(req, res, next) {
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

      const { assessmentId, controls } = req.body;
      const userId = req.user.userId;

      // Verify assessment exists and user has access
      const assessment = await assessmentModel.getAssessmentById(assessmentId);

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // MVP: Skip organization access check
      // TODO: Re-enable when SSO is implemented
      /*
      const accessCheck = await query(
        'SELECT role FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
        [userId, assessment.organization_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to assess controls for this assessment.'
        });
      }
      */

      // Process each control assessment
      const results = {
        successful: [],
        failed: []
      };

      for (const control of controls) {
        try {
          const controlAssessment = await controlAssessmentModel.createControlAssessment(
            assessmentId,
            control.controlId,
            control.status,
            control.questionnaireResponse || null,
            control.comments || null,
            control.remediationPlan || null,
            userId
          );

          // Update additional fields if provided
          const updates = {};
          if (control.maturityLevel) updates.maturity_level = control.maturityLevel;
          if (control.complianceScore !== undefined) updates.compliance_score = control.complianceScore;

          if (Object.keys(updates).length > 0) {
            await controlAssessmentModel.updateControlAssessment(controlAssessment.id, updates);
          }

          results.successful.push({
            controlId: control.controlId,
            controlAssessmentId: controlAssessment.id,
            status: control.status
          });
        } catch (error) {
          results.failed.push({
            controlId: control.controlId,
            error: error.message
          });
        }
      }

      // Update assessment completion percentage
      await assessmentModel.updateCompletionPercentage(assessmentId);

      res.status(200).json({
        success: results.failed.length === 0,
        message: `Bulk assessment completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
        data: {
          assessmentId: assessmentId,
          totalRequested: controls.length,
          successfulCount: results.successful.length,
          failedCount: results.failed.length,
          successful: results.successful,
          failed: results.failed
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = controlAssessmentController;