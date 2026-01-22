/**
 * @fileoverview STRIDE Category Model
 * Provides read-only access to STRIDE threat categorization reference data.
 * STRIDE is a threat modeling framework that classifies threats into six categories:
 * - Spoofing: Pretending to be something or someone other than yourself
 * - Tampering: Modifying data or code
 * - Repudiation: Claiming not to have performed an action
 * - Information Disclosure: Exposing information to unauthorized parties
 * - Denial of Service: Denying or degrading service to users
 * - Elevation of Privilege: Gaining unauthorized capabilities or permissions
 */

const pool = require('../config/database');

/**
 * Get all STRIDE categories
 * @returns {Promise<Array>} Array of all STRIDE categories
 * @throws {Error} Database error
 */
const getAllStrideCategories = async () => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        category_code,
        category_name,
        description,
        display_order,
        created_at
      FROM stride_categories
      ORDER BY display_order ASC`
    );

    return result.rows;
  } catch (error) {
    console.error('Error in getAllStrideCategories:', error);
    throw new Error('Failed to retrieve STRIDE categories');
  }
};

/**
 * Get a specific STRIDE category by ID
 * @param {number} id - The STRIDE category ID
 * @returns {Promise<Object|null>} STRIDE category object or null if not found
 * @throws {Error} Database error
 */
const getStrideCategoryById = async (id) => {
  // Validate input
  if (!id || isNaN(id)) {
    throw new Error('Valid STRIDE category ID is required');
  }

  try {
    const result = await pool.query(
      `SELECT 
        id,
        category_code,
        category_name,
        description,
        display_order,
        created_at
      FROM stride_categories
      WHERE id = $1`,
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in getStrideCategoryById:', error);
    throw new Error('Failed to retrieve STRIDE category');
  }
};

/**
 * Get a STRIDE category by its code (S, T, R, I, D, E)
 * @param {string} code - The STRIDE category code (case-insensitive)
 * @returns {Promise<Object|null>} STRIDE category object or null if not found
 * @throws {Error} Database error
 */
const getStrideCategoryByCode = async (code) => {
  // Validate input
  if (!code || typeof code !== 'string') {
    throw new Error('Valid STRIDE category code is required');
  }

  // Normalize code to uppercase for case-insensitive matching
  const normalizedCode = code.trim().toUpperCase();

  try {
    const result = await pool.query(
      `SELECT 
        id,
        category_code,
        category_name,
        description,
        display_order,
        created_at
      FROM stride_categories
      WHERE UPPER(category_code) = $1`,
      [normalizedCode]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in getStrideCategoryByCode:', error);
    throw new Error('Failed to retrieve STRIDE category');
  }
};

/**
 * Get threat count by STRIDE category for a specific organization
 * @param {number} organizationId - The organization ID
 * @returns {Promise<Array>} Array of STRIDE categories with threat counts
 * @throws {Error} Database error
 */
const getStrideCategoriesWithCounts = async (organizationId) => {
  // Validate input
  if (!organizationId || isNaN(organizationId)) {
    throw new Error('Valid organization ID is required');
  }

  try {
    const result = await pool.query(
      `SELECT 
        sc.id,
        sc.category_code,
        sc.category_name,
        sc.description,
        sc.display_order,
        COUNT(t.id) AS threat_count,
        COUNT(CASE WHEN t.risk_level = 'critical' THEN 1 END) AS critical_count,
        COUNT(CASE WHEN t.risk_level = 'high' THEN 1 END) AS high_count,
        COUNT(CASE WHEN t.risk_level = 'medium' THEN 1 END) AS medium_count,
        COUNT(CASE WHEN t.risk_level = 'low' THEN 1 END) AS low_count
      FROM stride_categories sc
      LEFT JOIN threats t ON sc.id = t.stride_category_id
      LEFT JOIN threat_models tm ON t.threat_model_id = tm.id
      WHERE tm.organization_id = $1 OR tm.organization_id IS NULL
      GROUP BY sc.id, sc.category_code, sc.category_name, sc.description, sc.display_order
      ORDER BY sc.display_order ASC`,
      [organizationId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error in getStrideCategoriesWithCounts:', error);
    throw new Error('Failed to retrieve STRIDE categories with counts');
  }
};

module.exports = {
  getAllStrideCategories,
  getStrideCategoryById,
  getStrideCategoryByCode,
  getStrideCategoriesWithCounts
};
