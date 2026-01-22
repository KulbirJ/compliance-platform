const { query } = require('../config/database');

/**
 * Threat Model - Database query functions for threat management
 * Handles threats table (not threat_models - see threatModelModel.js for that)
 */

/**
 * Calculate risk score based on likelihood and impact
 * @param {string} likelihood - Likelihood level (very_low, low, medium, high, very_high)
 * @param {string} impact - Impact level (very_low, low, medium, high, very_high)
 * @returns {Object} { riskScore, riskLevel }
 */
const calculateRiskScore = (likelihood, impact) => {
  // Map likelihood and impact to numeric values (1-5)
  const likelihoodValues = {
    'very_low': 1,
    'low': 2,
    'medium': 3,
    'high': 4,
    'very_high': 5
  };
  
  const impactValues = {
    'very_low': 1,
    'low': 2,
    'medium': 3,
    'high': 4,
    'very_high': 5
  };
  
  const likelihoodScore = likelihoodValues[likelihood] || 3;
  const impactScore = impactValues[impact] || 3;
  
  // Risk Score = Likelihood × Impact (range: 1-25)
  const riskScore = likelihoodScore * impactScore;
  
  // Determine risk level based on score
  let riskLevel;
  if (riskScore >= 20) {
    riskLevel = 'critical'; // 20-25
  } else if (riskScore >= 12) {
    riskLevel = 'high'; // 12-19
  } else if (riskScore >= 6) {
    riskLevel = 'medium'; // 6-11
  } else {
    riskLevel = 'low'; // 1-5
  }
  
  return { riskScore, riskLevel };
};

