const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware'); // Modified for MVP - uses default user
const complianceReportController = require('../controllers/complianceReportController');
const threatReportController = require('../controllers/threatReportController');

/**
 * Report Routes
 * Handles compliance and threat report generation, retrieval, and management
 */

// ===============================
// COMPLIANCE REPORT ROUTES
// ===============================

/**
 * Generate a new compliance report
 * POST /api/reports/compliance
 * Body: { assessmentId: number }
 */
router.post(
  '/compliance',
  authenticateToken, // Modified for MVP
  async (req, res, next) => {
    // Adapt route to controller expectation (assessmentId in params)
    req.params.id = req.body.assessmentId;
    next();
  },
  complianceReportController.generateReportValidation,
  complianceReportController.generateComplianceReport
);

/**
 * Get compliance reports for an assessment
 * GET /api/reports/compliance?assessmentId=1
 */
router.get(
  '/compliance',
  authenticateToken, // Modified for MVP
  async (req, res, next) => {
    // Adapt route to controller expectation (assessmentId in params)
    req.params.id = req.query.assessmentId;
    next();
  },
  complianceReportController.getComplianceReports
);

/**
 * Get compliance report metadata by ID
 * GET /api/reports/compliance/:id
 */
router.get(
  '/compliance/:id',
  authenticateToken, // Modified for MVP
  complianceReportController.reportIdValidation,
  complianceReportController.getComplianceReportById
);

/**
 * Download compliance report PDF
 * GET /api/reports/compliance/:id/download
 */
router.get(
  '/compliance/:id/download',
  authenticateToken, // Modified for MVP
  complianceReportController.reportIdValidation,
  complianceReportController.downloadComplianceReport
);

/**
 * Delete compliance report
 * DELETE /api/reports/compliance/:id
 */
router.delete(
  '/compliance/:id',
  authenticateToken, // Modified for MVP
  complianceReportController.reportIdValidation,
  complianceReportController.deleteComplianceReport
);

/**
 * Get all compliance reports for organization
 * GET /api/reports/compliance/organization/all
 */
router.get(
  '/compliance/organization/all',
  authenticateToken, // Modified for MVP
  complianceReportController.getOrganizationReportsValidation,
  complianceReportController.getOrganizationReports
);

/**
 * Get compliance report statistics
 * GET /api/reports/compliance/stats
 */
router.get(
  '/compliance/stats',
  authenticateToken, // Modified for MVP
  complianceReportController.getReportStatistics
);

// ===============================
// THREAT REPORT ROUTES
// ===============================

/**
 * Generate a new threat report
 * POST /api/reports/threat
 * Body: { threatModelId: number }
 */
router.post(
  '/threat',
  authenticateToken, // Modified for MVP
  async (req, res, next) => {
    // Adapt route to controller expectation (threatModelId in params)
    req.params.id = req.body.threatModelId;
    next();
  },
  threatReportController.generateReportValidation,
  threatReportController.generateThreatReport
);

/**
 * Get threat reports for a threat model
 * GET /api/reports/threat?threatModelId=1
 */
router.get(
  '/threat',
  authenticateToken, // Modified for MVP
  async (req, res, next) => {
    // Adapt route to controller expectation (threatModelId in params)
    req.params.id = req.query.threatModelId;
    next();
  },
  threatReportController.getThreatReports
);

/**
 * Get threat report metadata by ID
 * GET /api/reports/threat/:id
 */
router.get(
  '/threat/:id',
  authenticateToken, // Modified for MVP
  threatReportController.reportIdValidation,
  threatReportController.getThreatReportById
);

/**
 * Download threat report PDF
 * GET /api/reports/threat/:id/download
 */
router.get(
  '/threat/:id/download',
  authenticateToken, // Modified for MVP
  threatReportController.reportIdValidation,
  threatReportController.downloadThreatReport
);

/**
 * Delete threat report
 * DELETE /api/reports/threat/:id
 */
router.delete(
  '/threat/:id',
  authenticateToken, // Modified for MVP
  threatReportController.reportIdValidation,
  threatReportController.deleteThreatReport
);

/**
 * Get all threat reports for organization
 * GET /api/reports/threat/organization/all
 */
router.get(
  '/threat/organization/all',
  authenticateToken, // Modified for MVP
  threatReportController.getOrganizationReportsValidation,
  threatReportController.getOrganizationReports
);

/**
 * Get threat report statistics
 * GET /api/reports/threat/stats
 */
router.get(
  '/threat/stats',
  authenticateToken, // Modified for MVP
  threatReportController.getReportStatistics
);

module.exports = router;
