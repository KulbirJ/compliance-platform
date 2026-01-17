const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const authRoutes = require('./routes/authRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const threatModelRoutes = require('./routes/threatModelRoutes');
const reportRoutes = require('./routes/reportRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'API is healthy!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api', assessmentRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api', threatModelRoutes);
app.use('/api/reports', reportRoutes);

// 404 Error Handler - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err);

  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
});

// Error handling middleware (from errorHandler)
app.use(errorHandler);

module.exports = app;
