const { query } = require('../config/database');

class RiskRegister {
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS risk_register (
        id SERIAL PRIMARY KEY,
        risk_id VARCHAR(100) UNIQUE NOT NULL,
        assessment_id INTEGER REFERENCES compliance_assessments(id),
        control_id INTEGER REFERENCES nist_csf_controls(id),
        subcategory_id VARCHAR(50),
        risk_description TEXT NOT NULL,
        risk_category VARCHAR(100),
        likelihood INTEGER CHECK(likelihood BETWEEN 1 AND 5),
        impact INTEGER CHECK(impact BETWEEN 1 AND 5),
        risk_score INTEGER,
        risk_level VARCHAR(50) CHECK(risk_level IN ('Low', 'Medium', 'High', 'Critical')),
        mitigation_strategy TEXT,
        mitigation_owner VARCHAR(255),
        mitigation_deadline DATE,
        mitigation_status VARCHAR(50) CHECK(mitigation_status IN ('Not Started', 'In Progress', 'Completed', 'Deferred')) DEFAULT 'Not Started',
        residual_likelihood INTEGER CHECK(residual_likelihood BETWEEN 1 AND 5),
        residual_impact INTEGER CHECK(residual_impact BETWEEN 1 AND 5),
        residual_risk_score INTEGER,
        residual_risk_level VARCHAR(50),
        notes TEXT,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_risk_register_assessment ON risk_register(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_risk_register_control ON risk_register(control_id);
      CREATE INDEX IF NOT EXISTS idx_risk_register_level ON risk_register(risk_level);
      CREATE INDEX IF NOT EXISTS idx_risk_register_status ON risk_register(mitigation_status);
    `;
    
    try {
      await query(sql);
      console.log('Risk Register table created successfully');
    } catch (error) {
      console.error('Error creating risk register table:', error);
      throw error;
    }
  }

  static calculateRiskScore(likelihood, impact) {
    return likelihood * impact;
  }

  static determineRiskLevel(riskScore) {
    if (riskScore <= 4) return 'Low';
    if (riskScore <= 9) return 'Medium';
    if (riskScore <= 16) return 'High';
    return 'Critical';
  }

  static generateRiskId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `RISK-${timestamp}-${random}`.toUpperCase();
  }

  static async create(riskData) {
    const {
      assessment_id,
      control_id,
      subcategory_id,
      risk_description,
      risk_category,
      likelihood,
      impact,
      mitigation_strategy,
      mitigation_owner,
      mitigation_deadline,
      mitigation_status = 'Not Started',
      notes,
      comments
    } = riskData;

    const risk_id = this.generateRiskId();
    const risk_score = this.calculateRiskScore(likelihood, impact);
    const risk_level = this.determineRiskLevel(risk_score);

    const sql = `
      INSERT INTO risk_register (
        risk_id, assessment_id, control_id, subcategory_id, risk_description,
        risk_category, likelihood, impact, risk_score, risk_level,
        mitigation_strategy, mitigation_owner, mitigation_deadline, 
        mitigation_status, notes, comments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `;

    const result = await query(sql, [
      risk_id, assessment_id, control_id, subcategory_id, risk_description,
      risk_category, likelihood, impact, risk_score, risk_level,
      mitigation_strategy, mitigation_owner, mitigation_deadline,
      mitigation_status, notes, comments
    ]);

    return await this.getById(result.rows[0].id);
  }

  static async getAll(filters = {}) {
    let sql = 'SELECT * FROM risk_register WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.assessment_id) {
      sql += ` AND assessment_id = $${paramCount}`;
      params.push(filters.assessment_id);
      paramCount++;
    }

    if (filters.risk_level) {
      sql += ` AND risk_level = $${paramCount}`;
      params.push(filters.risk_level);
      paramCount++;
    }

    if (filters.mitigation_status) {
      sql += ` AND mitigation_status = $${paramCount}`;
      params.push(filters.mitigation_status);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  static async getById(id) {
    const sql = 'SELECT * FROM risk_register WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getByRiskId(riskId) {
    const sql = 'SELECT * FROM risk_register WHERE risk_id = $1';
    const result = await query(sql, [riskId]);
    return result.rows[0];
  }

  static async update(id, updates) {
    const {
      risk_description,
      risk_category,
      likelihood,
      impact,
      mitigation_strategy,
      mitigation_owner,
      mitigation_deadline,
      mitigation_status,
      residual_likelihood,
      residual_impact,
      notes
    } = updates;

    // Recalculate risk scores if likelihood or impact changed
    let risk_score, risk_level, residual_risk_score, residual_risk_level;
    
    if (likelihood && impact) {
      risk_score = this.calculateRiskScore(likelihood, impact);
      risk_level = this.determineRiskLevel(risk_score);
    }
    
    if (residual_likelihood && residual_impact) {
      residual_risk_score = this.calculateRiskScore(residual_likelihood, residual_impact);
      residual_risk_level = this.determineRiskLevel(residual_risk_score);
    }

    const sql = `
      UPDATE risk_register 
      SET 
        risk_description = COALESCE($1, risk_description),
        risk_category = COALESCE($2, risk_category),
        likelihood = COALESCE($3, likelihood),
        impact = COALESCE($4, impact),
        risk_score = COALESCE($5, risk_score),
        risk_level = COALESCE($6, risk_level),
        mitigation_strategy = COALESCE($7, mitigation_strategy),
        mitigation_owner = COALESCE($8, mitigation_owner),
        mitigation_deadline = COALESCE($9, mitigation_deadline),
        mitigation_status = COALESCE($10, mitigation_status),
        residual_likelihood = COALESCE($11, residual_likelihood),
        residual_impact = COALESCE($12, residual_impact),
        residual_risk_score = COALESCE($13, residual_risk_score),
        residual_risk_level = COALESCE($14, residual_risk_level),
        notes = COALESCE($15, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
    `;

    const result = await query(sql, [
      risk_description, risk_category, likelihood, impact,
      risk_score, risk_level, mitigation_strategy, mitigation_owner,
      mitigation_deadline, mitigation_status, residual_likelihood,
      residual_impact, residual_risk_score, residual_risk_level,
      notes, id
    ]);

    return result.rows[0];
  }

  static async delete(id) {
    const sql = 'DELETE FROM risk_register WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getStatistics(assessmentId = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_risks,
        SUM(CASE WHEN risk_level = 'Low' THEN 1 ELSE 0 END) as low_risks,
        SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) as medium_risks,
        SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high_risks,
        SUM(CASE WHEN risk_level = 'Critical' THEN 1 ELSE 0 END) as critical_risks,
        SUM(CASE WHEN mitigation_status = 'Not Started' THEN 1 ELSE 0 END) as not_started,
        SUM(CASE WHEN mitigation_status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN mitigation_status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN mitigation_status = 'Deferred' THEN 1 ELSE 0 END) as deferred
      FROM risk_register
      WHERE 1=1
    `;

    const params = [];
    if (assessmentId) {
      sql += ' AND assessment_id = $1';
      params.push(assessmentId);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async createFromControlAssessment(assessmentId, controlId, userId, questionnaireResponse, comments) {
    // Get control details
    const controlQuery = `
      SELECT 
        id,
        control_code,
        control_name,
        description
      FROM nist_csf_controls
      WHERE id = $1
    `;
    
    const controlResult = await query(controlQuery, [controlId]);
    const control = controlResult.rows[0];
    
    if (!control) {
      throw new Error('Control not found');
    }

    // Use questionnaire response as risk description if provided, otherwise use control details
    const riskDescription = questionnaireResponse || 
      `Control at risk: ${control.control_name}${control.description ? ' - ' + control.description : ''}`;

    // Create risk entry
    const riskData = {
      assessment_id: assessmentId,
      control_id: controlId,
      subcategory_id: control.control_code,
      risk_description: riskDescription,
      risk_category: 'Compliance',
      likelihood: 4, // Default to likely
      impact: 4, // Default to major impact
      mitigation_strategy: `Address risk for ${control.control_name} control`,
      mitigation_status: 'Not Started',
      notes: `Auto-generated from control assessment marked as At Risk. Control: ${control.control_code}`,
      comments: comments || ''
    };

    return await this.create(riskData);
  }

  static async markRiskAsMitigated(assessmentId, controlId) {
    // Find risk entry for this assessment and control
    const sql = `
      UPDATE risk_register
      SET mitigation_status = 'Completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE assessment_id = $1 
        AND control_id = $2 
        AND mitigation_status != 'Completed'
      RETURNING *
    `;

    const result = await query(sql, [assessmentId, controlId]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  }

  static async exportToCSV() {
    const risks = await this.getAll();
    
    // CSV headers
    const headers = [
      'Risk ID', 'Assessment ID', 'Control ID', 'Subcategory', 'Description',
      'Category', 'Likelihood', 'Impact', 'Risk Score', 'Risk Level',
      'Mitigation Strategy', 'Owner', 'Deadline', 'Status',
      'Residual Likelihood', 'Residual Impact', 'Residual Score', 'Residual Level',
      'Notes', 'Created At'
    ];

    const rows = risks.map(risk => [
      risk.risk_id,
      risk.assessment_id || '',
      risk.control_id || '',
      risk.subcategory_id || '',
      risk.risk_description,
      risk.risk_category || '',
      risk.likelihood || '',
      risk.impact || '',
      risk.risk_score || '',
      risk.risk_level || '',
      risk.mitigation_strategy || '',
      risk.mitigation_owner || '',
      risk.mitigation_deadline || '',
      risk.mitigation_status || '',
      risk.residual_likelihood || '',
      risk.residual_impact || '',
      risk.residual_risk_score || '',
      risk.residual_risk_level || '',
      risk.notes || '',
      risk.created_at
    ]);

    // Escape CSV values
    const escapeCSV = (value) => {
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    return csvContent;
  }
}

module.exports = RiskRegister;
