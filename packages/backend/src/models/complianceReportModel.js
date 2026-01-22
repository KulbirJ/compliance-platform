const pool = require('../config/database');

/**
 * Compliance Report Model
 * Handles database operations for compliance reports with PDF storage
 */

/**
 * Create a new compliance report
 * @param {number} assessmentId - ID of the assessment
 * @param {number} generatedBy - ID of the user generating the report
 * @param {object} reportData - Report metadata (reportType, fileName, fileSize, reportFormat)
 * @param {Buffer} fileData - PDF file data as Buffer
 * @returns {Promise<object>} Created report object
 */
const createComplianceReport = async (assessmentId, generatedBy, reportData, fileData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get organization_id from the assessment
    const assessmentResult = await client.query(
      'SELECT organization_id FROM assessments WHERE id = $1',
      [assessmentId]
    );

    if (assessmentResult.rows.length === 0) {
      throw new Error('Assessment not found');
    }

    const organizationId = assessmentResult.rows[0].organization_id;

    // Insert the compliance report
    const insertQuery = `
      INSERT INTO compliance_reports (
        assessment_id,
        organization_id,
        generated_by,
        report_type,
        file_name,
        file_size,
        file_data,
        report_format,
        generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING 
        id,
        assessment_id,
        organization_id,
        generated_by,
        report_type,
        file_name,
        file_size,
        report_format,
        generated_at,
        created_at
    `;

    const values = [
      assessmentId,
      organizationId,
      generatedBy,
      reportData.reportType || 'compliance_report',
      reportData.fileName,
      reportData.fileSize || fileData.length,
      fileData,
      reportData.reportFormat || 'pdf'
    ];

    const result = await client.query(insertQuery, values);
    
    await client.query('COMMIT');
    
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating compliance report:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get report metadata by ID
 * @param {number} id - Report ID
 * @returns {Promise<object|null>} Report metadata (without file_data)
 */
const getReportById = async (id) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.assessment_id,
        r.organization_id,
        r.generated_by,
        r.report_type,
        r.file_name,
        r.file_size,
        r.report_format,
        r.generated_at,
        r.created_at,
        u.name as generated_by_name,
        u.email as generated_by_email,
        a.assessment_name,
        a.framework_version,
        a.assessment_status
      FROM compliance_reports r
      INNER JOIN users u ON r.generated_by = u.id
      INNER JOIN assessments a ON r.assessment_id = a.id
      WHERE r.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error getting report by ID:', error);
    throw error;
  }
};

/**
 * Get all reports for an assessment
 * @param {number} assessmentId - Assessment ID
 * @returns {Promise<Array>} Array of report metadata
 */
const getReportsByAssessment = async (assessmentId) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.assessment_id,
        r.organization_id,
        r.generated_by,
        r.report_type,
        r.file_name,
        r.file_size,
        r.report_format,
        r.generated_at,
        r.created_at,
        u.name as generated_by_name,
        u.email as generated_by_email
      FROM compliance_reports r
      INNER JOIN users u ON r.generated_by = u.id
      WHERE r.assessment_id = $1
      ORDER BY r.generated_at DESC
    `;

    const result = await pool.query(query, [assessmentId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting reports by assessment:', error);
    throw error;
  }
};

/**
 * Get PDF file data for download
 * @param {number} id - Report ID
 * @returns {Promise<object|null>} Object with file_data, file_name, and file_size
 */
const getReportFile = async (id) => {
  try {
    const query = `
      SELECT 
        file_data,
        file_name,
        file_size,
        report_format
      FROM compliance_reports
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return {
      fileData: result.rows[0].file_data,
      fileName: result.rows[0].file_name,
      fileSize: result.rows[0].file_size,
      reportFormat: result.rows[0].report_format
    };
  } catch (error) {
    console.error('Error getting report file:', error);
    throw error;
  }
};

/**
 * Delete a report
 * @param {number} id - Report ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
const deleteReport = async (id) => {
  try {
    const query = 'DELETE FROM compliance_reports WHERE id = $1';
    
    const result = await pool.query(query, [id]);
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

/**
 * Get all reports for an organization
 * @param {number} organizationId - Organization ID
 * @param {object} options - Query options (page, limit, reportType, assessmentId)
 * @returns {Promise<object>} Object with reports array and pagination info
 */
const getReportsByOrganization = async (organizationId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      reportType = null,
      assessmentId = null
    } = options;

    const offset = (page - 1) * limit;
    
    // Build WHERE clause dynamically
    const conditions = ['r.organization_id = $1'];
    const params = [organizationId];
    let paramCounter = 2;

    if (reportType) {
      conditions.push(`r.report_type = $${paramCounter}`);
      params.push(reportType);
      paramCounter++;
    }

    if (assessmentId) {
      conditions.push(`r.assessment_id = $${paramCounter}`);
      params.push(assessmentId);
      paramCounter++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM compliance_reports r
      WHERE ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params);
    const totalReports = parseInt(countResult.rows[0].total);

    // Get paginated reports
    const query = `
      SELECT 
        r.id,
        r.assessment_id,
        r.organization_id,
        r.generated_by,
        r.report_type,
        r.file_name,
        r.file_size,
        r.report_format,
        r.generated_at,
        r.created_at,
        u.name as generated_by_name,
        u.email as generated_by_email,
        a.assessment_name,
        a.framework_version,
        a.assessment_status
      FROM compliance_reports r
      INNER JOIN users u ON r.generated_by = u.id
      INNER JOIN assessments a ON r.assessment_id = a.id
      WHERE ${whereClause}
      ORDER BY r.generated_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      reports: result.rows,
      pagination: {
        total: totalReports,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalReports / limit)
      }
    };
  } catch (error) {
    console.error('Error getting reports by organization:', error);
    throw error;
  }
};

/**
 * Check if a report exists and belongs to an organization
 * @param {number} id - Report ID
 * @param {number} organizationId - Organization ID
 * @returns {Promise<boolean>} True if report exists and belongs to organization
 */
const reportExistsForOrganization = async (id, organizationId) => {
  try {
    const query = `
      SELECT id 
      FROM compliance_reports 
      WHERE id = $1 AND organization_id = $2
    `;

    const result = await pool.query(query, [id, organizationId]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking report existence:', error);
    throw error;
  }
};

/**
 * Get report statistics for an organization
 * @param {number} organizationId - Organization ID
 * @returns {Promise<object>} Report statistics
 */
const getReportStatistics = async (organizationId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_reports,
        COUNT(DISTINCT assessment_id) as assessments_with_reports,
        SUM(file_size) as total_storage_bytes,
        COUNT(CASE WHEN generated_at >= NOW() - INTERVAL '30 days' THEN 1 END) as reports_last_30_days,
        COUNT(CASE WHEN report_type = 'compliance_report' THEN 1 END) as compliance_reports,
        COUNT(CASE WHEN report_type = 'executive_summary' THEN 1 END) as executive_summaries,
        MIN(generated_at) as first_report_date,
        MAX(generated_at) as latest_report_date
      FROM compliance_reports
      WHERE organization_id = $1
    `;

    const result = await pool.query(query, [organizationId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting report statistics:', error);
    throw error;
  }
};

module.exports = {
  createComplianceReport,
  getReportById,
  getReportsByAssessment,
  getReportFile,
  deleteReport,
  getReportsByOrganization,
  reportExistsForOrganization,
  getReportStatistics
};
