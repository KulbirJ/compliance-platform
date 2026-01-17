const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const userModel = require('../models/userModel');

/**
 * Authentication Controller
 * Handles user registration, login, and authentication
 */

const authController = {
  /**
   * Validation rules for registration
   */
  registerValidation: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Full name must be between 2 and 255 characters')
  ],

  /**
   * Validation rules for login
   */
  loginValidation: [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }

      const { email, username, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await userModel.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const existingUsername = await userModel.findUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const newUser = await userModel.createUser(username, email, passwordHash, fullName);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser.id,
          username: newUser.username,
          email: newUser.email,
          isAdmin: newUser.is_admin
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.full_name,
            isActive: newUser.is_active,
            isAdmin: newUser.is_admin,
            createdAt: newUser.created_at
          }
        }
      });
    } catch (error) {
      // Handle specific database errors
      if (error.message.includes('Email already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
      if (error.message.includes('Username already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
      next(error);
    }
  },

  /**
   * Login existing user
   * @route POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }

      const { email, username, password } = req.body;

      // User must provide either email or username
      if (!email && !username) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email or username'
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }

      // Find user by email or username
      let user;
      if (email) {
        user = await userModel.findUserByEmail(email);
      } else {
        user = await userModel.findUserByUsername(username);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login timestamp
      await userModel.updateLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            isActive: user.is_active,
            isAdmin: user.is_admin,
            lastLogin: user.last_login
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current logged-in user details
   * @route GET /api/auth/me
   * @access Private
   */
  async getCurrentUser(req, res, next) {
    try {
      // User ID is extracted from JWT token by auth middleware
      const userId = req.user.userId;

      // Get user from database
      const user = await userModel.findUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          isActive: user.is_active,
          isAdmin: user.is_admin,
          lastLogin: user.last_login,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
