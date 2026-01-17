const { query } = require('../config/database');

/**
 * Mitigation Model - Database query functions for threat mitigation management
 */

const mitigationModel = {
  /**
   * Create a new mitigation plan for a threat
   * @param {number} threatId - Threat ID
   * @param {string} strategy - Mitigation strategy (eliminate, reduce, transfer, accept)
   * @param {string} description - Mitigation description
   * @param {string} status - Implementation status (proposed, approved, in_progress, implemented, verified, rejected)
   * @param {string} priority - Priority level (low, medium, high, critical)
   * @param {number} assignedTo - User ID assigned to implement (optional)
   * @param {Date} targetDate - Target implementation date (optional)
   * @param {string} estimatedEffort - Estimated effort (optional)
   * @returns {Promise<Object>} Created mitigation object
   */
  async createMitigation(
    threatId,
    strategy,
    description,
    status = 'proposed',
    priority = 'medium',
    assignedTo = null,
    targetDate = null,
    estimatedEffort = null
  ) {
    try {
      // Validate strategy
      const validStrategies = ['eliminate', 'reduce', 'transfer', 'accept'];
      if (!validStrategies.includes(strategy)) {
        throw new Error(`Invalid mitigation strategy. Must be one of: ${validStrategies.join(', ')}`);
      }

      // Validate status
      const validStatuses = ['proposed', 'approved', 'in_progress', 'implemented', 'verified', 'rejected'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid implementation status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Validate priority
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }

      const sql = `
        INSERT INTO threat_mitigations 
          (threat_id, mitigation_strategy, mitigation_description, implementation_status,
           priority, assigned_to, implementation_date, estimated_effort)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, threat_id, mitigation_strategy, mitigation_description, 
                  implementation_status, priority, assigned_to, estimated_effort,
                  cost_estimate, implementation_date, verification_method,
                  effectiveness_rating, created_at, updated_at, completed_at
      `;
      const values = [
        threatId,
        strategy,
        description,
        status,
        priority,
        assignedTo,
        targetDate,
        estimatedEffort
      ];
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create mitigation');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating mitigation: ${error.message}`);
    }
  },

  /**
   * Get mitigation details by ID
   * @param {number} id - Mitigation ID
   * @returns {Promise<Object|null>} Mitigation object with threat and user details
   */
  async getMitigationById(id) {
    try {
      const sql = `
        SELECT 
          m.*,
          t.threat_title,
          t.threat_model_id,
          t.risk_level as threat_risk_level,
          t.risk_score as threat_risk_score,
          t.status as threat_status,
          a.asset_name,
          u_assigned.username as assigned_to_username,
          u_assigned.full_name as assigned_to_name,
          tm.model_name as threat_model_name,
          tm.organization_id
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        LEFT JOIN assets a ON t.asset_id = a.id
        LEFT JOIN users u_assigned ON m.assigned_to = u_assigned.id
        LEFT JOIN threat_models tm ON t.threat_model_id = tm.id
        WHERE m.id = $1
      `;
      
      const result = await query(sql, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching mitigation by ID: ${error.message}`);
    }
  },

  /**
   * Get all mitigations for a specific threat
   * @param {number} threatId - Threat ID
   * @returns {Promise<Array>} Array of mitigation objects
   */
  async getMitigationsByThreat(threatId) {
    try {
      const sql = `
        SELECT 
          m.*,
          u_assigned.username as assigned_to_username,
          u_assigned.full_name as assigned_to_name
        FROM threat_mitigations m
        LEFT JOIN users u_assigned ON m.assigned_to = u_assigned.id
        WHERE m.threat_id = $1
        ORDER BY 
          CASE m.priority 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          CASE m.implementation_status
            WHEN 'in_progress' THEN 1
            WHEN 'approved' THEN 2
            WHEN 'proposed' THEN 3
            WHEN 'implemented' THEN 4
            WHEN 'verified' THEN 5
            WHEN 'rejected' THEN 6
          END,
          m.created_at DESC
      `;
      
      const result = await query(sql, [threatId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching mitigations by threat: ${error.message}`);
    }
  },

  /**
   * Get all mitigations assigned to a specific user
   * @param {number} userId - User ID
   * @param {Object} options - Query options (status filter, limit, offset)
   * @returns {Promise<Array>} Array of mitigation objects
   */
  async getMitigationsByAssignee(userId, options = {}) {
    try {
      const { status = null, limit = 100, offset = 0 } = options;
      
      let sql = `
        SELECT 
          m.*,
          t.threat_title,
          t.threat_model_id,
          t.risk_level as threat_risk_level,
          t.risk_score as threat_risk_score,
          t.status as threat_status,
          a.asset_name,
          tm.model_name as threat_model_name,
          tm.organization_id
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        LEFT JOIN assets a ON t.asset_id = a.id
        INNER JOIN threat_models tm ON t.threat_model_id = tm.id
        WHERE m.assigned_to = $1
      `;
      
      const values = [userId];
      
      if (status) {
        sql += ` AND m.implementation_status = $${values.length + 1}`;
        values.push(status);
      }
      
      sql += `
        ORDER BY 
          CASE m.priority 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          m.implementation_date ASC NULLS LAST,
          m.created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;
      
      values.push(limit, offset);
      
      const result = await query(sql, values);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching mitigations by assignee: ${error.message}`);
    }
  },

  /**
   * Update mitigation details
   * @param {number} id - Mitigation ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated mitigation object
   */
  async updateMitigation(id, updates) {
    try {
      const allowedFields = [
        'mitigation_strategy',
        'mitigation_description',
        'implementation_status',
        'priority',
        'assigned_to',
        'estimated_effort',
        'cost_estimate',
        'implementation_date',
        'verification_method',
        'effectiveness_rating'
      ];
      
      // Validate strategy if provided
      if (updates.mitigation_strategy) {
        const validStrategies = ['eliminate', 'reduce', 'transfer', 'accept'];
        if (!validStrategies.includes(updates.mitigation_strategy)) {
          throw new Error(`Invalid mitigation strategy. Must be one of: ${validStrategies.join(', ')}`);
        }
      }

      // Validate status if provided
      if (updates.implementation_status) {
        const validStatuses = ['proposed', 'approved', 'in_progress', 'implemented', 'verified', 'rejected'];
        if (!validStatuses.includes(updates.implementation_status)) {
          throw new Error(`Invalid implementation status. Must be one of: ${validStatuses.join(', ')}`);
        }
        
        // Set completed_at timestamp if status is implemented or verified
        if (['implemented', 'verified'].includes(updates.implementation_status)) {
          updates.completed_at = new Date();
          allowedFields.push('completed_at');
        }
      }

      // Validate priority if provided
      if (updates.priority) {
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(updates.priority)) {
          throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
        }
      }

      // Validate effectiveness rating if provided
      if (updates.effectiveness_rating) {
        const validRatings = ['low', 'medium', 'high', 'excellent'];
        if (!validRatings.includes(updates.effectiveness_rating)) {
          throw new Error(`Invalid effectiveness rating. Must be one of: ${validRatings.join(', ')}`);
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
        UPDATE threat_mitigations
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, threat_id, mitigation_strategy, mitigation_description,
                  implementation_status, priority, assigned_to, estimated_effort,
                  cost_estimate, implementation_date, verification_method,
                  effectiveness_rating, created_at, updated_at, completed_at
      `;
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Mitigation not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating mitigation: ${error.message}`);
    }
  },

  /**
   * Delete a mitigation
   * @param {number} id - Mitigation ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteMitigation(id) {
    try {
      const sql = `
        DELETE FROM threat_mitigations
        WHERE id = $1
        RETURNING id
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Mitigation not found');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting mitigation: ${error.message}`);
    }
  },

  /**
   * Get comprehensive mitigation statistics for a threat model
   * @param {number} threatModelId - Threat model ID
   * @returns {Promise<Object>} Mitigation statistics
   */
  async getMitigationStats(threatModelId) {
    try {
      // Overall mitigation statistics
      const overallSql = `
        SELECT
          COUNT(DISTINCT m.id) as total_mitigations,
          COUNT(DISTINCT CASE WHEN m.implementation_status = 'proposed' THEN m.id END) as proposed,
          COUNT(DISTINCT CASE WHEN m.implementation_status = 'approved' THEN m.id END) as approved,
          COUNT(DISTINCT CASE WHEN m.implementation_status = 'in_progress' THEN m.id END) as in_progress,
          COUNT(DISTINCT CASE WHEN m.implementation_status = 'implemented' THEN m.id END) as implemented,
          COUNT(DISTINCT CASE WHEN m.implementation_status = 'verified' THEN m.id END) as verified,
          COUNT(DISTINCT CASE WHEN m.implementation_status = 'rejected' THEN m.id END) as rejected,
          COUNT(DISTINCT t.id) as threats_with_mitigations
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        WHERE t.threat_model_id = $1
      `;
      
      const overallResult = await query(overallSql, [threatModelId]);
      const overallStats = overallResult.rows[0];
      
      // Strategy breakdown
      const strategySql = `
        SELECT
          m.mitigation_strategy,
          COUNT(*) as count,
          COUNT(CASE WHEN m.implementation_status IN ('implemented', 'verified') THEN 1 END) as completed
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        WHERE t.threat_model_id = $1
        GROUP BY m.mitigation_strategy
        ORDER BY count DESC
      `;
      
      const strategyResult = await query(strategySql, [threatModelId]);
      const strategyBreakdown = strategyResult.rows;
      
      // Priority breakdown
      const prioritySql = `
        SELECT
          COUNT(CASE WHEN m.priority = 'critical' THEN 1 END) as critical,
          COUNT(CASE WHEN m.priority = 'high' THEN 1 END) as high,
          COUNT(CASE WHEN m.priority = 'medium' THEN 1 END) as medium,
          COUNT(CASE WHEN m.priority = 'low' THEN 1 END) as low
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        WHERE t.threat_model_id = $1
      `;
      
      const priorityResult = await query(prioritySql, [threatModelId]);
      const priorityBreakdown = priorityResult.rows[0];
      
      // Effectiveness analysis
      const effectivenessSql = `
        SELECT
          m.effectiveness_rating,
          COUNT(*) as count,
          ROUND(AVG(CASE 
            WHEN m.effectiveness_rating = 'low' THEN 1
            WHEN m.effectiveness_rating = 'medium' THEN 2
            WHEN m.effectiveness_rating = 'high' THEN 3
            WHEN m.effectiveness_rating = 'excellent' THEN 4
          END), 2) as avg_score
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        WHERE t.threat_model_id = $1
          AND m.effectiveness_rating IS NOT NULL
        GROUP BY m.effectiveness_rating
        ORDER BY avg_score DESC
      `;
      
      const effectivenessResult = await query(effectivenessSql, [threatModelId]);
      const effectivenessBreakdown = effectivenessResult.rows;
      
      // Cost analysis
      const costSql = `
        SELECT
          COUNT(CASE WHEN m.cost_estimate IS NOT NULL THEN 1 END) as mitigations_with_cost,
          COALESCE(SUM(m.cost_estimate), 0) as total_estimated_cost,
          COALESCE(AVG(m.cost_estimate), 0) as avg_cost_per_mitigation,
          COALESCE(SUM(CASE WHEN m.implementation_status IN ('implemented', 'verified') 
                            THEN m.cost_estimate ELSE 0 END), 0) as completed_cost
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        WHERE t.threat_model_id = $1
      `;
      
      const costResult = await query(costSql, [threatModelId]);
      const costAnalysis = costResult.rows[0];
      
      // Assignee workload
      const assigneeSql = `
        SELECT
          u.id as user_id,
          u.username,
          u.full_name,
          COUNT(*) as assigned_count,
          COUNT(CASE WHEN m.implementation_status = 'in_progress' THEN 1 END) as in_progress_count,
          COUNT(CASE WHEN m.implementation_status IN ('implemented', 'verified') THEN 1 END) as completed_count
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        INNER JOIN users u ON m.assigned_to = u.id
        WHERE t.threat_model_id = $1
        GROUP BY u.id, u.username, u.full_name
        ORDER BY assigned_count DESC
        LIMIT 10
      `;
      
      const assigneeResult = await query(assigneeSql, [threatModelId]);
      const assigneeWorkload = assigneeResult.rows;
      
      // Timeline analysis
      const timelineSql = `
        SELECT
          COUNT(CASE WHEN m.implementation_date IS NOT NULL THEN 1 END) as with_target_date,
          COUNT(CASE WHEN m.implementation_date < CURRENT_DATE 
                         AND m.implementation_status NOT IN ('implemented', 'verified', 'rejected') 
                     THEN 1 END) as overdue,
          COUNT(CASE WHEN m.implementation_date >= CURRENT_DATE 
                         AND m.implementation_date <= CURRENT_DATE + INTERVAL '30 days'
                         AND m.implementation_status NOT IN ('implemented', 'verified', 'rejected')
                     THEN 1 END) as due_soon,
          COUNT(CASE WHEN m.completed_at IS NOT NULL THEN 1 END) as completed_with_date
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        WHERE t.threat_model_id = $1
      `;
      
      const timelineResult = await query(timelineSql, [threatModelId]);
      const timelineAnalysis = timelineResult.rows[0];
      
      // Calculate completion percentage
      const totalMitigations = parseInt(overallStats.total_mitigations);
      const completedMitigations = parseInt(overallStats.implemented) + parseInt(overallStats.verified);
      const completionPercentage = totalMitigations > 0 
        ? Math.round((completedMitigations / totalMitigations) * 100)
        : 0;
      
      return {
        overall: {
          totalMitigations: parseInt(overallStats.total_mitigations),
          proposed: parseInt(overallStats.proposed),
          approved: parseInt(overallStats.approved),
          inProgress: parseInt(overallStats.in_progress),
          implemented: parseInt(overallStats.implemented),
          verified: parseInt(overallStats.verified),
          rejected: parseInt(overallStats.rejected),
          threatsWithMitigations: parseInt(overallStats.threats_with_mitigations),
          completionPercentage: completionPercentage
        },
        strategyBreakdown: strategyBreakdown.map(s => ({
          strategy: s.mitigation_strategy,
          count: parseInt(s.count),
          completed: parseInt(s.completed)
        })),
        priorityBreakdown: {
          critical: parseInt(priorityBreakdown.critical),
          high: parseInt(priorityBreakdown.high),
          medium: parseInt(priorityBreakdown.medium),
          low: parseInt(priorityBreakdown.low)
        },
        effectivenessBreakdown: effectivenessBreakdown.map(e => ({
          rating: e.effectiveness_rating,
          count: parseInt(e.count),
          avgScore: parseFloat(e.avg_score) || 0
        })),
        costAnalysis: {
          mitigationsWithCost: parseInt(costAnalysis.mitigations_with_cost),
          totalEstimatedCost: parseFloat(costAnalysis.total_estimated_cost) || 0,
          avgCostPerMitigation: parseFloat(costAnalysis.avg_cost_per_mitigation) || 0,
          completedCost: parseFloat(costAnalysis.completed_cost) || 0
        },
        assigneeWorkload: assigneeWorkload.map(a => ({
          userId: a.user_id,
          username: a.username,
          fullName: a.full_name,
          assignedCount: parseInt(a.assigned_count),
          inProgressCount: parseInt(a.in_progress_count),
          completedCount: parseInt(a.completed_count)
        })),
        timeline: {
          withTargetDate: parseInt(timelineAnalysis.with_target_date),
          overdue: parseInt(timelineAnalysis.overdue),
          dueSoon: parseInt(timelineAnalysis.due_soon),
          completedWithDate: parseInt(timelineAnalysis.completed_with_date)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching mitigation statistics: ${error.message}`);
    }
  },

  /**
   * Get overdue mitigations for an organization
   * @param {number} organizationId - Organization ID
   * @returns {Promise<Array>} Array of overdue mitigation objects
   */
  async getOverdueMitigations(organizationId) {
    try {
      const sql = `
        SELECT 
          m.*,
          t.threat_title,
          t.risk_level as threat_risk_level,
          t.risk_score as threat_risk_score,
          tm.model_name as threat_model_name,
          u.username as assigned_to_username,
          u.full_name as assigned_to_name
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        INNER JOIN threat_models tm ON t.threat_model_id = tm.id
        LEFT JOIN users u ON m.assigned_to = u.id
        WHERE tm.organization_id = $1
          AND m.implementation_date < CURRENT_DATE
          AND m.implementation_status NOT IN ('implemented', 'verified', 'rejected')
        ORDER BY 
          CASE m.priority 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          m.implementation_date ASC
      `;
      
      const result = await query(sql, [organizationId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching overdue mitigations: ${error.message}`);
    }
  },

  /**
   * Check if user has access to a mitigation
   * @param {number} mitigationId - Mitigation ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Organization ID if user has access, null otherwise
   */
  async checkUserAccess(mitigationId, userId) {
    try {
      const sql = `
        SELECT tm.organization_id
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        INNER JOIN threat_models tm ON t.threat_model_id = tm.id
        INNER JOIN user_organizations uo ON tm.organization_id = uo.organization_id
        WHERE m.id = $1 AND uo.user_id = $2
      `;
      
      const result = await query(sql, [mitigationId, userId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error checking user access: ${error.message}`);
    }
  },

  /**
   * Get mitigation effectiveness summary
   * @param {number} threatModelId - Threat model ID
   * @returns {Promise<Object>} Effectiveness summary
   */
  async getEffectivenessSummary(threatModelId) {
    try {
      const sql = `
        SELECT
          COUNT(*) as total_rated,
          COUNT(CASE WHEN effectiveness_rating = 'excellent' THEN 1 END) as excellent,
          COUNT(CASE WHEN effectiveness_rating = 'high' THEN 1 END) as high,
          COUNT(CASE WHEN effectiveness_rating = 'medium' THEN 1 END) as medium,
          COUNT(CASE WHEN effectiveness_rating = 'low' THEN 1 END) as low,
          ROUND(AVG(CASE 
            WHEN effectiveness_rating = 'excellent' THEN 4
            WHEN effectiveness_rating = 'high' THEN 3
            WHEN effectiveness_rating = 'medium' THEN 2
            WHEN effectiveness_rating = 'low' THEN 1
          END), 2) as avg_effectiveness_score
        FROM threat_mitigations m
        INNER JOIN threats t ON m.threat_id = t.id
        WHERE t.threat_model_id = $1
          AND m.effectiveness_rating IS NOT NULL
      `;
      
      const result = await query(sql, [threatModelId]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching effectiveness summary: ${error.message}`);
    }
  }
};

module.exports = mitigationModel;
