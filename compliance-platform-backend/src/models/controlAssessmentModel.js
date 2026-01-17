const { query } = require('../config/database');

/**
 * Control Assessment Model - Database query functions for individual NIST CSF control assessments
 */

const controlAssessmentModel = {
  /**
   * Create or update a control assessment
   * @param {number} assessmentId - Assessment ID
   * @param {number} controlId - Control ID
   * @param {string} status - Implementation status
   * @param {string} questionnaireResponse - Response notes (stored in notes field)
   * @param {string} comments - Additional comments (stored in notes field)
   * @param {string} remediationPlan - Remediation plan (stored in recommendations field)
   * @param {number} assessedBy - User ID who assessed the control
   * @returns {Promise<Object>} Created or updated control assessment object
   */
  async createControlAssessment(assessmentId, controlId, status, questionnaireResponse, comments, remediationPlan, assessedBy) {
    try {
      // Combine questionnaire response and comments into notes field
      const notes = [questionnaireResponse, comments].filter(Boolean).join('\n\n');
      
      const sql = `
        INSERT INTO compliance_control_assessments 
          (assessment_id, control_id, implementation_status, notes, recommendations, 
           assessed_by, assessed_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (assessment_id, control_id) 
        DO UPDATE SET
          implementation_status = EXCLUDED.implementation_status,
          notes = EXCLUDED.notes,
          recommendations = EXCLUDED.recommendations,
          assessed_by = EXCLUDED.assessed_by,
          assessed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, assessment_id, control_id, implementation_status, maturity_level,
                  compliance_score, notes, recommendations, assessed_by, assessed_at,
                  reviewed_by, reviewed_at, created_at, updated_at
      `;
      
      const values = [
        assessmentId,
        controlId,
        status || 'not_implemented',
        notes || null,
        remediationPlan || null,
        assessedBy
      ];
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create control assessment');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating control assessment: ${error.message}`);
    }
  },

  /**
   * Get all control assessments for a specific assessment with control details
   * @param {number} assessmentId - Assessment ID
   * @param {Object} options - Query options (include control details, filter by status)
   * @returns {Promise<Array>} Array of control assessment objects with control details
   */
  async getControlAssessmentsByAssessment(assessmentId, options = {}) {
    try {
      const { includeControlDetails = true, status } = options;
      
      let sql = `
        SELECT 
          cca.*,
          c.control_code,
          c.control_name,
          c.description as control_description,
          c.guidance as control_guidance,
          c.importance as control_importance,
          cat.category_code,
          cat.category_name,
          f.function_code,
          f.function_name,
          u.username as assessed_by_username,
          u.full_name as assessed_by_name,
          r.username as reviewed_by_username,
          r.full_name as reviewed_by_name,
          COUNT(e.id) as evidence_count
        FROM compliance_control_assessments cca
        INNER JOIN nist_csf_controls c ON cca.control_id = c.id
        INNER JOIN nist_csf_categories cat ON c.category_id = cat.id
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        LEFT JOIN users u ON cca.assessed_by = u.id
        LEFT JOIN users r ON cca.reviewed_by = r.id
        LEFT JOIN evidence e ON cca.id = e.control_assessment_id
        WHERE cca.assessment_id = $1
      `;
      
      const values = [assessmentId];
      
      // Add status filter if provided
      if (status) {
        sql += ` AND cca.implementation_status = $${values.length + 1}`;
        values.push(status);
      }
      
      sql += ` 
        GROUP BY cca.id, c.control_code, c.control_name, c.description, c.guidance, 
                 c.importance, cat.category_code, cat.category_name, 
                 f.function_code, f.function_name, f.display_order, 
                 cat.display_order, c.display_order, 
                 u.username, u.full_name, r.username, r.full_name
        ORDER BY f.display_order, cat.display_order, c.display_order
      `;
      
      const result = await query(sql, values);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching control assessments: ${error.message}`);
    }
  },

  /**
   * Get a specific control assessment by ID
   * @param {number} id - Control assessment ID
   * @returns {Promise<Object|null>} Control assessment object with control details or null
   */
  async getControlAssessmentById(id) {
    try {
      const sql = `
        SELECT 
          cca.*,
          c.control_code,
          c.control_name,
          c.description as control_description,
          c.guidance as control_guidance,
          c.importance as control_importance,
          cat.category_code,
          cat.category_name,
          cat.description as category_description,
          f.function_code,
          f.function_name,
          f.description as function_description,
          u.username as assessed_by_username,
          u.full_name as assessed_by_name,
          u.email as assessed_by_email,
          r.username as reviewed_by_username,
          r.full_name as reviewed_by_name,
          r.email as reviewed_by_email
        FROM compliance_control_assessments cca
        INNER JOIN nist_csf_controls c ON cca.control_id = c.id
        INNER JOIN nist_csf_categories cat ON c.category_id = cat.id
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        LEFT JOIN users u ON cca.assessed_by = u.id
        LEFT JOIN users r ON cca.reviewed_by = r.id
        WHERE cca.id = $1
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const controlAssessment = result.rows[0];
      
      // Get attached evidence (metadata only, no file data)
      const evidenceSql = `
        SELECT 
          e.id,
          e.evidence_name,
          e.file_type,
          e.file_size,
          e.evidence_type,
          e.quality_rating,
          e.description,
          e.is_verified,
          e.verified_at,
          e.expiration_date,
          e.tags,
          e.created_at,
          e.updated_at,
          u.username as uploaded_by_username,
          u.full_name as uploaded_by_name,
          v.username as verified_by_username,
          v.full_name as verified_by_name
        FROM evidence e
        LEFT JOIN users u ON e.uploaded_by = u.id
        LEFT JOIN users v ON e.verified_by = v.id
        WHERE e.control_assessment_id = $1
        ORDER BY e.created_at DESC
      `;
      
      const evidenceResult = await query(evidenceSql, [id]);
      
      // Attach evidence list to control assessment
      controlAssessment.evidence = evidenceResult.rows;
      controlAssessment.evidence_count = evidenceResult.rows.length;
      
      return controlAssessment;
    } catch (error) {
      throw new Error(`Error fetching control assessment by ID: ${error.message}`);
    }
  },

  /**
   * Update control assessment details
   * @param {number} id - Control assessment ID
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<Object>} Updated control assessment object
   */
  async updateControlAssessment(id, updates) {
    try {
      const allowedFields = [
        'implementation_status', 'maturity_level', 'compliance_score',
        'notes', 'recommendations', 'assessed_by', 'assessed_at',
        'reviewed_by', 'reviewed_at'
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

      // Add control assessment ID as last parameter
      values.push(id);

      const sql = `
        UPDATE compliance_control_assessments
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, assessment_id, control_id, implementation_status, maturity_level,
                  compliance_score, notes, recommendations, assessed_by, assessed_at,
                  reviewed_by, reviewed_at, created_at, updated_at
      `;

      const result = await query(sql, values);

      if (result.rows.length === 0) {
        throw new Error('Control assessment not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating control assessment: ${error.message}`);
    }
  },

  /**
   * Delete a control assessment
   * @param {number} id - Control assessment ID
   * @returns {Promise<boolean>} True if control assessment was deleted
   */
  async deleteControlAssessment(id) {
    try {
      const sql = `DELETE FROM compliance_control_assessments WHERE id = $1 RETURNING id`;
      const result = await query(sql, [id]);

      if (result.rows.length === 0) {
        throw new Error('Control assessment not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Error deleting control assessment: ${error.message}`);
    }
  },

  /**
   * Get statistics for control assessments in an assessment
   * @param {number} assessmentId - Assessment ID
   * @returns {Promise<Object>} Statistics object with counts by status
   */
  async getControlAssessmentStats(assessmentId) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_assessed,
          COUNT(CASE WHEN implementation_status = 'fully_implemented' THEN 1 END) as fully_implemented,
          COUNT(CASE WHEN implementation_status = 'largely_implemented' THEN 1 END) as largely_implemented,
          COUNT(CASE WHEN implementation_status = 'partially_implemented' THEN 1 END) as partially_implemented,
          COUNT(CASE WHEN implementation_status = 'not_implemented' THEN 1 END) as not_implemented,
          COUNT(CASE WHEN implementation_status = 'not_applicable' THEN 1 END) as not_applicable,
          
          -- Maturity level counts
          COUNT(CASE WHEN maturity_level = 'initial' THEN 1 END) as maturity_initial,
          COUNT(CASE WHEN maturity_level = 'managed' THEN 1 END) as maturity_managed,
          COUNT(CASE WHEN maturity_level = 'defined' THEN 1 END) as maturity_defined,
          COUNT(CASE WHEN maturity_level = 'quantitatively_managed' THEN 1 END) as maturity_quantitatively_managed,
          COUNT(CASE WHEN maturity_level = 'optimizing' THEN 1 END) as maturity_optimizing,
          
          -- Average compliance score
          ROUND(AVG(compliance_score), 2) as average_compliance_score,
          
          -- Total available controls
          (SELECT COUNT(*) FROM nist_csf_controls) as total_available_controls,
          
          -- Completion percentage
          ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM nist_csf_controls)::DECIMAL * 100), 2) as completion_percentage,
          
          -- Implementation rate (fully + largely implemented)
          CASE 
            WHEN COUNT(*) > 0 THEN
              ROUND(((COUNT(CASE WHEN implementation_status IN ('fully_implemented', 'largely_implemented') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100), 2)
            ELSE 0
          END as implementation_rate
          
        FROM compliance_control_assessments
        WHERE assessment_id = $1
      `;
      
      const result = await query(sql, [assessmentId]);
      
      if (result.rows.length === 0) {
        // Return empty statistics if no assessments found
        return {
          total_assessed: 0,
          fully_implemented: 0,
          largely_implemented: 0,
          partially_implemented: 0,
          not_implemented: 0,
          not_applicable: 0,
          maturity_initial: 0,
          maturity_managed: 0,
          maturity_defined: 0,
          maturity_quantitatively_managed: 0,
          maturity_optimizing: 0,
          average_compliance_score: 0,
          total_available_controls: 0,
          completion_percentage: 0,
          implementation_rate: 0
        };
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching control assessment statistics: ${error.message}`);
    }
  },

  /**
   * Get control assessments by implementation status
   * @param {number} assessmentId - Assessment ID
   * @param {string} status - Implementation status
   * @returns {Promise<Array>} Array of control assessments with given status
   */
  async getControlAssessmentsByStatus(assessmentId, status) {
    try {
      const sql = `
        SELECT 
          cca.*,
          c.control_code,
          c.control_name,
          c.importance as control_importance,
          cat.category_name,
          f.function_name
        FROM compliance_control_assessments cca
        INNER JOIN nist_csf_controls c ON cca.control_id = c.id
        INNER JOIN nist_csf_categories cat ON c.category_id = cat.id
        INNER JOIN nist_csf_functions f ON cat.function_id = f.id
        WHERE cca.assessment_id = $1 AND cca.implementation_status = $2
        ORDER BY f.display_order, cat.display_order, c.display_order
      `;
      
      const result = await query(sql, [assessmentId, status]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching control assessments by status: ${error.message}`);
    }
  },

  /**
   * Get control assessments grouped by NIST CSF function
   * @param {number} assessmentId - Assessment ID
   * @returns {Promise<Array>} Array of functions with their control assessments
   */
  async getControlAssessmentsByFunction(assessmentId) {
    try {
      const sql = `
        SELECT 
          f.id as function_id,
          f.function_code,
          f.function_name,
          COUNT(cca.id) as assessed_controls_count,
          COUNT(CASE WHEN cca.implementation_status = 'fully_implemented' THEN 1 END) as fully_implemented_count,
          ROUND(AVG(cca.compliance_score), 2) as average_score
        FROM nist_csf_functions f
        LEFT JOIN nist_csf_categories cat ON f.id = cat.function_id
        LEFT JOIN nist_csf_controls c ON cat.id = c.category_id
        LEFT JOIN compliance_control_assessments cca ON c.id = cca.control_id AND cca.assessment_id = $1
        GROUP BY f.id, f.function_code, f.function_name, f.display_order
        ORDER BY f.display_order
      `;
      
      const result = await query(sql, [assessmentId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching control assessments by function: ${error.message}`);
    }
  },

  /**
   * Batch create control assessments
   * @param {Array} controlAssessments - Array of control assessment objects
   * @returns {Promise<Array>} Array of created control assessments
   */
  async batchCreateControlAssessments(controlAssessments) {
    try {
      if (!Array.isArray(controlAssessments) || controlAssessments.length === 0) {
        throw new Error('Invalid control assessments array');
      }

      const results = [];
      
      for (const ca of controlAssessments) {
        const result = await this.createControlAssessment(
          ca.assessmentId,
          ca.controlId,
          ca.status,
          ca.questionnaireResponse,
          ca.comments,
          ca.remediationPlan,
          ca.assessedBy
        );
        results.push(result);
      }
      
      return results;
    } catch (error) {
      throw new Error(`Error batch creating control assessments: ${error.message}`);
    }
  }
};

module.exports = controlAssessmentModel;