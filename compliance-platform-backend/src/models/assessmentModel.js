const { query } = require('../config/database');

/**
 * Assessment Model - Database query functions for compliance assessments
 */

const assessmentModel = {
  /**
   * Create a new compliance assessment
   * @param {number} organizationId - Organization ID
   * @param {number} createdBy - User ID who created the assessment
   * @param {string} name - Assessment name
   * @param {string} description - Assessment description (stored in scope)
   * @param {Date} assessmentDate - Date of assessment
   * @param {string} scope - Assessment scope/description
   * @returns {Promise<Object>} Created assessment object
   */
  async createAssessment(organizationId, createdBy, name, description, assessmentDate, scope) {
    try {
      const sql = `
        INSERT INTO compliance_assessments 
          (organization_id, created_by, assessment_name, scope, assessment_date, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, organization_id, created_by, assessment_name, assessment_version, 
                  status, scope, assessment_date, due_date, completion_percentage, 
                  overall_score, created_at, updated_at
      `;
      const values = [
        organizationId, 
        createdBy, 
        name, 
        scope || description, 
        assessmentDate || new Date(),
        'draft'
      ];
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create assessment');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating assessment: ${error.message}`);
    }
  },

  /**
   * Get assessment details by ID
   * @param {number} id - Assessment ID
   * @returns {Promise<Object|null>} Assessment object or null if not found
   */
  async getAssessmentById(id) {
    try {
      const sql = `
        SELECT 
          ca.*,
          o.name as organization_name,
          u.username as created_by_username,
          u.full_name as created_by_name
        FROM compliance_assessments ca
        LEFT JOIN organizations o ON ca.organization_id = o.id
        LEFT JOIN users u ON ca.created_by = u.id
        WHERE ca.id = $1
      `;
      
      const result = await query(sql, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching assessment by ID: ${error.message}`);
    }
  },

  /**
   * Get all assessments for an organization
   * @param {number} organizationId - Organization ID
   * @param {Object} options - Query options (limit, offset, status filter)
   * @returns {Promise<Array>} Array of assessment objects
   */
  async getAssessmentsByOrganization(organizationId, options = {}) {
    try {
      const { limit = 50, offset = 0, status } = options;
      
      let sql = `
        SELECT 
          ca.*,
          u.username as created_by_username,
          u.full_name as created_by_name,
          COUNT(cca.id) as total_controls,
          COUNT(CASE WHEN cca.implementation_status != 'not_implemented' 
                THEN 1 END) as assessed_controls
        FROM compliance_assessments ca
        LEFT JOIN users u ON ca.created_by = u.id
        LEFT JOIN compliance_control_assessments cca ON ca.id = cca.assessment_id
        WHERE ca.organization_id = $1
      `;
      
      const values = [organizationId];
      
      // Add status filter if provided
      if (status) {
        sql += ` AND ca.status = $${values.length + 1}`;
        values.push(status);
      }
      
      sql += `
        GROUP BY ca.id, u.username, u.full_name
        ORDER BY ca.created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;
      
      values.push(limit, offset);
      
      const result = await query(sql, values);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching assessments by organization: ${error.message}`);
    }
  },

  /**
   * Update assessment details
   * @param {number} id - Assessment ID
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<Object>} Updated assessment object
   */
  async updateAssessment(id, updates) {
    try {
      const allowedFields = [
        'assessment_name', 'assessment_version', 'status', 'scope', 
        'assessment_date', 'due_date', 'completion_percentage', 
        'overall_score', 'completed_at'
      ];
      
      const updateFields = [];
      const values = [];
      let paramCounter = 1;

      // Build dynamic SQL query based on provided updates
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

      // Add assessment ID as last parameter
      values.push(id);

      const sql = `
        UPDATE compliance_assessments
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, organization_id, created_by, assessment_name, assessment_version,
                  status, scope, assessment_date, due_date, completion_percentage,
                  overall_score, created_at, updated_at, completed_at
      `;

      const result = await query(sql, values);

      if (result.rows.length === 0) {
        throw new Error('Assessment not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating assessment: ${error.message}`);
    }
  },

  /**
   * Delete an assessment
   * @param {number} id - Assessment ID
   * @returns {Promise<boolean>} True if assessment was deleted
   */
  async deleteAssessment(id) {
    try {
      const sql = `DELETE FROM compliance_assessments WHERE id = $1 RETURNING id`;
      const result = await query(sql, [id]);

      if (result.rows.length === 0) {
        throw new Error('Assessment not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Error deleting assessment: ${error.message}`);
    }
  },

  /**
   * Get assessment with detailed progress statistics
   * @param {number} id - Assessment ID
   * @returns {Promise<Object>} Assessment with progress details
   */
  async getAssessmentWithProgress(id) {
    try {
      const sql = `
        SELECT 
          ca.*,
          o.name as organization_name,
          u.username as created_by_username,
          u.full_name as created_by_name,
          
          -- Control statistics
          COUNT(DISTINCT cca.control_id) as total_assessed_controls,
          COUNT(DISTINCT CASE WHEN cca.implementation_status = 'fully_implemented' 
                THEN cca.control_id END) as fully_implemented_count,
          COUNT(DISTINCT CASE WHEN cca.implementation_status = 'largely_implemented' 
                THEN cca.control_id END) as largely_implemented_count,
          COUNT(DISTINCT CASE WHEN cca.implementation_status = 'partially_implemented' 
                THEN cca.control_id END) as partially_implemented_count,
          COUNT(DISTINCT CASE WHEN cca.implementation_status = 'not_implemented' 
                THEN cca.control_id END) as not_implemented_count,
          COUNT(DISTINCT CASE WHEN cca.implementation_status = 'not_applicable' 
                THEN cca.control_id END) as not_applicable_count,
          
          -- Total available controls in NIST CSF
          (SELECT COUNT(*) FROM nist_csf_controls) as total_available_controls,
          
          -- Average compliance score
          ROUND(AVG(cca.compliance_score), 2) as average_compliance_score,
          
          -- Completion percentage (controls assessed / total controls * 100)
          CASE 
            WHEN COUNT(DISTINCT cca.control_id) > 0 THEN
              ROUND((COUNT(DISTINCT cca.control_id)::DECIMAL / 
                    (SELECT COUNT(*) FROM nist_csf_controls)::DECIMAL * 100), 2)
            ELSE 0
          END as calculated_completion_percentage
          
        FROM compliance_assessments ca
        LEFT JOIN organizations o ON ca.organization_id = o.id
        LEFT JOIN users u ON ca.created_by = u.id
        LEFT JOIN compliance_control_assessments cca ON ca.id = cca.assessment_id
        WHERE ca.id = $1
        GROUP BY ca.id, o.name, u.username, u.full_name
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Assessment not found');
      }
      
      const assessment = result.rows[0];
      
      // Calculate additional statistics
      const totalAssessed = parseInt(assessment.total_assessed_controls) || 0;
      const fullyImplemented = parseInt(assessment.fully_implemented_count) || 0;
      const largelyImplemented = parseInt(assessment.largely_implemented_count) || 0;
      
      // Calculate implementation rate (fully + largely implemented / total assessed * 100)
      assessment.implementation_rate = totalAssessed > 0 
        ? Math.round(((fullyImplemented + largelyImplemented) / totalAssessed) * 100)
        : 0;
      
      return assessment;
    } catch (error) {
      throw new Error(`Error fetching assessment with progress: ${error.message}`);
    }
  },

  /**
   * Get all assessments count for an organization
   * @param {number} organizationId - Organization ID
   * @returns {Promise<number>} Total number of assessments
   */
  async getAssessmentCount(organizationId) {
    try {
      const sql = `
        SELECT COUNT(*) as count 
        FROM compliance_assessments 
        WHERE organization_id = $1
      `;
      const result = await query(sql, [organizationId]);
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      throw new Error(`Error getting assessment count: ${error.message}`);
    }
  },

  /**
   * Update assessment completion percentage
   * @param {number} id - Assessment ID
   * @returns {Promise<Object>} Updated assessment with new completion percentage
   */
  async updateCompletionPercentage(id) {
    try {
      const sql = `
        UPDATE compliance_assessments ca
        SET 
          completion_percentage = (
            SELECT 
              CASE 
                WHEN COUNT(cca.id) > 0 THEN
                  ROUND((COUNT(cca.id)::DECIMAL / 
                        (SELECT COUNT(*) FROM nist_csf_controls)::DECIMAL * 100), 2)
                ELSE 0
              END
            FROM compliance_control_assessments cca
            WHERE cca.assessment_id = ca.id
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE ca.id = $1
        RETURNING id, completion_percentage
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Assessment not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating completion percentage: ${error.message}`);
    }
  },

  /**
   * Get assessments by status
   * @param {number} organizationId - Organization ID
   * @param {string} status - Assessment status
   * @returns {Promise<Array>} Array of assessments with given status
   */
  async getAssessmentsByStatus(organizationId, status) {
    try {
      const sql = `
        SELECT 
          ca.*,
          u.username as created_by_username,
          u.full_name as created_by_name
        FROM compliance_assessments ca
        LEFT JOIN users u ON ca.created_by = u.id
        WHERE ca.organization_id = $1 AND ca.status = $2
        ORDER BY ca.created_at DESC
      `;
      
      const result = await query(sql, [organizationId, status]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching assessments by status: ${error.message}`);
    }
  }
};

module.exports = assessmentModel;