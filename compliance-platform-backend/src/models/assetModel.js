const { query } = require('../config/database');

/**
 * Asset Model - Database query functions for asset management
 */

const assetModel = {
  /**
   * Create a new asset
   * @param {number} organizationId - Organization ID
   * @param {number} createdBy - User ID who created the asset (stored as owner)
   * @param {string} name - Asset name
   * @param {string} type - Asset type (data_store, process, external_entity, data_flow, trust_boundary)
   * @param {string} description - Asset description
   * @param {string} criticality - Criticality level (low, medium, high, critical)
   * @returns {Promise<Object>} Created asset object
   */
  async createAsset(organizationId, createdBy, name, type, description = null, criticality = 'medium') {
    try {
      // Validate asset type
      const validTypes = ['data_store', 'process', 'external_entity', 'data_flow', 'trust_boundary'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid asset type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate criticality
      const validCriticality = ['low', 'medium', 'high', 'critical'];
      if (!validCriticality.includes(criticality)) {
        throw new Error(`Invalid criticality. Must be one of: ${validCriticality.join(', ')}`);
      }

      const sql = `
        INSERT INTO assets 
          (organization_id, owner, asset_name, asset_type, description, criticality)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, organization_id, owner, asset_name, asset_type, 
                  description, criticality, created_at, updated_at
      `;
      const values = [organizationId, createdBy, name, type, description, criticality];
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create asset');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating asset: ${error.message}`);
    }
  },

  /**
   * Get asset details by ID
   * @param {number} id - Asset ID
   * @returns {Promise<Object|null>} Asset object or null if not found
   */
  async getAssetById(id) {
    try {
      const sql = `
        SELECT 
          a.*,
          o.name as organization_name,
          u.username as owner_username,
          u.full_name as owner_name,
          COUNT(DISTINCT tma.threat_model_id) as linked_threat_models,
          COUNT(DISTINCT t.id) as total_threats
        FROM assets a
        LEFT JOIN organizations o ON a.organization_id = o.id
        LEFT JOIN users u ON a.owner = u.id
        LEFT JOIN threat_model_assets tma ON a.id = tma.asset_id
        LEFT JOIN threats t ON a.id = t.asset_id
        WHERE a.id = $1
        GROUP BY a.id, o.name, u.username, u.full_name
      `;
      
      const result = await query(sql, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching asset by ID: ${error.message}`);
    }
  },

  /**
   * Get all assets for an organization
   * @param {number} organizationId - Organization ID
   * @param {Object} options - Query options (limit, offset, type filter, criticality filter)
   * @returns {Promise<Array>} Array of asset objects
   */
  async getAssetsByOrganization(organizationId, options = {}) {
    try {
      const { limit = 100, offset = 0, type = null, criticality = null } = options;
      
      let sql = `
        SELECT 
          a.id,
          a.organization_id,
          a.owner,
          a.asset_name,
          a.asset_type,
          a.description,
          a.criticality,
          a.created_at,
          a.updated_at,
          u.username as owner_username,
          u.full_name as owner_name,
          COUNT(DISTINCT tma.threat_model_id) as linked_threat_models,
          COUNT(DISTINCT t.id) as total_threats,
          COUNT(DISTINCT CASE WHEN t.risk_level IN ('critical', 'high') THEN t.id END) as high_risk_threats
        FROM assets a
        LEFT JOIN users u ON a.owner = u.id
        LEFT JOIN threat_model_assets tma ON a.id = tma.asset_id
        LEFT JOIN threats t ON a.id = t.asset_id
        WHERE a.organization_id = $1
      `;
      
      const values = [organizationId];
      
      if (type) {
        sql += ` AND a.asset_type = $${values.length + 1}`;
        values.push(type);
      }
      
      if (criticality) {
        sql += ` AND a.criticality = $${values.length + 1}`;
        values.push(criticality);
      }
      
      sql += `
        GROUP BY a.id, u.username, u.full_name
        ORDER BY 
          CASE a.criticality 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          a.asset_name
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;
      
      values.push(limit, offset);
      
      const result = await query(sql, values);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching assets by organization: ${error.message}`);
    }
  },

  /**
   * Update asset details
   * @param {number} id - Asset ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated asset object
   */
  async updateAsset(id, updates) {
    try {
      const allowedFields = [
        'asset_name',
        'asset_type',
        'description',
        'criticality',
        'owner'
      ];
      
      // Validate asset type if provided
      if (updates.asset_type) {
        const validTypes = ['data_store', 'process', 'external_entity', 'data_flow', 'trust_boundary'];
        if (!validTypes.includes(updates.asset_type)) {
          throw new Error(`Invalid asset type. Must be one of: ${validTypes.join(', ')}`);
        }
      }

      // Validate criticality if provided
      if (updates.criticality) {
        const validCriticality = ['low', 'medium', 'high', 'critical'];
        if (!validCriticality.includes(updates.criticality)) {
          throw new Error(`Invalid criticality. Must be one of: ${validCriticality.join(', ')}`);
        }
      }
      
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
        UPDATE assets
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, organization_id, owner, asset_name, asset_type,
                  description, criticality, created_at, updated_at
      `;
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Asset not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating asset: ${error.message}`);
    }
  },

  /**
   * Delete an asset
   * @param {number} id - Asset ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteAsset(id) {
    try {
      const sql = `
        DELETE FROM assets
        WHERE id = $1
        RETURNING id, asset_name
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Asset not found');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting asset: ${error.message}`);
    }
  },

  /**
   * Link an asset to a threat model
   * @param {number} threatModelId - Threat model ID
   * @param {number} assetId - Asset ID
   * @param {string} notes - Optional notes about the relationship
   * @returns {Promise<Object>} Created link object
   */
  async linkAssetToThreatModel(threatModelId, assetId, notes = null) {
    try {
      // Check if link already exists
      const checkSql = `
        SELECT id FROM threat_model_assets
        WHERE threat_model_id = $1 AND asset_id = $2
      `;
      const checkResult = await query(checkSql, [threatModelId, assetId]);
      
      if (checkResult.rows.length > 0) {
        throw new Error('Asset is already linked to this threat model');
      }

      // Verify asset and threat model exist and belong to same organization
      const verifySql = `
        SELECT 
          tm.organization_id as tm_org_id,
          a.organization_id as asset_org_id
        FROM threat_models tm
        CROSS JOIN assets a
        WHERE tm.id = $1 AND a.id = $2
      `;
      const verifyResult = await query(verifySql, [threatModelId, assetId]);
      
      if (verifyResult.rows.length === 0) {
        throw new Error('Threat model or asset not found');
      }
      
      const { tm_org_id, asset_org_id } = verifyResult.rows[0];
      if (tm_org_id !== asset_org_id) {
        throw new Error('Asset and threat model must belong to the same organization');
      }

      // Create the link
      const sql = `
        INSERT INTO threat_model_assets 
          (threat_model_id, asset_id, notes)
        VALUES ($1, $2, $3)
        RETURNING id, threat_model_id, asset_id, notes, created_at
      `;
      const values = [threatModelId, assetId, notes];
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to link asset to threat model');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error linking asset to threat model: ${error.message}`);
    }
  },

  /**
   * Unlink an asset from a threat model
   * @param {number} threatModelId - Threat model ID
   * @param {number} assetId - Asset ID
   * @returns {Promise<boolean>} True if unlinked successfully
   */
  async unlinkAssetFromThreatModel(threatModelId, assetId) {
    try {
      const sql = `
        DELETE FROM threat_model_assets
        WHERE threat_model_id = $1 AND asset_id = $2
        RETURNING id
      `;
      
      const result = await query(sql, [threatModelId, assetId]);
      
      if (result.rows.length === 0) {
        throw new Error('Asset link not found');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error unlinking asset from threat model: ${error.message}`);
    }
  },

  /**
   * Get all assets linked to a threat model
   * @param {number} threatModelId - Threat model ID
   * @returns {Promise<Array>} Array of asset objects
   */
  async getAssetsByThreatModel(threatModelId) {
    try {
      const sql = `
        SELECT 
          a.id,
          a.organization_id,
          a.owner,
          a.asset_name,
          a.asset_type,
          a.description,
          a.criticality,
          a.created_at,
          a.updated_at,
          u.username as owner_username,
          u.full_name as owner_name,
          tma.notes as link_notes,
          tma.created_at as linked_at,
          COUNT(DISTINCT t.id) as threat_count,
          COUNT(DISTINCT CASE WHEN t.risk_level = 'critical' THEN t.id END) as critical_threats,
          COUNT(DISTINCT CASE WHEN t.risk_level = 'high' THEN t.id END) as high_threats,
          COUNT(DISTINCT CASE WHEN t.risk_level = 'medium' THEN t.id END) as medium_threats,
          COUNT(DISTINCT CASE WHEN t.risk_level = 'low' THEN t.id END) as low_threats
        FROM threat_model_assets tma
        INNER JOIN assets a ON tma.asset_id = a.id
        LEFT JOIN users u ON a.owner = u.id
        LEFT JOIN threats t ON a.id = t.asset_id AND t.threat_model_id = tma.threat_model_id
        WHERE tma.threat_model_id = $1
        GROUP BY a.id, u.username, u.full_name, tma.notes, tma.created_at
        ORDER BY 
          CASE a.criticality 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          a.asset_name
      `;
      
      const result = await query(sql, [threatModelId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching assets by threat model: ${error.message}`);
    }
  },

  /**
   * Get asset with all its threats in a specific threat model
   * @param {number} assetId - Asset ID
   * @param {number} threatModelId - Threat model ID
   * @returns {Promise<Object|null>} Asset object with threats array
   */
  async getAssetWithThreats(assetId, threatModelId) {
    try {
      // Get asset details
      const assetSql = `
        SELECT 
          a.*,
          o.name as organization_name,
          u.username as owner_username,
          u.full_name as owner_name,
          tma.notes as link_notes,
          tma.created_at as linked_at
        FROM assets a
        LEFT JOIN organizations o ON a.organization_id = o.id
        LEFT JOIN users u ON a.owner = u.id
        LEFT JOIN threat_model_assets tma 
          ON a.id = tma.asset_id AND tma.threat_model_id = $2
        WHERE a.id = $1
      `;
      
      const assetResult = await query(assetSql, [assetId, threatModelId]);
      
      if (assetResult.rows.length === 0) {
        return null;
      }
      
      const asset = assetResult.rows[0];
      
      // Get threats associated with this asset in the threat model
      const threatsSql = `
        SELECT 
          t.id,
          t.threat_title,
          t.threat_description,
          t.impact_description,
          t.likelihood,
          t.impact,
          t.risk_level,
          t.risk_score,
          t.status,
          t.identified_at,
          t.created_at,
          t.updated_at,
          sc.category_code as stride_category,
          sc.category_name as stride_name,
          u.username as identified_by_username,
          u.full_name as identified_by_name,
          COUNT(DISTINCT m.id) as mitigation_count,
          COUNT(DISTINCT CASE WHEN m.status = 'implemented' THEN m.id END) as implemented_mitigations
        FROM threats t
        LEFT JOIN stride_categories sc ON t.stride_category_id = sc.id
        LEFT JOIN users u ON t.identified_by = u.id
        LEFT JOIN mitigations m ON t.id = m.threat_id
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
      
      const threatsResult = await query(threatsSql, [assetId, threatModelId]);
      
      // Calculate threat statistics
      const threatStats = {
        total: threatsResult.rows.length,
        critical: threatsResult.rows.filter(t => t.risk_level === 'critical').length,
        high: threatsResult.rows.filter(t => t.risk_level === 'high').length,
        medium: threatsResult.rows.filter(t => t.risk_level === 'medium').length,
        low: threatsResult.rows.filter(t => t.risk_level === 'low').length,
        identified: threatsResult.rows.filter(t => t.status === 'identified').length,
        assessed: threatsResult.rows.filter(t => t.status === 'assessed').length,
        mitigated: threatsResult.rows.filter(t => t.status === 'mitigated').length
      };
      
      return {
        ...asset,
        threats: threatsResult.rows,
        threat_statistics: threatStats
      };
    } catch (error) {
      throw new Error(`Error fetching asset with threats: ${error.message}`);
    }
  },

  /**
   * Check if user has access to an asset
   * @param {number} assetId - Asset ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Organization ID if user has access, null otherwise
   */
  async checkUserAccess(assetId, userId) {
    try {
      const sql = `
        SELECT a.organization_id
        FROM assets a
        INNER JOIN user_organizations uo 
          ON a.organization_id = uo.organization_id
        WHERE a.id = $1 AND uo.user_id = $2
      `;
      
      const result = await query(sql, [assetId, userId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error checking user access: ${error.message}`);
    }
  },

  /**
   * Get asset statistics for an organization
   * @param {number} organizationId - Organization ID
   * @returns {Promise<Object>} Asset statistics
   */
  async getAssetStatistics(organizationId) {
    try {
      const sql = `
        SELECT
          COUNT(*) as total_assets,
          COUNT(CASE WHEN asset_type = 'data_store' THEN 1 END) as data_stores,
          COUNT(CASE WHEN asset_type = 'process' THEN 1 END) as processes,
          COUNT(CASE WHEN asset_type = 'external_entity' THEN 1 END) as external_entities,
          COUNT(CASE WHEN asset_type = 'data_flow' THEN 1 END) as data_flows,
          COUNT(CASE WHEN asset_type = 'trust_boundary' THEN 1 END) as trust_boundaries,
          COUNT(CASE WHEN criticality = 'critical' THEN 1 END) as critical_assets,
          COUNT(CASE WHEN criticality = 'high' THEN 1 END) as high_criticality,
          COUNT(CASE WHEN criticality = 'medium' THEN 1 END) as medium_criticality,
          COUNT(CASE WHEN criticality = 'low' THEN 1 END) as low_criticality
        FROM assets
        WHERE organization_id = $1
      `;
      
      const result = await query(sql, [organizationId]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching asset statistics: ${error.message}`);
    }
  },

  /**
   * Search assets by name or description
   * @param {number} organizationId - Organization ID
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options (limit, offset)
   * @returns {Promise<Array>} Array of matching assets
   */
  async searchAssets(organizationId, searchTerm, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const sql = `
        SELECT 
          a.id,
          a.organization_id,
          a.asset_name,
          a.asset_type,
          a.description,
          a.criticality,
          a.created_at,
          a.updated_at,
          u.full_name as owner_name,
          COUNT(DISTINCT tma.threat_model_id) as linked_threat_models,
          COUNT(DISTINCT t.id) as total_threats
        FROM assets a
        LEFT JOIN users u ON a.owner = u.id
        LEFT JOIN threat_model_assets tma ON a.id = tma.asset_id
        LEFT JOIN threats t ON a.id = t.asset_id
        WHERE a.organization_id = $1
          AND (
            a.asset_name ILIKE $2
            OR a.description ILIKE $2
          )
        GROUP BY a.id, u.full_name
        ORDER BY a.updated_at DESC
        LIMIT $3 OFFSET $4
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const result = await query(sql, [organizationId, searchPattern, limit, offset]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error searching assets: ${error.message}`);
    }
  },

  /**
   * Get assets that are not yet linked to a specific threat model
   * @param {number} organizationId - Organization ID
   * @param {number} threatModelId - Threat model ID
   * @returns {Promise<Array>} Array of unlinked asset objects
   */
  async getUnlinkedAssets(organizationId, threatModelId) {
    try {
      const sql = `
        SELECT 
          a.id,
          a.organization_id,
          a.asset_name,
          a.asset_type,
          a.description,
          a.criticality,
          a.created_at,
          a.updated_at,
          u.full_name as owner_name
        FROM assets a
        LEFT JOIN users u ON a.owner = u.id
        WHERE a.organization_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM threat_model_assets tma
            WHERE tma.asset_id = a.id AND tma.threat_model_id = $2
          )
        ORDER BY 
          CASE a.criticality 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          a.asset_name
      `;
      
      const result = await query(sql, [organizationId, threatModelId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching unlinked assets: ${error.message}`);
    }
  }
};

module.exports = assetModel;
