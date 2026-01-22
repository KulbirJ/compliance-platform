const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const assessmentRoutes = require('./assessmentRoutes');
const evidenceRoutes = require('./evidenceRoutes');
const reportRoutes = require('./reportRoutes');
const threatModelRoutes = require('./threatModelRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/reports', reportRoutes);
router.use('/', threatModelRoutes); // Threat model routes include /threat-models, /assets, /threats, etc.

router.get('/', (req, res) => {
  res.json({
    message: 'Compliance Platform API',
    version: process.env.API_VERSION || 'v1'
  });
});

module.exports = router;
