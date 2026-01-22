const { query } = require('../config/database');

/**
 * Threat Model Model - Database query functions for threat modeling
 */

const threatModelModel = {
  /**
   * Create a new threat model
   * @param {number} organizationId - Organization ID
   * @param {number} createdBy - User ID who created the threat model
   * @param {string} name - Threat model name
   * @param {string} description - Threat model description
   * @param {Date} assessmentDate - Assessment date (optional)
   * @param {string} version - Model version (optional, defaults to '1.0')
   * @param {number} parentThreatModelId - Parent threat model ID for versioning (optional)
   * @returns {Promise<Object>} Created threat model object
   */
  async createThreatModel(organizationId, createdBy, name, description, assessmentDate = null, version = '1.0', parentThreatModelId = null) {
    try {
      const sql = `
        INSERT INTO threat_models 
          (organization_id, created_by, model_name, description, model_version, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, organization_id, created_by, model_name, model_version, 
                  system_name, description, scope, status, risk_score, 
                  created_at, updated_at
      `;
      const values = [
        organizationId,
        createdBy,
        name,
        description,
        version,
        'draft',
        assessmentDate || new Date()
      ];
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create threat model');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating threat model: ${error.message}`);
    }
  },

  /**
   * Get threat model details by ID
   * @param {number} id - Threat model ID
   * @returns {Promise<Object|null>} Threat model object or null if not found
   */
  async getThreatModelById(id) {
    try {
      const sql = `
        SELECT 
          tm.*,
          o.name as organization_name,
          u.username as created_by_username,
          u.full_name as created_by_name,
          COUNT(DISTINCT t.id) as total_threats,
          COUNT(DISTINCT tma.asset_id) as total_assets
        FROM threat_models tm
        LEFT JOIN organizations o ON tm.organization_id = o.id
        LEFT JOIN users u ON tm.created_by = u.id
        LEFT JOIN threats t ON tm.id = t.threat_model_id
        LEFT JOIN threat_model_assets tma ON tm.id = tma.threat_model_id
        WHERE tm.id = $1
        GROUP BY tm.id, o.name, u.username, u.full_name
      `;
      
      const result = await query(sql, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching threat model by ID: ${error.message}`);
    }
  },

  /**
   * Get all threat models for an organization
   * @param {number} organizationId - Organization ID
   * @param {Object} options - Query options (limit, offset, status filter)
   * @returns {Promise<Array>} Array of threat model objects
   */
  async getThreatModelsByOrganization(organizationId, options = {}) {
    try {
      const { limit = 50, offset = 0, status = null } = options;
      
      let sql = `
        SELECT 
          tm.id,
          tm.organization_id,
          tm.created_by,
          tm.model_name,
          tm.model_version,
          tm.system_name,
          tm.description,
          tm.scope,
          tm.status,
          tm.risk_score,
          tm.created_at,
          tm.updated_at,
          u.username as created_by_username,
          u.full_name as created_by_name,
          COUNT(DISTINCT t.id) as total_threats,
          COUNT(DISTINCT CASE WHEN t.risk_level = 'critical' THEN t.id END) as critical_threats,
          COUNT(DISTINCT CASE WHEN t.risk_level = 'high' THEN t.id END) as high_threats,
          COUNT(DISTINCT tma.asset_id) as total_assets
        FROM threat_models tm
        LEFT JOIN users u ON tm.created_by = u.id
        LEFT JOIN threats t ON tm.id = t.threat_model_id
        LEFT JOIN threat_model_assets tma ON tm.id = tma.threat_model_id
        WHERE tm.organization_id = $1
      `;
      
      const values = [organizationId];
      
      if (status) {
        sql += ` AND tm.status = $${values.length + 1}`;
        values.push(status);
      }
      
      sql += `
        GROUP BY tm.id, u.username, u.full_name
        ORDER BY tm.created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;
      
      values.push(limit, offset);
      
      const result = await query(sql, values);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching threat models by organization: ${error.message}`);
    }
  },

  /**
   * Update threat model details
   * @param {number} id - Threat model ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated threat model object
   */
  async updateThreatModel(id, updates) {
    try {
      const allowedFields = [
        'model_name',
        'model_version',
        'system_name',
        'description',
        'scope',
        'status',
        'risk_score'
      ];
      
      const updateFields = [];
      const values = [];
      let paramCounter = 1;
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramCounter}`);
          values.push(value);
          paramCounter++;
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      // Add updated_at timestamp
      updateFields.push(`updated_at = $${paramCounter}`);
      values.push(new Date());
      paramCounter++;
      
      // Add ID for WHERE clause
      values.push(id);
      
      const sql = `
        UPDATE threat_models
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, organization_id, created_by, model_name, model_version,
                  system_name, description, scope, status, risk_score,
                  created_at, updated_at
      `;
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Threat model not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating threat model: ${error.message}`);
    }
  },

  /**
   * Delete a threat model
   * @param {number} id - Threat model ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteThreatModel(id) {
    try {
      const sql = `
        DELETE FROM threat_models
        WHERE id = $1
        RETURNING id, model_name
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Threat model not found');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting threat model: ${error.message}`);
    }
  },

  /**
   * Get threat model with comprehensive statistics
   * @param {number} id - Threat model ID
   * @returns {Promise<Object|null>} Threat model with detailed statistics
   */
  async getThreatModelWithStats(id) {
    try {
      // Get basic threat model info
      const modelSql = `
        SELECT 
          tm.*,
          o.name as organization_name,
          u.username as created_by_username,
          u.full_name as created_by_name
        FROM threat_models tm
        LEFT JOIN organizations o ON tm.organization_id = o.id
        LEFT JOIN users u ON tm.created_by = u.id
        WHERE tm.id = $1
      `;
      
      const modelResult = await query(modelSql, [id]);
      
      if (modelResult.rows.length === 0) {
        return null;
      }
      
      const threatModel = modelResult.rows[0];
      
      // Get threat statistics
      const threatStatsSql = `
        SELECT
          COUNT(*) as total_threats,
          COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_threats,
          COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_threats,
          COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_threats,
          COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_threats,
          COUNT(CASE WHEN status = 'identified' THEN 1 END) as identified_threats,
          COUNT(CASE WHEN status = 'assessed' THEN 1 END) as assessed_threats,
          COUNT(CASE WHEN status = 'mitigated' THEN 1 END) as mitigated_threats,
          COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_threats,
          ROUND(AVG(risk_score), 2) as avg_risk_score
        FROM threats
        WHERE threat_model_id = $1
      `;
      
      const threatStatsResult = await query(threatStatsSql, [id]);
      const threatStats = threatStatsResult.rows[0];
      
      // Get asset statistics
      const assetStatsSql = `
        SELECT
          COUNT(DISTINCT tma.asset_id) as total_assets,
          COUNT(DISTINCT CASE WHEN a.asset_type = 'data' THEN tma.asset_id END) as data_assets,
          COUNT(DISTINCT CASE WHEN a.asset_type = 'application' THEN tma.asset_id END) as application_assets,
          COUNT(DISTINCT CASE WHEN a.asset_type = 'system' THEN tma.asset_id END) as system_assets,
          COUNT(DISTINCT CASE WHEN a.asset_type = 'network' THEN tma.asset_id END) as network_assets
        FROM threat_model_assets tma
        LEFT JOIN assets a ON tma.asset_id = a.id
        WHERE tma.threat_model_id = $1
      `;
      
      const assetStatsResult = await query(assetStatsSql, [id]);
      const assetStats = assetStatsResult.rows[0];
      
      // Get STRIDE category breakdown
      const strideSql = `
        SELECT
          sc.category_code,
          sc.category_name,
          COUNT(t.id) as threat_count
        FROM stride_categories sc
        LEFT JOIN threats t ON sc.id = t.stride_category_id AND t.threat_model_id = $1
        GROUP BY sc.id, sc.category_code, sc.category_name
        ORDER BY sc.category_code
      `;
      
      const strideResult = await query(strideSql, [id]);
      const strideBreakdown = strideResult.rows;
      
      // Get mitigation statistics
      const mitigationSql = `
        SELECT
          COUNT(DISTINCT m.id) as total_mitigations,
          COUNT(DISTINCT CASE WHEN m.status = 'planned' THEN m.id END) as planned_mitigations,
          COUNT(DISTINCT CASE WHEN m.status = 'in_progress' THEN m.id END) as in_progress_mitigations,
          COUNT(DISTINCT CASE WHEN m.status = 'implemented' THEN m.id END) as implemented_mitigations,
          COUNT(DISTINCT CASE WHEN m.status = 'verified' THEN m.id END) as verified_mitigations
        FROM mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        WHERE t.threat_model_id = $1
      `;
      
      const mitigationResult = await query(mitigationSql, [id]);
      const mitigationStats = mitigationResult.rows[0];
      
      // Calculate risk coverage percentage
      const mitigatedThreats = parseInt(threatStats.mitigated_threats) + parseInt(threatStats.accepted_threats);
      const totalThreats = parseInt(threatStats.total_threats);
      const riskCoverage = totalThreats > 0 
        ? Math.round((mitigatedThreats / totalThreats) * 100) 
        : 0;
      
      // Combine all statistics
      return {
        ...threatModel,
        statistics: {
          threats: {
            total: parseInt(threatStats.total_threats),
            critical: parseInt(threatStats.critical_threats),
            high: parseInt(threatStats.high_threats),
            medium: parseInt(threatStats.medium_threats),
            low: parseInt(threatStats.low_threats),
            identified: parseInt(threatStats.identified_threats),
            assessed: parseInt(threatStats.assessed_threats),
            mitigated: parseInt(threatStats.mitigated_threats),
            accepted: parseInt(threatStats.accepted_threats),
            avgRiskScore: parseFloat(threatStats.avg_risk_score) || 0
          },
          assets: {
            total: parseInt(assetStats.total_assets),
            data: parseInt(assetStats.data_assets),
            application: parseInt(assetStats.application_assets),
            system: parseInt(assetStats.system_assets),
            network: parseInt(assetStats.network_assets)
          },
          strideBreakdown: strideBreakdown,
          mitigations: {
            total: parseInt(mitigationStats.total_mitigations),
            planned: parseInt(mitigationStats.planned_mitigations),
            inProgress: parseInt(mitigationStats.in_progress_mitigations),
            implemented: parseInt(mitigationStats.implemented_mitigations),
            verified: parseInt(mitigationStats.verified_mitigations)
          },
          riskCoverage: riskCoverage
        }
      };
    } catch (error) {
      throw new Error(`Error fetching threat model with stats: ${error.message}`);
    }
  },

  /**
   * Get all versions of a threat model (based on model name and organization)
   * Note: Since parent_threat_model_id doesn't exist in schema, we group by model_name
   * @param {string} modelName - Model name to find versions for
   * @param {number} organizationId - Organization ID
   * @returns {Promise<Array>} Array of threat model versions
   */
  async getThreatModelVersions(modelName, organizationId) {
    try {
      const sql = `
        SELECT 
          tm.id,
          tm.organization_id,
          tm.created_by,
          tm.model_name,
          tm.model_version,
          tm.system_name,
          tm.description,
          tm.status,
          tm.risk_score,
          tm.created_at,
          tm.updated_at,
          u.username as created_by_username,
          u.full_name as created_by_name,
          COUNT(DISTINCT t.id) as total_threats
        FROM threat_models tm
        LEFT JOIN users u ON tm.created_by = u.id
        LEFT JOIN threats t ON tm.id = t.threat_model_id
        WHERE tm.model_name = $1 AND tm.organization_id = $2
        GROUP BY tm.id, u.username, u.full_name
        ORDER BY tm.model_version DESC, tm.created_at DESC
      `;
      
      const result = await query(sql, [modelName, organizationId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching threat model versions: ${error.message}`);
    }
  },

  /**
   * Check if user has access to a threat model
   * @param {number} threatModelId - Threat model ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Organization ID if user has access, null otherwise
   */
  async checkUserAccess(threatModelId, userId) {
    try {
      const sql = `
        SELECT tm.organization_id
        FROM threat_models tm
        INNER JOIN user_organizations uo 
          ON tm.organization_id = uo.organization_id
        WHERE tm.id = $1 AND uo.user_id = $2
      `;
      
      const result = await query(sql, [threatModelId, userId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error checking user access: ${error.message}`);
    }
  },

  /**
   * Get threat models count by status for an organization
   * @param {number} organizationId - Organization ID
   * @returns {Promise<Object>} Count of threat models by status
   */
  async getThreatModelCountsByStatus(organizationId) {
    try {
      const sql = `
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
          COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived
        FROM threat_models
        WHERE organization_id = $1
      `;
      
      const result = await query(sql, [organizationId]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching threat model counts: ${error.message}`);
    }
  },

  /**
   * Search threat models by name or description
   * @param {number} organizationId - Organization ID
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options (limit, offset)
   * @returns {Promise<Array>} Array of matching threat models
   */
  async searchThreatModels(organizationId, searchTerm, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const sql = `
        SELECT 
          tm.id,
          tm.organization_id,
          tm.model_name,
          tm.model_version,
          tm.system_name,
          tm.description,
          tm.status,
          tm.risk_score,
          tm.created_at,
          tm.updated_at,
          u.full_name as created_by_name,
          COUNT(DISTINCT t.id) as total_threats
        FROM threat_models tm
        LEFT JOIN users u ON tm.created_by = u.id
        LEFT JOIN threats t ON tm.id = t.threat_model_id
        WHERE tm.organization_id = $1
          AND (
            tm.model_name ILIKE $2
            OR tm.system_name ILIKE $2
            OR tm.description ILIKE $2
          )
        GROUP BY tm.id, u.full_name
        ORDER BY tm.updated_at DESC
        LIMIT $3 OFFSET $4
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const result = await query(sql, [organizationId, searchPattern, limit, offset]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error searching threat models: ${error.message}`);
    }
  }
};

module.exports = threatModelModel;
