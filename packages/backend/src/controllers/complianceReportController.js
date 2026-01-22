const { body, param, query, validationResult } = require('express-validator');
const complianceReportModel = require('../models/complianceReportModel');
const assessmentModel = require('../models/assessmentModel');
const controlAssessmentModel = require('../models/controlAssessmentModel');
const { generateCompliancePDF } = require('../utils/complianceReportGenerator');

/**
 * Compliance Report Controller
 * Handles compliance report generation, retrieval, and management
 */

/**
 * Generate a new compliance report
 * POST /api/assessments/:id/reports
 */
const generateComplianceReport = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const assessmentId = parseInt(req.params.id);
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Validate assessment exists and belongs to user's organization
    const assessment = await assessmentModel.getAssessmentById(assessmentId);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (assessment.organization_id !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this assessment'
      });
    }

    // Get organization name from user data
    const organizationName = req.user.organizationName || 'Organization';

    // Fetch control assessments with evidence counts
    const controlAssessments = await controlAssessmentModel.getControlAssessmentsByAssessment(assessmentId);

    if (!controlAssessments || controlAssessments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate report: No control assessments found for this assessment'
      });
    }

    // Generate PDF using the utility
    const pdfBuffer = await generateCompliancePDF(
      assessment,
      controlAssessments,
      organizationName
    );

    // Prepare report metadata
    const reportData = {
      reportType: 'compliance_report',
      fileName: `Compliance_Report_${assessment.assessment_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      fileSize: pdfBuffer.length,
      reportFormat: 'pdf'
    };

    // Store report in database
    const report = await complianceReportModel.createComplianceReport(
      assessmentId,
      userId,
      reportData,
      pdfBuffer
    );

    res.status(201).json({
      success: true,
      message: 'Compliance report generated successfully',
      data: {
        id: report.id,
        assessment_id: report.assessment_id,
        report_type: report.report_type,
        file_name: report.file_name,
        file_size: report.file_size,
        report_format: report.report_format,
        generated_at: report.generated_at,
        download_url: `/api/compliance-reports/${report.id}/download`
      }
    });

  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate compliance report',
      error: error.message
    });
  }
};

/**
 * Get all compliance reports for an assessment
 * GET /api/assessments/:id/reports
 */
const getComplianceReports = async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.id);
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Validate assessment exists and belongs to user's organization
    const assessment = await assessmentModel.getAssessmentById(assessmentId);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (assessment.organization_id !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this assessment'
      });
    }

    // Get reports for assessment
    const reports = await complianceReportModel.getReportsByAssessment(assessmentId);

    res.status(200).json({
      success: true,
      message: 'Compliance reports retrieved successfully',
      data: {
        assessment_id: assessmentId,
        assessment_name: assessment.assessment_name,
        total_reports: reports.length,
        reports: reports.map(r => ({
          id: r.id,
          report_type: r.report_type,
          file_name: r.file_name,
          file_size: r.file_size,
          report_format: r.report_format,
          generated_by: r.generated_by_name,
          generated_at: r.generated_at,
          download_url: `/api/compliance-reports/${r.id}/download`
        }))
      }
    });

  } catch (error) {
    console.error('Error getting compliance reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve compliance reports',
      error: error.message
    });
  }
};

/**
 * Get all compliance reports for organization
 * GET /api/compliance-reports
 */
const getOrganizationReports = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const reportType = req.query.reportType;
    const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId) : null;

    const options = {
      page,
      limit,
      reportType,
      assessmentId
    };

    const result = await complianceReportModel.getReportsByOrganization(organizationId, options);

    res.status(200).json({
      success: true,
      message: 'Compliance reports retrieved successfully',
      data: {
        reports: result.reports.map(r => ({
          id: r.id,
          assessment_id: r.assessment_id,
          assessment_name: r.assessment_name,
          assessment_status: r.assessment_status,
          report_type: r.report_type,
          file_name: r.file_name,
          file_size: r.file_size,
          report_format: r.report_format,
          generated_by: r.generated_by_name,
          generated_at: r.generated_at,
          download_url: `/api/compliance-reports/${r.id}/download`
        })),
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Error getting organization reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve compliance reports',
      error: error.message
    });
  }
};

/**
 * Get compliance report metadata by ID
 * GET /api/compliance-reports/:id
 */
const getComplianceReportById = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const organizationId = req.user.organizationId;

    // Check if report exists and belongs to organization
    const hasAccess = await complianceReportModel.reportExistsForOrganization(reportId, organizationId);
    
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    const report = await complianceReportModel.getReportById(reportId);

    res.status(200).json({
      success: true,
      message: 'Compliance report retrieved successfully',
      data: {
        id: report.id,
        assessment_id: report.assessment_id,
        assessment_name: report.assessment_name,
        assessment_status: report.assessment_status,
        framework_version: report.framework_version,
        report_type: report.report_type,
        file_name: report.file_name,
        file_size: report.file_size,
        report_format: report.report_format,
        generated_by: report.generated_by_name,
        generated_by_email: report.generated_by_email,
        generated_at: report.generated_at,
        created_at: report.created_at,
        download_url: `/api/compliance-reports/${report.id}/download`
      }
    });

  } catch (error) {
    console.error('Error getting compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve compliance report',
      error: error.message
    });
  }
};

/**
 * Download compliance report PDF
 * GET /api/compliance-reports/:id/download
 */
const downloadComplianceReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const organizationId = req.user.organizationId;

    // Check if report exists and belongs to organization
    const hasAccess = await complianceReportModel.reportExistsForOrganization(reportId, organizationId);
    
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    // Get report file data
    const reportFile = await complianceReportModel.getReportFile(reportId);

    if (!reportFile) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found'
      });
    }

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportFile.fileName}"`);
    res.setHeader('Content-Length', reportFile.fileSize);

    // Send PDF buffer
    res.send(reportFile.fileData);

  } catch (error) {
    console.error('Error downloading compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download compliance report',
      error: error.message
    });
  }
};

