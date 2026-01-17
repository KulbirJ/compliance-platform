const { query } = require('../config/database');

/**
 * NIST CSF Model - Database query functions for NIST Cybersecurity Framework reference data
 */

const nistCsfModel = {
  /**
   * Get all NIST CSF functions
   * @returns {Promise<Array>} Array of NIST CSF functions
   */
  async getAllFunctions() {
    try {
      const sql = `
        SELECT 
          id,
          function_code,
          function_name,
          description,
          display_order,
          created_at
        FROM nist_csf_functions
        ORDER BY display_order
      `;
      
      const result = await query(sql);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching NIST CSF functions: ${error.message}`);
    }
  },

  /**
   * Get categories for a specific NIST CSF function
   * @param {number} functionId - Function ID
   * @returns {Promise<Array>} Array of categories with function info
   */
  async getCategoriesByFunction(functionId) {
    try {
      const sql = `
        SELECT 
          cat.id,
          cat.function_id,
          cat.category_code,
          cat.category_name,
          cat.description,
          cat.display_order,
          cat.created_at,
          f.function_code,
          f.function_name,
          f.description as function_description
        FROM nist_csf_categories cat
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        WHERE cat.function_id = $1
        ORDER BY cat.display_order
      `;
      
      const result = await query(sql, [functionId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching categories by function: ${error.message}`);
    }
  },

  /**
   * Get controls for a specific NIST CSF category
   * @param {number} categoryId - Category ID
   * @returns {Promise<Array>} Array of controls with category and function info
   */
  async getControlsByCategory(categoryId) {
    try {
      const sql = `
        SELECT 
          c.id,
          c.category_id,
          c.control_code,
          c.control_name,
          c.description,
          c.guidance,
          c.importance,
          c.display_order,
          c.created_at,
          cat.category_code,
          cat.category_name,
          cat.description as category_description,
          f.id as function_id,
          f.function_code,
          f.function_name,
          f.description as function_description
        FROM nist_csf_controls c
        INNER JOIN nist_csf_categories cat ON c.category_id = cat.id
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        WHERE c.category_id = $1
        ORDER BY c.display_order
      `;
      
      const result = await query(sql, [categoryId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching controls by category: ${error.message}`);
    }
  },

  /**
   * Get all NIST CSF controls with their category and function info
   * @param {Object} options - Query options (limit, offset, importance filter)
   * @returns {Promise<Array>} Array of all controls with hierarchy info
   */
  async getAllControls(options = {}) {
    try {
      const { limit, offset, importance } = options;
      
      let sql = `
        SELECT 
          c.id,
          c.category_id,
          c.control_code,
          c.control_name,
          c.description,
          c.guidance,
          c.importance,
          c.display_order,
          c.created_at,
          cat.category_code,
          cat.category_name,
          cat.description as category_description,
          f.id as function_id,
          f.function_code,
          f.function_name,
          f.description as function_description
        FROM nist_csf_controls c
        INNER JOIN nist_csf_categories cat ON c.category_id = cat.id
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
      `;
      
      const values = [];
      
      // Add importance filter if provided
      if (importance) {
        sql += ` WHERE c.importance = $1`;
        values.push(importance);
      }
      
      sql += ` ORDER BY f.display_order, cat.display_order, c.display_order`;
      
      // Add pagination if provided
      if (limit) {
        sql += ` LIMIT $${values.length + 1}`;
        values.push(limit);
      }
      
      if (offset) {
        sql += ` OFFSET $${values.length + 1}`;
        values.push(offset);
      }
      
      const result = await query(sql, values);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching all controls: ${error.message}`);
    }
  },

  /**
   * Get a specific control by ID with full details
   * @param {number} id - Control ID
   * @returns {Promise<Object|null>} Control object with full hierarchy or null
   */
  async getControlById(id) {
    try {
      const sql = `
        SELECT 
          c.id,
          c.category_id,
          c.control_code,
          c.control_name,
          c.description,
          c.guidance,
          c.importance,
          c.display_order,
          c.created_at,
          cat.category_code,
          cat.category_name,
          cat.description as category_description,
          cat.display_order as category_display_order,
          f.id as function_id,
          f.function_code,
          f.function_name,
          f.description as function_description,
          f.display_order as function_display_order
        FROM nist_csf_controls c
        INNER JOIN nist_csf_categories cat ON c.category_id = cat.id
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        WHERE c.id = $1
      `;
      
      const result = await query(sql, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching control by ID: ${error.message}`);
    }
  },

  /**
   * Get control by control code
   * @param {string} controlCode - Control code (e.g., "ID.AM-1")
   * @returns {Promise<Object|null>} Control object or null
   */
  async getControlByCode(controlCode) {
    try {
      const sql = `
        SELECT 
          c.id,
          c.category_id,
          c.control_code,
          c.control_name,
          c.description,
          c.guidance,
          c.importance,
          c.display_order,
          c.created_at,
          cat.category_code,
          cat.category_name,
          cat.description as category_description,
          f.id as function_id,
          f.function_code,
          f.function_name,
          f.description as function_description
        FROM nist_csf_controls c
        INNER JOIN nist_csf_categories cat ON c.category_id = cat.id
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        WHERE c.control_code = $1
      `;
      
      const result = await query(sql, [controlCode]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching control by code: ${error.message}`);
    }
  },

  /**
   * Get function by ID
   * @param {number} id - Function ID
   * @returns {Promise<Object|null>} Function object or null
   */
  async getFunctionById(id) {
    try {
      const sql = `
        SELECT 
          id,
          function_code,
          function_name,
          description,
          display_order,
          created_at
        FROM nist_csf_functions
        WHERE id = $1
      `;
      
      const result = await query(sql, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching function by ID: ${error.message}`);
    }
  },

  /**
   * Get function by function code
   * @param {string} functionCode - Function code (e.g., "ID", "PR")
   * @returns {Promise<Object|null>} Function object or null
   */
  async getFunctionByCode(functionCode) {
    try {
      const sql = `
        SELECT 
          id,
          function_code,
          function_name,
          description,
          display_order,
          created_at
        FROM nist_csf_functions
        WHERE function_code = $1
      `;
      
      const result = await query(sql, [functionCode]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching function by code: ${error.message}`);
    }
  },

  /**
   * Get category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object|null>} Category object with function info or null
   */
  async getCategoryById(id) {
    try {
      const sql = `
        SELECT 
          cat.id,
          cat.function_id,
          cat.category_code,
          cat.category_name,
          cat.description,
          cat.display_order,
          cat.created_at,
          f.function_code,
          f.function_name,
          f.description as function_description
        FROM nist_csf_categories cat
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        WHERE cat.id = $1
      `;
      
      const result = await query(sql, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching category by ID: ${error.message}`);
    }
  },

  /**
   * Get category by category code
   * @param {string} categoryCode - Category code (e.g., "ID.AM")
   * @returns {Promise<Object|null>} Category object with function info or null
   */
  async getCategoryByCode(categoryCode) {
    try {
      const sql = `
        SELECT 
          cat.id,
          cat.function_id,
          cat.category_code,
          cat.category_name,
          cat.description,
          cat.display_order,
          cat.created_at,
          f.function_code,
          f.function_name,
          f.description as function_description
        FROM nist_csf_categories cat
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        WHERE cat.category_code = $1
      `;
      
      const result = await query(sql, [categoryCode]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching category by code: ${error.message}`);
    }
  },

  /**
   * Get all categories with their control counts
   * @returns {Promise<Array>} Array of categories with control counts
   */
  async getAllCategoriesWithCounts() {
    try {
      const sql = `
        SELECT 
          cat.id,
          cat.function_id,
          cat.category_code,
          cat.category_name,
          cat.description,
          cat.display_order,
          f.function_code,
          f.function_name,
          COUNT(c.id) as control_count
        FROM nist_csf_categories cat
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        LEFT JOIN nist_csf_controls c ON cat.id = c.category_id
        GROUP BY cat.id, cat.function_id, cat.category_code, cat.category_name, 
                 cat.description, cat.display_order, f.function_code, f.function_name, f.display_order
        ORDER BY f.display_order, cat.display_order
      `;
      
      const result = await query(sql);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching categories with counts: ${error.message}`);
    }
  },

  /**
   * Get complete NIST CSF hierarchy (functions with categories and controls)
   * @returns {Promise<Array>} Nested array of functions with categories and controls
   */
  async getCompleteHierarchy() {
    try {
      // Get all functions
      const functions = await this.getAllFunctions();
      
      // For each function, get categories with controls
      for (const func of functions) {
        const categoriesResult = await query(`
          SELECT 
            cat.id,
            cat.category_code,
            cat.category_name,
            cat.description,
            cat.display_order
          FROM nist_csf_categories cat
          WHERE cat.function_id = $1
          ORDER BY cat.display_order
        `, [func.id]);
        
        func.categories = categoriesResult.rows;
        
        // For each category, get controls
        for (const category of func.categories) {
          const controlsResult = await query(`
            SELECT 
              id,
              control_code,
              control_name,
              description,
              guidance,
              importance,
              display_order
            FROM nist_csf_controls
            WHERE category_id = $1
            ORDER BY display_order
          `, [category.id]);
          
          category.controls = controlsResult.rows;
        }
      }
      
      return functions;
    } catch (error) {
      throw new Error(`Error fetching complete hierarchy: ${error.message}`);
    }
  },

  /**
   * Get NIST CSF statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM nist_csf_functions) as total_functions,
          (SELECT COUNT(*) FROM nist_csf_categories) as total_categories,
          (SELECT COUNT(*) FROM nist_csf_controls) as total_controls,
          (SELECT COUNT(*) FROM nist_csf_controls WHERE importance = 'critical') as critical_controls,
          (SELECT COUNT(*) FROM nist_csf_controls WHERE importance = 'high') as high_controls,
          (SELECT COUNT(*) FROM nist_csf_controls WHERE importance = 'medium') as medium_controls,
          (SELECT COUNT(*) FROM nist_csf_controls WHERE importance = 'low') as low_controls
      `;
      
      const result = await query(sql);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching NIST CSF statistics: ${error.message}`);
    }
  },

  /**
   * Search controls by keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Array of matching controls
   */
  async searchControls(keyword) {
    try {
      const sql = `
        SELECT 
          c.id,
          c.control_code,
          c.control_name,
          c.description,
          c.guidance,
          c.importance,
          cat.category_code,
          cat.category_name,
          f.function_code,
          f.function_name
        FROM nist_csf_controls c
        INNER JOIN nist_csf_categories cat ON c.category_id = cat.id
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        WHERE 
          c.control_name ILIKE $1 OR
          c.description ILIKE $1 OR
          c.guidance ILIKE $1 OR
          c.control_code ILIKE $1
        ORDER BY f.display_order, cat.display_order, c.display_order
      `;
      
      const searchPattern = `%${keyword}%`;
      const result = await query(sql, [searchPattern]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error searching controls: ${error.message}`);
    }
  }
};

module.exports = nistCsfModel;