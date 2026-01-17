const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const assessmentController = require('../controllers/assessmentController');
const controlAssessmentController = require('../controllers/controlAssessmentController');
const nistCsfController = require('../controllers/nistCsfController');

/**
 * Assessment Routes
 * Base path: /api/assessments
 */

// Assessment CRUD operations
router.post(
  '/assessments',
  authenticateToken,
  assessmentController.createAssessmentValidation,
  assessmentController.createAssessment
);

router.get(
  '/assessments',
  authenticateToken,
  assessmentController.getAssessments
);

router.get(
  '/assessments/:id',
  authenticateToken,
  assessmentController.getAssessmentById
);

router.put(
  '/assessments/:id',
  authenticateToken,
  assessmentController.updateAssessmentValidation,
  assessmentController.updateAssessment
);

router.delete(
  '/assessments/:id',
  authenticateToken,
  assessmentController.deleteAssessment
);

router.get(
  '/assessments/:id/progress',
  authenticateToken,
  assessmentController.getAssessmentProgress
);

// Control assessment operations
router.post(
  '/assessments/:assessmentId/controls',
  authenticateToken,
  controlAssessmentController.assessControlValidation,
  controlAssessmentController.assessControl
);

router.post(
  '/assessments/:assessmentId/controls/bulk',
  authenticateToken,
  controlAssessmentController.bulkAssessValidation,
  controlAssessmentController.bulkAssessControls
);

router.get(
  '/assessments/:assessmentId/controls',
  authenticateToken,
  controlAssessmentController.getControlAssessments
);

router.get(
  '/assessments/:assessmentId/controls/:controlId',
  authenticateToken,
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