/**
 * Delete compliance report
 * DELETE /api/compliance-reports/:id
 */
const deleteComplianceReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const organizationId = req.user.organizationId;

    // Check if report exists and belongs to organization
    const hasAccess = await complianceReportModel.reportExistsForOrganization(reportId, organizationId);
    
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    // Delete report
    const deleted = await complianceReportModel.deleteReport(reportId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete report'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Compliance report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete compliance report',
      error: error.message
    });
  }
};

/**
 * Get report statistics for organization
 * GET /api/compliance-reports/stats
 */
const getReportStatistics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const statistics = await complianceReportModel.getReportStatistics(organizationId);

    res.status(200).json({
      success: true,
      message: 'Report statistics retrieved successfully',
      data: {
        total_reports: parseInt(statistics.total_reports),
        assessments_with_reports: parseInt(statistics.assessments_with_reports),
        total_storage_mb: statistics.total_storage_bytes ? 
          (parseInt(statistics.total_storage_bytes) / (1024 * 1024)).toFixed(2) : 0,
        reports_last_30_days: parseInt(statistics.reports_last_30_days),
        compliance_reports: parseInt(statistics.compliance_reports),
        executive_summaries: parseInt(statistics.executive_summaries),
        first_report_date: statistics.first_report_date,
        latest_report_date: statistics.latest_report_date
      }
    });

  } catch (error) {
    console.error('Error getting report statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report statistics',
      error: error.message
    });
  }
};

// ===============================
// VALIDATION MIDDLEWARE
// ===============================

const generateReportValidation = [
  param('id').isInt().withMessage('Assessment ID must be a valid integer')
];

const reportIdValidation = [
  param('id').isInt().withMessage('Report ID must be a valid integer')
];

const getOrganizationReportsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('reportType').optional().isString().withMessage('Report type must be a string'),
  query('assessmentId').optional().isInt().withMessage('Assessment ID must be a valid integer')
];

module.exports = {
  generateComplianceReport,
  getComplianceReports,
  getOrganizationReports,
  getComplianceReportById,
  downloadComplianceReport,
  deleteComplianceReport,
  getReportStatistics,
  generateReportValidation,
  reportIdValidation,
  getOrganizationReportsValidation
};
