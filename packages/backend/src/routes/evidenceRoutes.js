const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware'); // Modified for MVP - uses default user
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');
const evidenceController = require('../controllers/evidenceController');

/**
 * Evidence Routes
 * Base path: /api/evidence
 */

// Upload evidence file
router.post(
  '/upload',
  authenticateToken, // Modified for MVP
  upload.single('file'),
  evidenceController.uploadEvidenceValidation,
  evidenceController.uploadEvidence,
  handleMulterError
);

// Get evidence list for a control assessment
router.get(
  '/',
  authenticateToken, // Modified for MVP
  evidenceController.getEvidenceList
);

// Get evidence metadata by ID
router.get(
  '/:id',
  authenticateToken, // Modified for MVP
  evidenceController.getEvidenceById
);

// Download evidence file
router.get(
  '/:id/download',
  authenticateToken, // Modified for MVP
  evidenceController.downloadEvidence
);

// Update evidence metadata
router.put(
  '/:id',
  authenticateToken, // Modified for MVP
  evidenceController.updateEvidenceValidation,
  evidenceController.updateEvidence
);

// Delete evidence
router.delete(
  '/:id',
  authenticateToken, // Modified for MVP
  evidenceController.deleteEvidence
);

// Verify evidence (admin/owner only)
router.post(
  '/:id/verify',
  authenticateToken, // Modified for MVP
  evidenceController.verifyEvidence
);

module.exports = router;
