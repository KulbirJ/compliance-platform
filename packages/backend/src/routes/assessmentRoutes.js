const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware'); // Modified for MVP - uses default user
const assessmentController = require('../controllers/assessmentController');
const controlAssessmentController = require('../controllers/controlAssessmentController');
const nistCsfController = require('../controllers/nistCsfController');

/**
 * Assessment Routes
 * Base path: /api/assessments
 * Auth middleware modified for MVP to use default user
 */

// Assessment CRUD operations
router.post(
  '/assessments',
  authenticateToken, // Modified for MVP
  assessmentController.createAssessmentValidation,
  assessmentController.createAssessment
);

router.get(
  '/assessments',
  authenticateToken, // Modified for MVP
  assessmentController.getAssessments
);

router.get(
  '/assessments/:id',
  authenticateToken, // Modified for MVP
  assessmentController.getAssessmentById
);

router.put(
  '/assessments/:id',
  authenticateToken, // Modified for MVP
  assessmentController.updateAssessmentValidation,
  assessmentController.updateAssessment
);

router.delete(
  '/assessments/:id',
  authenticateToken, // Modified for MVP
  assessmentController.deleteAssessment
);

router.get(
  '/assessments/:id/progress',
  authenticateToken, // Modified for MVP
  assessmentController.getAssessmentProgress
);

// Control assessment operations
router.post(
  '/assessments/:assessmentId/controls',
  authenticateToken, // Modified for MVP
  controlAssessmentController.assessControlValidation,
  controlAssessmentController.assessControl
);

router.post(
  '/assessments/:assessmentId/controls/bulk',
  authenticateToken, // Modified for MVP
  controlAssessmentController.bulkAssessValidation,
  controlAssessmentController.bulkAssessControls
);

router.get(
  '/assessments/:assessmentId/controls',
  authenticateToken, // Modified for MVP
  controlAssessmentController.getControlAssessments
);

router.get(
  '/assessments/:assessmentId/controls/:controlId',
  authenticateToken, // Modified for MVP
  controlAssessmentController.getControlAssessmentById
);

/**
 * NIST CSF Reference Data Routes
 * Base path: /api/nist-csf
 * These are public endpoints for reference data
 */

router.get(
  '/nist-csf/functions',
  nistCsfController.getFunctions
);

router.get(
  '/nist-csf/categories',
  nistCsfController.getCategories
);

router.get(
  '/nist-csf/controls',
  nistCsfController.getControls
);

router.get(
  '/nist-csf/controls/:id',
  nistCsfController.getControlById
);

router.get(
  '/nist-csf/framework',
  nistCsfController.getFullFramework
);

router.get(
  '/nist-csf/search',
  nistCsfController.searchControls
);

module.exports = router;
