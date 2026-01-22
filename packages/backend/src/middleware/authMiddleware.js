const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Handles JWT token verification and role-based authorization
 */

/**
 * Authenticate JWT Token
 * Middleware to verify JWT token from Authorization header
 * DISABLED FOR MVP - Uses default user for all requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // MVP: Use default user (admin user with ID 1)
    // This will be replaced with SSO authentication later
    const { query } = require('../config/database');
    
    // Get the first user from the database (should be admin)
    const userResult = await query(
      'SELECT id, username, email, full_name FROM users ORDER BY id LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      // No users exist - return error
      return res.status(500).json({
        success: false,
        message: 'No users found in database. Please run database seeds.'
      });
    }
    
    const user = userResult.rows[0];
    
    // Attach default user info to request object
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      isAdmin: true // MVP: All users are admin
    };

    // Continue to next middleware
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication setup failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Authorize Role
 * Middleware factory to check if user has required role(s)
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'user')
 * @returns {Function} Express middleware function
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has admin role or if roles include user's admin status
      const userRole = req.user.isAdmin ? 'admin' : 'user';

      // Check if user's role is in the allowed roles
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      // User has required role, continue
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Optional Authentication
 * Middleware to attach user info if token is present, but don't fail if missing
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (token) {
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
          );

          req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            isAdmin: decoded.isAdmin
          };
        } catch (error) {
          // Token invalid or expired, but we don't fail - just continue without user
          req.user = null;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on errors, just continue without user
    req.user = null;
    next();
  }
};

// Legacy alias for backward compatibility
const protect = authenticateToken;

module.exports = {
  authenticateToken,
  authorizeRole,
  optionalAuth,
  protect // Backward compatibility
};
