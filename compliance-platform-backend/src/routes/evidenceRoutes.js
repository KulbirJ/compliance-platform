const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');
const evidenceController = require('../controllers/evidenceController');

/**
 * Evidence Routes
 * Base path: /api/evidence
 */

// Upload evidence file
router.post(
  '/upload',
  authenticateToken,
  upload.single('file'),
  evidenceController.uploadEvidenceValidation,
  evidenceController.uploadEvidence,
  handleMulterError
);

// Get evidence list for a control assessment
router.get(
  '/',
  authenticateToken,
  evidenceController.getEvidenceList
);

// Get evidence metadata by ID
router.get(
  '/:id',
  authenticateToken,
  evidenceController.getEvidenceById
);

// Download evidence file
router.get(
  '/:id/download',
  authenticateToken,
  evidenceController.downloadEvidence
);

// Update evidence metadata
router.put(
  '/:id',
  authenticateToken,
  evidenceController.updateEvidenceValidation,
  evidenceController.updateEvidence
);

// Delete evidence
router.delete(
  '/:id',
  authenticateToken,
  evidenceController.deleteEvidence
);

// Verify evidence (admin/owner only)
router.post(
  '/:id/verify',
  authenticateToken,
  evidenceController.verifyEvidence
);

module.exports = router;
