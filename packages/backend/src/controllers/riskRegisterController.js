const RiskRegister = require('../models/riskRegisterModel');

// Get all risks with optional filters
exports.getAllRisks = async (req, res) => {
  try {
    const filters = {
      assessment_id: req.query.assessment_id,
      risk_level: req.query.risk_level,
      mitigation_status: req.query.mitigation_status
    };

    const risks = await RiskRegister.getAll(filters);
    res.json({
      success: true,
      count: risks.length,
      data: risks
    });
  } catch (error) {
    console.error('Error fetching risks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risks',
      error: error.message
    });
  }
};

// Get single risk by ID
exports.getRiskById = async (req, res) => {
  try {
    const risk = await RiskRegister.getById(req.params.id);
    
    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }

    res.json({
      success: true,
      data: risk
    });
  } catch (error) {
    console.error('Error fetching risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk',
      error: error.message
    });
  }
};

// Create new risk
exports.createRisk = async (req, res) => {
  try {
    const riskData = {
      assessment_id: req.body.assessment_id,
      control_id: req.body.control_id,
      subcategory_id: req.body.subcategory_id,
      risk_description: req.body.risk_description,
      risk_category: req.body.risk_category,
      likelihood: req.body.likelihood,
      impact: req.body.impact,
      mitigation_strategy: req.body.mitigation_strategy,
      mitigation_owner: req.body.mitigation_owner,
      mitigation_deadline: req.body.mitigation_deadline,
      mitigation_status: req.body.mitigation_status,
      notes: req.body.notes
    };

    // Validate required fields
    if (!riskData.risk_description) {
      return res.status(400).json({
        success: false,
        message: 'Risk description is required'
      });
    }

    const risk = await RiskRegister.create(riskData);
    
    res.status(201).json({
      success: true,
      message: 'Risk created successfully',
      data: risk
    });
  } catch (error) {
    console.error('Error creating risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create risk',
      error: error.message
    });
  }
};

// Update risk
exports.updateRisk = async (req, res) => {
  try {
    const updates = {
      risk_description: req.body.risk_description,
      risk_category: req.body.risk_category,
      likelihood: req.body.likelihood,
      impact: req.body.impact,
      mitigation_strategy: req.body.mitigation_strategy,
      mitigation_owner: req.body.mitigation_owner,
      mitigation_deadline: req.body.mitigation_deadline,
      mitigation_status: req.body.mitigation_status,
      residual_likelihood: req.body.residual_likelihood,
      residual_impact: req.body.residual_impact,
      notes: req.body.notes
    };

    const risk = await RiskRegister.update(req.params.id, updates);
    
    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }

    res.json({
      success: true,
      message: 'Risk updated successfully',
      data: risk
    });
  } catch (error) {
    console.error('Error updating risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update risk',
      error: error.message
    });
  }
};

// Delete risk
exports.deleteRisk = async (req, res) => {
  try {
    const risk = await RiskRegister.delete(req.params.id);
    
    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }

    res.json({
      success: true,
      message: 'Risk deleted successfully',
      data: risk
    });
  } catch (error) {
    console.error('Error deleting risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete risk',
      error: error.message
    });
  }
};

// Get risk statistics
exports.getRiskStatistics = async (req, res) => {
  try {
    const assessmentId = req.query.assessment_id;
    const stats = await RiskRegister.getStatistics(assessmentId);
    
    res.json({
      success: true,
      data: {
        total_risks: parseInt(stats.total_risks) || 0,
        by_level: {
          low: parseInt(stats.low_risks) || 0,
          medium: parseInt(stats.medium_risks) || 0,
          high: parseInt(stats.high_risks) || 0,
          critical: parseInt(stats.critical_risks) || 0
        },
        by_status: {
          not_started: parseInt(stats.not_started) || 0,
          in_progress: parseInt(stats.in_progress) || 0,
          completed: parseInt(stats.completed) || 0,
          deferred: parseInt(stats.deferred) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching risk statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk statistics',
      error: error.message
    });
  }
};

// Export risk register to CSV
exports.exportRiskRegister = async (req, res) => {
  try {
    const csvContent = await RiskRegister.exportToCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=risk-register-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting risk register:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export risk register',
      error: error.message
    });
  }
};