const threatModel = {
  /**
   * Create a new threat
   * @param {number} threatModelId - Threat model ID
   * @param {number} assetId - Asset ID (optional)
   * @param {number} strideCategoryId - STRIDE category ID
   * @param {string} name - Threat title
   * @param {string} description - Threat description
   * @param {string} likelihood - Likelihood (very_low, low, medium, high, very_high)
   * @param {string} impact - Impact (very_low, low, medium, high, very_high)
   * @param {number} createdBy - User ID who identified the threat
   * @returns {Promise<Object>} Created threat object
   */
  async createThreat(threatModelId, assetId, strideCategoryId, name, description, likelihood, impact, createdBy) {
    try {
      // Validate likelihood and impact
      const validLevels = ['very_low', 'low', 'medium', 'high', 'very_high'];
      if (!validLevels.includes(likelihood)) {
        throw new Error(`Invalid likelihood. Must be one of: ${validLevels.join(', ')}`);
      }
      if (!validLevels.includes(impact)) {
        throw new Error(`Invalid impact. Must be one of: ${validLevels.join(', ')}`);
      }
      
      // Calculate risk score and level
      const { riskScore, riskLevel } = calculateRiskScore(likelihood, impact);
      
      const sql = `
        INSERT INTO threats 
          (threat_model_id, asset_id, stride_category_id, threat_title, threat_description,
           likelihood, impact, risk_score, risk_level, status, identified_by, identified_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, threat_model_id, asset_id, stride_category_id, threat_title, 
                  threat_description, impact_description, likelihood, impact, risk_score, 
                  risk_level, status, identified_by, identified_at, created_at, updated_at
      `;
      const values = [
        threatModelId,
        assetId || null,
        strideCategoryId,
        name,
        description,
        likelihood,
        impact,
        riskScore,
        riskLevel,
        'identified',
        createdBy,
        new Date()
      ];
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create threat');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating threat: ${error.message}`);
    }
  },

  /**
   * Get threat details by ID with full related information
   * @param {number} id - Threat ID
   * @returns {Promise<Object|null>} Threat object with asset, STRIDE, user, and mitigation details
   */
  async getThreatById(id) {
    try {
      const sql = `
        SELECT 
          t.*,
          a.asset_name,
          a.asset_type,
          a.criticality as asset_criticality,
          sc.category_code as stride_code,
          sc.category_name as stride_name,
          sc.description as stride_description,
          u.username as identified_by_username,
          u.full_name as identified_by_name,
          tm.model_name as threat_model_name,
          tm.organization_id,
          COUNT(DISTINCT mit.id) as mitigation_count,
          COUNT(DISTINCT CASE WHEN mit.implementation_status = 'implemented' THEN mit.id END) as implemented_mitigations,
          COUNT(DISTINCT CASE WHEN mit.implementation_status = 'verified' THEN mit.id END) as verified_mitigations
        FROM threats t
        LEFT JOIN assets a ON t.asset_id = a.id
        LEFT JOIN stride_categories sc ON t.stride_category_id = sc.id
        LEFT JOIN users u ON t.identified_by = u.id
        LEFT JOIN threat_models tm ON t.threat_model_id = tm.id
        LEFT JOIN threat_mitigations mit ON t.id = mit.threat_id
        WHERE t.id = $1
        GROUP BY t.id, a.asset_name, a.asset_type, a.criticality,
                 sc.category_code, sc.category_name, sc.description,
                 u.username, u.full_name, tm.model_name, tm.organization_id
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const threat = result.rows[0];
      
      // Get all mitigations for this threat
      const mitigationsSql = `
        SELECT 
          mit.*,
          u.username as assigned_to_username,
          u.full_name as assigned_to_name
        FROM threat_mitigations mit
        LEFT JOIN users u ON mit.assigned_to = u.id
        WHERE mit.threat_id = $1
        ORDER BY 
          CASE mit.priority 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          mit.created_at DESC
      `;
      
      const mitigationsResult = await query(mitigationsSql, [id]);
      threat.mitigations = mitigationsResult.rows;
      
      return threat;
    } catch (error) {
      throw new Error(`Error fetching threat by ID: ${error.message}`);
    }
  },

  /**
   * Get all threats for a threat model
   * @param {number} threatModelId - Threat model ID
   * @param {Object} options - Query options (riskLevel, status, strideCategory)
   * @returns {Promise<Array>} Array of threat objects
   */
  async getThreatsByThreatModel(threatModelId, options = {}) {
    try {
      const { riskLevel = null, status = null, strideCategory = null } = options;
      
      let sql = `
        SELECT 
          t.id,
          t.threat_model_id,
          t.asset_id,
          t.stride_category_id,
          t.threat_title,
          t.threat_description,
          t.impact_description,
          t.likelihood,
          t.impact,
          t.risk_score,
          t.risk_level,
          t.status,
          t.identified_at,
          t.created_at,
          t.updated_at,
          a.asset_name,
          a.asset_type,
          a.criticality as asset_criticality,
          sc.category_code as stride_code,
          sc.category_name as stride_name,
          u.username as identified_by_username,
          u.full_name as identified_by_name,
          COUNT(DISTINCT mit.id) as mitigation_count,
          COUNT(DISTINCT CASE WHEN mit.implementation_status IN ('implemented', 'verified') THEN mit.id END) as active_mitigations
        FROM threats t
        LEFT JOIN assets a ON t.asset_id = a.id
        LEFT JOIN stride_categories sc ON t.stride_category_id = sc.id
        LEFT JOIN users u ON t.identified_by = u.id
        LEFT JOIN threat_mitigations mit ON t.id = mit.threat_id
        WHERE t.threat_model_id = $1
      `;
      
      const values = [threatModelId];
      
      if (riskLevel) {
        sql += ` AND t.risk_level = $${values.length + 1}`;
        values.push(riskLevel);
      }
      
      if (status) {
        sql += ` AND t.status = $${values.length + 1}`;
        values.push(status);
      }
      
      if (strideCategory) {
        sql += ` AND sc.category_code = $${values.length + 1}`;
        values.push(strideCategory);
      }
      
      sql += `
        GROUP BY t.id, a.asset_name, a.asset_type, a.criticality,
                 sc.category_code, sc.category_name,
                 u.username, u.full_name
        ORDER BY 
          CASE t.risk_level
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          t.risk_score DESC,
          t.created_at DESC
      `;
      
      const result = await query(sql, values);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching threats by threat model: ${error.message}`);
    }
  },

  /**
   * Get threats for a specific asset in a threat model
   * @param {number} assetId - Asset ID
   * @param {number} threatModelId - Threat model ID
   * @returns {Promise<Array>} Array of threat objects
   */
  async getThreatsByAsset(assetId, threatModelId) {
    try {
      const sql = `
        SELECT 
          t.id,
          t.threat_model_id,
          t.asset_id,
          t.stride_category_id,
          t.threat_title,
          t.threat_description,
          t.impact_description,
          t.likelihood,
          t.impact,
          t.risk_score,
          t.risk_level,
          t.status,
          t.identified_at,
          t.created_at,
          t.updated_at,
          sc.category_code as stride_code,
          sc.category_name as stride_name,
          u.username as identified_by_username,
          u.full_name as identified_by_name,
          COUNT(DISTINCT mit.id) as mitigation_count
        FROM threats t
        LEFT JOIN stride_categories sc ON t.stride_category_id = sc.id
        LEFT JOIN users u ON t.identified_by = u.id
        LEFT JOIN threat_mitigations mit ON t.id = mit.threat_id
        WHERE t.asset_id = $1 AND t.threat_model_id = $2
        GROUP BY t.id, sc.category_code, sc.category_name, u.username, u.full_name
        ORDER BY 
          CASE t.risk_level
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          t.risk_score DESC
      `;
      
      const result = await query(sql, [assetId, threatModelId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching threats by asset: ${error.message}`);
    }
  },

  /**
   * Update threat details
   * @param {number} id - Threat ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated threat object
   */
  async updateThreat(id, updates) {
    try {
      const allowedFields = [
        'threat_title',
        'threat_description',
        'impact_description',
        'likelihood',
        'impact',
        'status',
        'asset_id',
        'stride_category_id'
      ];
      
      // Validate likelihood and impact if provided
      const validLevels = ['very_low', 'low', 'medium', 'high', 'very_high'];
      if (updates.likelihood && !validLevels.includes(updates.likelihood)) {
        throw new Error(`Invalid likelihood. Must be one of: ${validLevels.join(', ')}`);
      }
      if (updates.impact && !validLevels.includes(updates.impact)) {
        throw new Error(`Invalid impact. Must be one of: ${validLevels.join(', ')}`);
      }
      
      // Validate status if provided
      const validStatuses = ['identified', 'analyzing', 'mitigating', 'mitigated', 'accepted', 'transferred'];
      if (updates.status && !validStatuses.includes(updates.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      const updateFields = [];
      const values = [];
      let paramCounter = 1;
      
      // Check if we need to recalculate risk score
      let needsRiskRecalculation = false;
      if (updates.likelihood || updates.impact) {
        needsRiskRecalculation = true;
        
        // Get current values if only one is being updated
        if (!updates.likelihood || !updates.impact) {
          const currentSql = `SELECT likelihood, impact FROM threats WHERE id = $1`;
          const currentResult = await query(currentSql, [id]);
          
          if (currentResult.rows.length === 0) {
            throw new Error('Threat not found');
          }
          
          const current = currentResult.rows[0];
          updates.likelihood = updates.likelihood || current.likelihood;
          updates.impact = updates.impact || current.impact;
        }
        
        // Calculate new risk score and level
        const { riskScore, riskLevel } = calculateRiskScore(updates.likelihood, updates.impact);
        updates.risk_score = riskScore;
        updates.risk_level = riskLevel;
        
        // Add to allowed fields for update
        allowedFields.push('risk_score', 'risk_level');
      }
      
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
        UPDATE threats
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, threat_model_id, asset_id, stride_category_id, threat_title,
                  threat_description, impact_description, likelihood, impact, risk_score,
                  risk_level, status, identified_by, identified_at, created_at, updated_at
      `;
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Threat not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating threat: ${error.message}`);
    }
  },

  /**
   * Delete a threat
   * @param {number} id - Threat ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteThreat(id) {
    try {
      const sql = `
        DELETE FROM threats
        WHERE id = $1
        RETURNING id, threat_title
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Threat not found');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting threat: ${error.message}`);
    }
  },

  /**
   * Get high-risk threats (threats with risk score above threshold)
   * @param {number} threatModelId - Threat model ID
   * @param {number} minRiskScore - Minimum risk score threshold (default: 15 for high-risk)
   * @returns {Promise<Array>} Array of high-risk threat objects
   */
  async getThreatsByRiskLevel(threatModelId, minRiskScore = 15) {
    try {
      const sql = `
        SELECT 
          t.id,
          t.threat_model_id,
          t.asset_id,
          t.threat_title,
          t.threat_description,
          t.impact_description,
          t.likelihood,
          t.impact,
          t.risk_score,
          t.risk_level,
          t.status,
          t.identified_at,
          a.asset_name,
          a.asset_type,
          a.criticality as asset_criticality,
          sc.category_code as stride_code,
          sc.category_name as stride_name,
          u.full_name as identified_by_name,
          COUNT(DISTINCT mit.id) as mitigation_count,
          COUNT(DISTINCT CASE WHEN mit.implementation_status IN ('implemented', 'verified') THEN mit.id END) as effective_mitigations
        FROM threats t
        LEFT JOIN assets a ON t.asset_id = a.id
        LEFT JOIN stride_categories sc ON t.stride_category_id = sc.id
        LEFT JOIN users u ON t.identified_by = u.id
        LEFT JOIN threat_mitigations mit ON t.id = mit.threat_id
        WHERE t.threat_model_id = $1 AND t.risk_score >= $2
        GROUP BY t.id, a.asset_name, a.asset_type, a.criticality,
                 sc.category_code, sc.category_name, u.full_name
        ORDER BY t.risk_score DESC, t.created_at DESC
      `;
      
      const result = await query(sql, [threatModelId, minRiskScore]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching threats by risk level: ${error.message}`);
    }
  },

  /**
   * Get comprehensive threat statistics for a threat model
   * @param {number} threatModelId - Threat model ID
   * @returns {Promise<Object>} Threat statistics
   */
  async getThreatStats(threatModelId) {
    try {
      // Overall threat statistics
      const overallSql = `
        SELECT
          COUNT(*) as total_threats,
          COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_threats,
          COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_threats,
          COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_threats,
          COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_threats,
          ROUND(AVG(risk_score), 2) as avg_risk_score,
          MAX(risk_score) as max_risk_score,
          MIN(risk_score) as min_risk_score
        FROM threats
        WHERE threat_model_id = $1
      `;
      
      const overallResult = await query(overallSql, [threatModelId]);
      const overallStats = overallResult.rows[0];
      
      // Status breakdown
      const statusSql = `
        SELECT
          COUNT(CASE WHEN status = 'identified' THEN 1 END) as identified,
          COUNT(CASE WHEN status = 'analyzing' THEN 1 END) as analyzing,
          COUNT(CASE WHEN status = 'mitigating' THEN 1 END) as mitigating,
          COUNT(CASE WHEN status = 'mitigated' THEN 1 END) as mitigated,
          COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
          COUNT(CASE WHEN status = 'transferred' THEN 1 END) as transferred
        FROM threats
        WHERE threat_model_id = $1
      `;
      
      const statusResult = await query(statusSql, [threatModelId]);
      const statusBreakdown = statusResult.rows[0];
      
      // STRIDE category breakdown
      const strideSql = `
        SELECT
          sc.category_code,
          sc.category_name,
          COUNT(t.id) as threat_count,
          COUNT(CASE WHEN t.risk_level IN ('critical', 'high') THEN 1 END) as high_risk_count,
          ROUND(AVG(t.risk_score), 2) as avg_risk_score
        FROM stride_categories sc
        LEFT JOIN threats t ON sc.id = t.stride_category_id AND t.threat_model_id = $1
        GROUP BY sc.id, sc.category_code, sc.category_name, sc.display_order
        ORDER BY sc.display_order
      `;
      
      const strideResult = await query(strideSql, [threatModelId]);
      const strideBreakdown = strideResult.rows;
      
      // Mitigation statistics
      const mitigationSql = `
        SELECT
          COUNT(DISTINCT mit.id) as total_mitigations,
          COUNT(DISTINCT CASE WHEN mit.implementation_status = 'proposed' THEN mit.id END) as proposed,
          COUNT(DISTINCT CASE WHEN mit.implementation_status = 'approved' THEN mit.id END) as approved,
          COUNT(DISTINCT CASE WHEN mit.implementation_status = 'in_progress' THEN mit.id END) as in_progress,
          COUNT(DISTINCT CASE WHEN mit.implementation_status = 'implemented' THEN mit.id END) as implemented,
          COUNT(DISTINCT CASE WHEN mit.implementation_status = 'verified' THEN mit.id END) as verified,
          COUNT(DISTINCT CASE WHEN mit.implementation_status = 'rejected' THEN mit.id END) as rejected,
          COUNT(DISTINCT t.id) as threats_with_mitigations,
          ROUND(AVG(CASE WHEN mit.effectiveness_rating = 'low' THEN 1
                         WHEN mit.effectiveness_rating = 'medium' THEN 2
                         WHEN mit.effectiveness_rating = 'high' THEN 3
                         WHEN mit.effectiveness_rating = 'excellent' THEN 4
                    END), 2) as avg_effectiveness
        FROM threats t
        LEFT JOIN threat_mitigations mit ON t.id = mit.threat_id
        WHERE t.threat_model_id = $1
      `;
      
      const mitigationResult = await query(mitigationSql, [threatModelId]);
      const mitigationStats = mitigationResult.rows[0];
      
      // Asset coverage
      const assetSql = `
        SELECT
          COUNT(DISTINCT asset_id) as assets_with_threats,
          COUNT(*) as total_threat_asset_links
        FROM threats
        WHERE threat_model_id = $1 AND asset_id IS NOT NULL
      `;
      
      const assetResult = await query(assetSql, [threatModelId]);
      const assetCoverage = assetResult.rows[0];
      
      // Risk distribution (likelihood vs impact)
      const riskDistributionSql = `
        SELECT
          likelihood,
          impact,
          COUNT(*) as count,
          ROUND(AVG(risk_score), 2) as avg_risk_score
        FROM threats
        WHERE threat_model_id = $1
        GROUP BY likelihood, impact
        ORDER BY likelihood DESC, impact DESC
      `;
      
      const riskDistResult = await query(riskDistributionSql, [threatModelId]);
      const riskDistribution = riskDistResult.rows;
      
      // Calculate coverage percentages
      const totalThreats = parseInt(overallStats.total_threats);
      const mitigatedThreats = parseInt(statusBreakdown.mitigated) + parseInt(statusBreakdown.accepted);
      const coveragePercentage = totalThreats > 0 
        ? Math.round((mitigatedThreats / totalThreats) * 100)
        : 0;
      
      return {
        overall: {
          totalThreats: parseInt(overallStats.total_threats),
          criticalThreats: parseInt(overallStats.critical_threats),
          highThreats: parseInt(overallStats.high_threats),
          mediumThreats: parseInt(overallStats.medium_threats),
          lowThreats: parseInt(overallStats.low_threats),
          avgRiskScore: parseFloat(overallStats.avg_risk_score) || 0,
          maxRiskScore: parseFloat(overallStats.max_risk_score) || 0,
          minRiskScore: parseFloat(overallStats.min_risk_score) || 0
        },
        statusBreakdown: {
          identified: parseInt(statusBreakdown.identified),
          analyzing: parseInt(statusBreakdown.analyzing),
          mitigating: parseInt(statusBreakdown.mitigating),
          mitigated: parseInt(statusBreakdown.mitigated),
          accepted: parseInt(statusBreakdown.accepted),
          transferred: parseInt(statusBreakdown.transferred)
        },
        strideBreakdown: strideBreakdown,
        mitigations: {
          total: parseInt(mitigationStats.total_mitigations),
          proposed: parseInt(mitigationStats.proposed),
          approved: parseInt(mitigationStats.approved),
          inProgress: parseInt(mitigationStats.in_progress),
          implemented: parseInt(mitigationStats.implemented),
          verified: parseInt(mitigationStats.verified),
          rejected: parseInt(mitigationStats.rejected),
          threatsWithMitigations: parseInt(mitigationStats.threats_with_mitigations),
          avgEffectiveness: parseFloat(mitigationStats.avg_effectiveness) || 0
        },
        assetCoverage: {
          assetsWithThreats: parseInt(assetCoverage.assets_with_threats),
          totalLinks: parseInt(assetCoverage.total_threat_asset_links)
        },
        riskDistribution: riskDistribution,
        coverage: {
          mitigatedThreats: mitigatedThreats,
          coveragePercentage: coveragePercentage
        }
      };
    } catch (error) {
      throw new Error(`Error fetching threat statistics: ${error.message}`);
    }
  },

  /**
   * Search threats by title or description
   * @param {number} threatModelId - Threat model ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching threats
   */
  async searchThreats(threatModelId, searchTerm) {
    try {
      const sql = `
        SELECT 
          t.id,
          t.threat_title,
          t.threat_description,
          t.risk_level,
          t.risk_score,
          t.status,
          a.asset_name,
          sc.category_name as stride_name
        FROM threats t
        LEFT JOIN assets a ON t.asset_id = a.id
        LEFT JOIN stride_categories sc ON t.stride_category_id = sc.id
        WHERE t.threat_model_id = $1
          AND (
            t.threat_title ILIKE $2
            OR t.threat_description ILIKE $2
            OR t.impact_description ILIKE $2
          )
        ORDER BY t.risk_score DESC
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const result = await query(sql, [threatModelId, searchPattern]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error searching threats: ${error.message}`);
    }
  },

  /**
   * Check if user has access to a threat
   * @param {number} threatId - Threat ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Organization ID if user has access, null otherwise
   */
  async checkUserAccess(threatId, userId) {
    try {
      const sql = `
        SELECT tm.organization_id
        FROM threats t
        INNER JOIN threat_models tm ON t.threat_model_id = tm.id
        INNER JOIN user_organizations uo ON tm.organization_id = uo.organization_id
        WHERE t.id = $1 AND uo.user_id = $2
      `;
      
      const result = await query(sql, [threatId, userId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error checking user access: ${error.message}`);
    }
  }
};

module.exports = threatModel;
