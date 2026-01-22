const express = require('express');
const router = express.Router();
const riskRegisterController = require('../controllers/riskRegisterController');

// Get all risks (with optional filters)
router.get('/', riskRegisterController.getAllRisks);

// Get risk statistics
router.get('/statistics', riskRegisterController.getRiskStatistics);

// Export risk register
router.get('/export', riskRegisterController.exportRiskRegister);

// Get single risk by ID
router.get('/:id', riskRegisterController.getRiskById);

// Create new risk
router.post('/', riskRegisterController.createRisk);

// Update risk
router.put('/:id', riskRegisterController.updateRisk);

// Delete risk
router.delete('/:id', riskRegisterController.deleteRisk);

module.exports = router;
