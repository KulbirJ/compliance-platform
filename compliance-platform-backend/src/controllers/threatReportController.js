const { body, param, query, validationResult } = require('express-validator');
const threatReportModel = require('../models/threatReportModel');
const threatModelModel = require('../models/threatModelModel');
const assetModel = require('../models/assetModel');
const threatModel = require('../models/threatModel');
const mitigationModel = require('../models/mitigationModel');
const { generateThreatPDF } = require('../utils/threatReportGenerator');

/**
 * Threat Report Controller
 * Handles threat report generation, retrieval, and management
 */

/**
 * Generate a new threat report
 * POST /api/threat-models/:id/reports
 */
const generateThreatReport = async (req, res) => {
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

    const threatModelId = parseInt(req.params.id);
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Validate threat model exists and belongs to user's organization
    const threatModelData = await threatModelModel.getThreatModelById(threatModelId);
    
    if (!threatModelData) {
      return res.status(404).json({
        success: false,
        message: 'Threat model not found'
      });
    }

    if (threatModelData.organization_id !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this threat model'
      });
    }

    // Get organization name from user data
    const organizationName = req.user.organizationName || 'Organization';

    // Fetch assets for threat model
    const assets = await assetModel.getAssetsByThreatModel(threatModelId);

    // Fetch threats for threat model with STRIDE categories
    const threats = await threatModel.getThreatsByThreatModel(threatModelId);

    if (!threats || threats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate report: No threats found for this threat model'
      });
    }

    // Fetch all mitigations for these threats
    const threatIds = threats.map(t => t.id);
    const allMitigations = [];
    
    for (const threatId of threatIds) {
      const mitigations = await mitigationModel.getMitigationsByThreat(threatId);
      allMitigations.push(...mitigations);
    }

    // Generate PDF using the utility
    const pdfBuffer = await generateThreatPDF(
      threatModelData,
      assets,
      threats,
      allMitigations,
      organizationName
    );

    // Prepare report metadata
    const reportData = {
      reportType: 'threat_analysis_report',
      fileName: `Threat_Report_${threatModelData.model_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      fileSize: pdfBuffer.length,
      reportFormat: 'pdf'
    };

    // Store report in database
    const report = await threatReportModel.createThreatReport(
      threatModelId,
      userId,
      reportData,
      pdfBuffer
    );

    res.status(201).json({
      success: true,
      message: 'Threat report generated successfully',
      data: {
        id: report.id,
        threat_model_id: report.threat_model_id,
        report_type: report.report_type,
        file_name: report.file_name,
        file_size: report.file_size,
        report_format: report.report_format,
        generated_at: report.generated_at,
        download_url: `/api/threat-reports/${report.id}/download`
      }
    });

  } catch (error) {
    console.error('Error generating threat report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate threat report',
      error: error.message
    });
  }
};

/**
 * Get all threat reports for a threat model
 * GET /api/threat-models/:id/reports
 */
const getThreatReports = async (req, res) => {
  try {
    const threatModelId = parseInt(req.params.id);
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Validate threat model exists and belongs to user's organization
    const threatModelData = await threatModelModel.getThreatModelById(threatModelId);
    
    if (!threatModelData) {
      return res.status(404).json({
        success: false,
        message: 'Threat model not found'
      });
    }

    if (threatModelData.organization_id !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this threat model'
      });
    }

    // Get reports for threat model
    const reports = await threatReportModel.getReportsByThreatModel(threatModelId);

    res.status(200).json({
      success: true,
      message: 'Threat reports retrieved successfully',
      data: {
        threat_model_id: threatModelId,
        model_name: threatModelData.model_name,
        system_name: threatModelData.system_name,
        total_reports: reports.length,
        reports: reports.map(r => ({
          id: r.id,
          report_type: r.report_type,
          file_name: r.file_name,
          file_size: r.file_size,
          report_format: r.report_format,
          generated_by: r.generated_by_name,
          generated_at: r.generated_at,
          download_url: `/api/threat-reports/${r.id}/download`
        }))
      }
    });

  } catch (error) {
    console.error('Error getting threat reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve threat reports',
      error: error.message
    });
  }
};

/**
 * Get all threat reports for organization
 * GET /api/threat-reports
 */
const getOrganizationReports = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const reportType = req.query.reportType;
    const threatModelId = req.query.threatModelId ? parseInt(req.query.threatModelId) : null;

    const options = {
      page,
      limit,
      reportType,
      threatModelId
    };

    const result = await threatReportModel.getReportsByOrganization(organizationId, options);

    res.status(200).json({
      success: true,
      message: 'Threat reports retrieved successfully',
      data: {
        reports: result.reports.map(r => ({
          id: r.id,
          threat_model_id: r.threat_model_id,
          model_name: r.model_name,
          system_name: r.system_name,
          threat_model_status: r.threat_model_status,
          risk_score: r.risk_score,
          report_type: r.report_type,
          file_name: r.file_name,
          file_size: r.file_size,
          report_format: r.report_format,
          generated_by: r.generated_by_name,
          generated_at: r.generated_at,
          download_url: `/api/threat-reports/${r.id}/download`
        })),
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Error getting organization threat reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve threat reports',
      error: error.message
    });
  }
};

/**
 * Get threat report metadata by ID
 * GET /api/threat-reports/:id
 */
const getThreatReportById = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const organizationId = req.user.organizationId;

    // Check if report exists and belongs to organization
    const hasAccess = await threatReportModel.reportExistsForOrganization(reportId, organizationId);
    
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    const report = await threatReportModel.getReportById(reportId);

    res.status(200).json({
      success: true,
      message: 'Threat report retrieved successfully',
      data: {
        id: report.id,
        threat_model_id: report.threat_model_id,
        model_name: report.model_name,
        system_name: report.system_name,
        threat_model_status: report.threat_model_status,
        risk_score: report.risk_score,
        report_type: report.report_type,
        file_name: report.file_name,
        file_size: report.file_size,
        report_format: report.report_format,
        generated_by: report.generated_by_name,
        generated_by_email: report.generated_by_email,
        generated_at: report.generated_at,
        created_at: report.created_at,
        download_url: `/api/threat-reports/${report.id}/download`
      }
    });

  } catch (error) {
    console.error('Error getting threat report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve threat report',
      error: error.message
    });
  }
};

/**
 * Download threat report PDF
 * GET /api/threat-reports/:id/download
 */
const downloadThreatReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const organizationId = req.user.organizationId;

    // Check if report exists and belongs to organization
    const hasAccess = await threatReportModel.reportExistsForOrganization(reportId, organizationId);
    
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    // Get report file data
    const reportFile = await threatReportModel.getReportFile(reportId);

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
    console.error('Error downloading threat report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download threat report',
      error: error.message
    });
  }
};

/**
 * Delete threat report
 * DELETE /api/threat-reports/:id
 */
const deleteThreatReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const organizationId = req.user.organizationId;

    // Check if report exists and belongs to organization
    const hasAccess = await threatReportModel.reportExistsForOrganization(reportId, organizationId);
    
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    // Delete report
    const deleted = await threatReportModel.deleteReport(reportId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete report'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Threat report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting threat report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete threat report',
      error: error.message
    });
  }
};

/**
 * Get report statistics for organization
 * GET /api/threat-reports/stats
 */
const getReportStatistics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const statistics = await threatReportModel.getReportStatistics(organizationId);

    res.status(200).json({
      success: true,
      message: 'Threat report statistics retrieved successfully',
      data: {
        total_reports: parseInt(statistics.total_reports),
        threat_models_with_reports: parseInt(statistics.threat_models_with_reports),
        total_storage_mb: statistics.total_storage_bytes ? 
          (parseInt(statistics.total_storage_bytes) / (1024 * 1024)).toFixed(2) : 0,
        reports_last_30_days: parseInt(statistics.reports_last_30_days),
        threat_analysis_reports: parseInt(statistics.threat_analysis_reports),
        executive_summaries: parseInt(statistics.executive_summaries),
        risk_assessments: parseInt(statistics.risk_assessments),
        first_report_date: statistics.first_report_date,
        latest_report_date: statistics.latest_report_date
      }
    });

  } catch (error) {
    console.error('Error getting threat report statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve threat report statistics',
      error: error.message
    });
  }
};

// ===============================
// VALIDATION MIDDLEWARE
// ===============================

const generateReportValidation = [
  param('id').isInt().withMessage('Threat Model ID must be a valid integer')
];

const reportIdValidation = [
  param('id').isInt().withMessage('Report ID must be a valid integer')
];

const getOrganizationReportsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('reportType').optional().isString().withMessage('Report type must be a string'),
  query('threatModelId').optional().isInt().withMessage('Threat Model ID must be a valid integer')
];

module.exports = {
  generateThreatReport,
  getThreatReports,
  getOrganizationReports,
  getThreatReportById,
  downloadThreatReport,
  deleteThreatReport,
  getReportStatistics,
  generateReportValidation,
  reportIdValidation,
  getOrganizationReportsValidation
};
