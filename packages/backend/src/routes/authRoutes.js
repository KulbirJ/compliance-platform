const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// Public routes - No authentication required
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', authController.loginValidation, authController.login);

// Protected routes - Authentication required
/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user details
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
