const { query } = require('../config/database');

/**
 * Evidence Model - Database query functions for evidence/file management
 */

const evidenceModel = {
  /**
   * Create new evidence entry with file data
   * @param {number} organizationId - Organization ID
   * @param {number} controlAssessmentId - Control assessment ID
   * @param {string} filename - Original filename
   * @param {Buffer} fileData - File binary data
   * @param {string} fileType - MIME type
   * @param {number} fileSize - File size in bytes
   * @param {string} evidenceQuality - Quality rating (low, medium, high, excellent)
   * @param {string} description - Evidence description
   * @param {number} uploadedBy - User ID who uploaded
   * @returns {Promise<Object>} Created evidence object
   */
  async createEvidence(organizationId, controlAssessmentId, filename, fileData, fileType, fileSize, evidenceQuality, description, uploadedBy) {
    try {
      const sql = `
        INSERT INTO evidence 
          (organization_id, control_assessment_id, evidence_name, file_data, file_type, 
           file_size, quality_rating, description, uploaded_by, evidence_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, organization_id, control_assessment_id, evidence_name, file_type, 
                  file_size, quality_rating, description, evidence_type, uploaded_by, 
                  is_verified, created_at, updated_at
      `;
      
      // Determine evidence type from file extension or MIME type
      const evidenceType = this.getEvidenceTypeFromMimeType(fileType);
      
      const values = [
        organizationId,
        controlAssessmentId,
        filename,
        fileData, // PostgreSQL will handle Buffer -> BYTEA conversion
        fileType,
        fileSize,
        evidenceQuality || 'medium',
        description,
        uploadedBy,
        evidenceType
      ];
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create evidence');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating evidence: ${error.message}`);
    }
  },

  /**
   * Get evidence by ID including file data
   * @param {number} id - Evidence ID
   * @returns {Promise<Object|null>} Evidence object with file data or null
   */
  async getEvidenceById(id) {
    try {
      const sql = `
        SELECT 
          e.*,
          cca.assessment_id,
          c.control_code,
          c.control_name,
          u.username as uploaded_by_username,
          u.full_name as uploaded_by_name,
          v.username as verified_by_username,
          v.full_name as verified_by_name
        FROM evidence e
        LEFT JOIN compliance_control_assessments cca ON e.control_assessment_id = cca.id
        LEFT JOIN nist_csf_controls c ON cca.control_id = c.id
        LEFT JOIN users u ON e.uploaded_by = u.id
        LEFT JOIN users v ON e.verified_by = v.id
        WHERE e.id = $1
      `;
      
      const result = await query(sql, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error fetching evidence by ID: ${error.message}`);
    }
  },

  /**
   * Get all evidence for a control assessment (without file data for performance)
   * @param {number} controlAssessmentId - Control assessment ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of evidence objects
   */
  async getEvidenceByControlAssessment(controlAssessmentId, options = {}) {
    try {
      const { includeVerifiedOnly = false } = options;
      
      let sql = `
        SELECT 
          e.id,
          e.organization_id,
          e.control_assessment_id,
          e.evidence_name,
          e.file_type,
          e.file_size,
          e.quality_rating,
          e.description,
          e.evidence_type,
          e.is_verified,
          e.expiration_date,
          e.tags,
          e.created_at,
          e.updated_at,
          u.username as uploaded_by_username,
          u.full_name as uploaded_by_name,
          v.username as verified_by_username,
          v.full_name as verified_by_name,
          e.verified_at
        FROM evidence e
        LEFT JOIN users u ON e.uploaded_by = u.id
        LEFT JOIN users v ON e.verified_by = v.id
        WHERE e.control_assessment_id = $1
      `;
      
      if (includeVerifiedOnly) {
        sql += ' AND e.is_verified = true';
      }
      
      sql += ' ORDER BY e.created_at DESC';
      
      const result = await query(sql, [controlAssessmentId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching evidence by control assessment: ${error.message}`);
    }
  },

  /**
   * Get all evidence for an organization
   * @param {number} organizationId - Organization ID
   * @param {Object} options - Query options (limit, offset, evidenceType)
   * @returns {Promise<Object>} Evidence list with pagination
   */
  async getEvidenceByOrganization(organizationId, options = {}) {
    try {
      const { limit = 50, offset = 0, evidenceType, qualityRating } = options;
      
      let sql = `
        SELECT 
          e.id,
          e.organization_id,
          e.control_assessment_id,
          e.evidence_name,
          e.file_type,
          e.file_size,
          e.quality_rating,
          e.description,
          e.evidence_type,
          e.is_verified,
          e.expiration_date,
          e.created_at,
          u.username as uploaded_by_username,
          u.full_name as uploaded_by_name,
          cca.assessment_id,
          c.control_code,
          c.control_name
        FROM evidence e
        LEFT JOIN users u ON e.uploaded_by = u.id
        LEFT JOIN compliance_control_assessments cca ON e.control_assessment_id = cca.id
        LEFT JOIN nist_csf_controls c ON cca.control_id = c.id
        WHERE e.organization_id = $1
      `;
      
      const values = [organizationId];
      let paramCount = 1;
      
      if (evidenceType) {
        paramCount++;
        sql += ` AND e.evidence_type = $${paramCount}`;
        values.push(evidenceType);
      }
      
      if (qualityRating) {
        paramCount++;
        sql += ` AND e.quality_rating = $${paramCount}`;
        values.push(qualityRating);
      }
      
      sql += ' ORDER BY e.created_at DESC';
      
      // Get total count
      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
      const countResult = await query(countSql.split('ORDER BY')[0], values);
      const total = parseInt(countResult.rows[0].total);
      
      // Add pagination
      paramCount++;
      sql += ` LIMIT $${paramCount}`;
      values.push(limit);
      
      paramCount++;
      sql += ` OFFSET $${paramCount}`;
      values.push(offset);
      
      const result = await query(sql, values);
      
      return {
        evidence: result.rows,
        total: total,
        limit: limit,
        offset: offset
      };
    } catch (error) {
      throw new Error(`Error fetching evidence by organization: ${error.message}`);
    }
  },

  /**
   * Get all evidence for multiple organizations (without file data for performance)
   * @param {Array<number>} organizationIds - Array of organization IDs
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Evidence array with pagination info
   */
  async getEvidenceByOrganizations(organizationIds, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      if (!organizationIds || organizationIds.length === 0) {
        return {
          evidence: [],
          total: 0,
          limit: limit,
          offset: offset
        };
      }
      
      const placeholders = organizationIds.map((_, i) => `$${i + 1}`).join(',');
      
      const sql = `
        SELECT 
          e.id,
          e.organization_id,
          e.control_assessment_id,
          e.evidence_name as file_name,
          e.evidence_name as filename,
          e.file_type,
          e.file_size,
          e.quality_rating as evidence_quality,
          e.description,
          e.evidence_type,
          e.is_verified,
          e.created_at,
          e.created_at as uploaded_at,
          u.username as uploaded_by_username,
          u.full_name as uploaded_by_name
        FROM evidence e
        LEFT JOIN users u ON e.uploaded_by = u.id
        WHERE e.organization_id IN (${placeholders})
        ORDER BY e.created_at DESC
        LIMIT $${organizationIds.length + 1}
        OFFSET $${organizationIds.length + 2}
      `;
      
      const values = [...organizationIds, limit, offset];
      
      const result = await query(sql, values);
      
      // Get total count
      const countSql = `
        SELECT COUNT(*) as total
        FROM evidence e
        WHERE e.organization_id IN (${placeholders})
      `;
      
      const countResult = await query(countSql, organizationIds);
      const total = parseInt(countResult.rows[0].total);
      
      return {
        evidence: result.rows,
        total: total,
        limit: limit,
        offset: offset
      };
    } catch (error) {
      throw new Error(`Error fetching evidence by organizations: ${error.message}`);
    }
  },

  /**
   * Update evidence metadata
   * @param {number} id - Evidence ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated evidence object
   */
  async updateEvidence(id, updates) {
    try {
      // Build dynamic SQL for updates
      const allowedFields = [
        'description', 'quality_rating', 'evidence_type', 'expiration_date', 
        'tags', 'is_verified', 'verified_by', 'verified_at'
      ];
      
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      // Always update updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      // If verified is being set to true and verified_at not provided, set it
      if (updates.is_verified === true && !updates.verified_at) {
        updateFields.push('verified_at = CURRENT_TIMESTAMP');
      }
      
      values.push(id);
      
      const sql = `
        UPDATE evidence
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, organization_id, control_assessment_id, evidence_name, file_type, 
                  file_size, quality_rating, description, evidence_type, is_verified, 
                  verified_by, verified_at, expiration_date, tags, created_at, updated_at
      `;
      
      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Evidence not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating evidence: ${error.message}`);
    }
  },

  /**
   * Delete evidence
   * @param {number} id - Evidence ID
   * @returns {Promise<Object>} Deleted evidence info
   */
  async deleteEvidence(id) {
    try {
      const sql = `
        DELETE FROM evidence
        WHERE id = $1
        RETURNING id, evidence_name, control_assessment_id, organization_id
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Evidence not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting evidence: ${error.message}`);
    }
  },

  /**
   * Get only file data for download
   * @param {number} id - Evidence ID
   * @returns {Promise<Object|null>} File data and metadata
   */
  async getEvidenceFile(id) {
    try {
      const sql = `
        SELECT 
          id,
          evidence_name,
          file_data,
          file_type,
          file_size,
          created_at
        FROM evidence
        WHERE id = $1
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching evidence file: ${error.message}`);
    }
  },

  /**
   * Verify evidence
   * @param {number} id - Evidence ID
   * @param {number} verifiedBy - User ID who verified
   * @returns {Promise<Object>} Verified evidence object
   */
  async verifyEvidence(id, verifiedBy) {
    try {
      const sql = `
        UPDATE evidence
        SET is_verified = true,
            verified_by = $1,
            verified_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, evidence_name, is_verified, verified_by, verified_at
      `;
      
      const result = await query(sql, [verifiedBy, id]);
      
      if (result.rows.length === 0) {
        throw new Error('Evidence not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error verifying evidence: ${error.message}`);
    }
  },

  /**
   * Get evidence statistics for a control assessment
   * @param {number} controlAssessmentId - Control assessment ID
   * @returns {Promise<Object>} Evidence statistics
   */
  async getEvidenceStats(controlAssessmentId) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_evidence,
          COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count,
          COUNT(CASE WHEN quality_rating = 'excellent' THEN 1 END) as excellent_quality,
          COUNT(CASE WHEN quality_rating = 'high' THEN 1 END) as high_quality,
          COUNT(CASE WHEN quality_rating = 'medium' THEN 1 END) as medium_quality,
          COUNT(CASE WHEN quality_rating = 'low' THEN 1 END) as low_quality,
          SUM(file_size) as total_size_bytes,
          COUNT(CASE WHEN evidence_type = 'document' THEN 1 END) as document_count,
          COUNT(CASE WHEN evidence_type = 'screenshot' THEN 1 END) as screenshot_count,
          COUNT(CASE WHEN evidence_type = 'certificate' THEN 1 END) as certificate_count,
          COUNT(CASE WHEN evidence_type = 'log' THEN 1 END) as log_count
        FROM evidence
        WHERE control_assessment_id = $1
      `;
      
      const result = await query(sql, [controlAssessmentId]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching evidence stats: ${error.message}`);
    }
  },

  /**
   * Get evidence type from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} Evidence type
   */
  getEvidenceTypeFromMimeType(mimeType) {
    if (!mimeType) return 'other';
    
    const mimeTypeLower = mimeType.toLowerCase();
    
    if (mimeTypeLower.includes('pdf') || 
        mimeTypeLower.includes('word') || 
        mimeTypeLower.includes('document') ||
        mimeTypeLower.includes('text')) {
      return 'document';
    }
    
    if (mimeTypeLower.includes('image') || 
        mimeTypeLower.includes('png') || 
        mimeTypeLower.includes('jpg') || 
        mimeTypeLower.includes('jpeg')) {
      return 'screenshot';
    }
    
    if (mimeTypeLower.includes('certificate') || 
        mimeTypeLower.includes('pem') || 
        mimeTypeLower.includes('crt')) {
      return 'certificate';
    }
    
    if (mimeTypeLower.includes('log') || 
        mimeTypeLower.includes('txt')) {
      return 'log';
    }
    
    if (mimeTypeLower.includes('policy') || 
        mimeTypeLower.includes('procedure')) {
      return 'policy';
    }
    
    return 'other';
  },

  /**
   * Bulk delete evidence
   * @param {Array<number>} ids - Array of evidence IDs
   * @returns {Promise<number>} Number of deleted records
   */
  async bulkDeleteEvidence(ids) {
    try {
      if (!ids || ids.length === 0) {
        return 0;
      }
      
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
      
      const sql = `
        DELETE FROM evidence
        WHERE id IN (${placeholders})
        RETURNING id
      `;
      
      const result = await query(sql, ids);
      
      return result.rows.length;
    } catch (error) {
      throw new Error(`Error bulk deleting evidence: ${error.message}`);
    }
  }
};

module.exports = evidenceModel;
