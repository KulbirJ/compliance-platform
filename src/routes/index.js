const express = require('express');
const router = express.Router();

// Import route modules here
// Example: const userRoutes = require('./userRoutes');

// Mount routes
// Example: router.use('/users', userRoutes);

router.get('/', (req, res) => {
  res.json({
    message: 'Compliance Platform API',
    version: process.env.API_VERSION || 'v1'
  });
});

module.exports = router;
