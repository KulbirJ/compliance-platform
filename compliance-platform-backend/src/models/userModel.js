const { query } = require('../config/database');

/**
 * User Model - Database query functions for user management
 */

const userModel = {
  /**
   * Create a new user
   * @param {string} username - Username
   * @param {string} email - User email
   * @param {string} passwordHash - Hashed password
   * @param {string} fullName - User's full name
   * @returns {Promise<Object>} Created user object
   */
  async createUser(username, email, passwordHash, fullName) {
    try {
      const sql = `
        INSERT INTO users (username, email, password_hash, full_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, full_name, is_active, is_admin, created_at, updated_at
      `;
      const values = [username, email, passwordHash, fullName];
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create user');
      }
      
      return result.rows[0];
    } catch (error) {
      // Handle duplicate key violations
      if (error.code === '23505') {
        if (error.constraint === 'users_email_key') {
          throw new Error('Email already exists');
        }
        if (error.constraint === 'users_username_key') {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  },

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findUserByEmail(email) {
    try {
      const sql = `
        SELECT id, username, email, password_hash, full_name, is_active, is_admin, 
               last_login, created_at, updated_at
        FROM users
        WHERE email = $1
      `;
      const result = await query(sql, [email]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  },

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findUserById(id) {
    try {
      const sql = `
        SELECT id, username, email, password_hash, full_name, is_active, is_admin,
               last_login, created_at, updated_at
        FROM users
        WHERE id = $1
      `;
      const result = await query(sql, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  },

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findUserByUsername(username) {
    try {
      const sql = `
        SELECT id, username, email, password_hash, full_name, is_active, is_admin,
               last_login, created_at, updated_at
        FROM users
        WHERE username = $1
      `;
      const result = await query(sql, [username]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  },

  /**
   * Update user details
   * @param {number} id - User ID
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(id, updates) {
    try {
      // Build dynamic SQL query based on provided updates
      const allowedFields = ['username', 'email', 'password_hash', 'full_name', 'is_active', 'is_admin', 'last_login'];
      const updateFields = [];
      const values = [];
      let paramCounter = 1;

      // Filter only allowed fields and build SET clause
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramCounter}`);
          values.push(value);
          paramCounter++;
        }
      }

      // If no valid fields to update
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Add user ID as last parameter
      values.push(id);

      const sql = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, username, email, full_name, is_active, is_admin, 
                  last_login, created_at, updated_at
      `;

      const result = await query(sql, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      // Handle duplicate key violations
      if (error.code === '23505') {
        if (error.constraint === 'users_email_key') {
          throw new Error('Email already exists');
        }
        if (error.constraint === 'users_username_key') {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  },

  /**
   * Delete a user (soft delete by setting is_active to false)
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if user was deleted
   */
  async deleteUser(id) {
    try {
      const sql = `
        UPDATE users
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `;
      const result = await query(sql, [id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  },

  /**
   * Permanently delete a user from database
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if user was permanently deleted
   */
  async permanentlyDeleteUser(id) {
    try {
      const sql = `DELETE FROM users WHERE id = $1 RETURNING id`;
      const result = await query(sql, [id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Error permanently deleting user: ${error.message}`);
    }
  },

  /**
   * Get all users with pagination
   * @param {number} limit - Number of users to return
   * @param {number} offset - Number of users to skip
   * @returns {Promise<Array>} Array of user objects
   */
  async getAllUsers(limit = 10, offset = 0) {
    try {
      const sql = `
        SELECT id, username, email, full_name, is_active, is_admin,
               last_login, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const result = await query(sql, [limit, offset]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  },

  /**
   * Get total user count
   * @returns {Promise<number>} Total number of users
   */
  async getUserCount() {
    try {
      const sql = `SELECT COUNT(*) as count FROM users WHERE is_active = true`;
      const result = await query(sql);
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      throw new Error(`Error getting user count: ${error.message}`);
    }
  },

  /**
   * Update user's last login timestamp
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if updated successfully
   */
  async updateLastLogin(id) {
    try {
      const sql = `
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await query(sql, [id]);
      return true;
    } catch (error) {
      throw new Error(`Error updating last login: ${error.message}`);
    }
  }
};

module.exports = userModel;
