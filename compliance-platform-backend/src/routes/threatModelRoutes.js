const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const threatModelController = require('../controllers/threatModelController');
const assetController = require('../controllers/assetController');
const threatController = require('../controllers/threatController');
const mitigationController = require('../controllers/mitigationController');
const strideController = require('../controllers/strideController');

/**
 * Threat Modeling Routes
 * Handles threat models, assets, threats, mitigations, and STRIDE reference data
 */

// ===========================
// THREAT MODEL ROUTES
// ===========================

// Create new threat model
router.post(
  '/threat-models',
  authenticateToken,
  threatModelController.createThreatModelValidation,
  threatModelController.createThreatModel
);

// Get all threat models for user's organization
router.get(
  '/threat-models',
  authenticateToken,
  threatModelController.getThreatModels
);

// Get specific threat model by ID
router.get(
  '/threat-models/:id',
  authenticateToken,
  threatModelController.idValidation,
  threatModelController.getThreatModelById
);

// Update threat model
router.put(
  '/threat-models/:id',
  authenticateToken,
  threatModelController.updateThreatModelValidation,
  threatModelController.updateThreatModel
);

// Delete threat model
router.delete(
  '/threat-models/:id',
  authenticateToken,
  threatModelController.idValidation,
  threatModelController.deleteThreatModel
);

// Get threat model statistics
router.get(
  '/threat-models/:id/stats',
  authenticateToken,
  threatModelController.idValidation,
  threatModelController.getThreatModelStats
);

// ===========================
// ASSET ROUTES
// ===========================

// Create new asset
router.post(
  '/assets',
  authenticateToken,
  assetController.createAssetValidation,
  assetController.createAsset
);

// Get all assets for user's organization
router.get(
  '/assets',
  authenticateToken,
  assetController.getAssets
);

// Get specific asset by ID
router.get(
  '/assets/:id',
  authenticateToken,
  assetController.idValidation,
  assetController.getAssetById
);

// Update asset
router.put(
  '/assets/:id',
  authenticateToken,
  assetController.updateAssetValidation,
  assetController.updateAsset
);

// Delete asset
router.delete(
  '/assets/:id',
  authenticateToken,
  assetController.idValidation,
  assetController.deleteAsset
);

// Link asset to threat model
router.post(
  '/threat-models/:id/assets',
  authenticateToken,
  assetController.linkAssetValidation,
  assetController.linkAsset
);

// Unlink asset from threat model
router.delete(
  '/threat-models/:id/assets/:assetId',
  authenticateToken,
  assetController.unlinkAsset
);

// Get all assets for a threat model
router.get(
  '/threat-models/:id/assets',
  authenticateToken,
  assetController.getThreatModelAssets
);

// ===========================
// THREAT ROUTES
// ===========================

// Create new threat
router.post(
  '/threats',
  authenticateToken,
  threatController.createThreatValidation,
  threatController.createThreat
);

// Get all threats for a threat model (grouped by STRIDE)
router.get(
  '/threat-models/:threatModelId/threats',
  authenticateToken,
  threatController.threatModelIdValidation,
  threatController.getThreats
);

// Get high-risk threats for a threat model
router.get(
  '/threat-models/:threatModelId/threats/high-risk',
  authenticateToken,
  threatController.threatModelIdValidation,
  threatController.getHighRiskThreats
);

// Get specific threat by ID
router.get(
  '/threats/:id',
  authenticateToken,
  threatController.idValidation,
  threatController.getThreatById
);

// Update threat
router.put(
  '/threats/:id',
  authenticateToken,
  threatController.updateThreatValidation,
  threatController.updateThreat
);

// Delete threat
router.delete(
  '/threats/:id',
  authenticateToken,
  threatController.idValidation,
  threatController.deleteThreat
);

// ===========================
// MITIGATION ROUTES
// ===========================

// Create new mitigation
router.post(
  '/mitigations',
  authenticateToken,
  mitigationController.createMitigationValidation,
  mitigationController.createMitigation
);

// Get all mitigations for a threat
router.get(
  '/threats/:threatId/mitigations',
  authenticateToken,
  mitigationController.threatIdValidation,
  mitigationController.getMitigations
);

// Get mitigations assigned to current user
router.get(
  '/mitigations/my',
  authenticateToken,
  mitigationController.getMyMitigations
);

// Get specific mitigation by ID
router.get(
  '/mitigations/:id',
  authenticateToken,
  mitigationController.idValidation,
  mitigationController.getMitigationById
);

// Update mitigation
router.put(
  '/mitigations/:id',
  authenticateToken,
  mitigationController.updateMitigationValidation,
  mitigationController.updateMitigation
);

// Delete mitigation
router.delete(
  '/mitigations/:id',
  authenticateToken,
  mitigationController.idValidation,
  mitigationController.deleteMitigation
);

// ===========================
// STRIDE REFERENCE ROUTES
// ===========================

// Get all STRIDE categories (reference data - public)
router.get(
  '/stride/categories',
  strideController.getStrideCategories
);

// Get STRIDE category by ID
router.get(
  '/stride/categories/:id',
  strideController.getStrideCategoryById
);

// Get STRIDE category by code (S, T, R, I, D, E)
router.get(
  '/stride/categories/code/:code',
  strideController.getStrideCategoryByCode
);

// Get STRIDE categories with threat counts (requires auth)
router.get(
  '/stride/categories/with-counts',
  authenticateToken,
  strideController.getStrideCategoriesWithCounts
);

module.exports = router;
