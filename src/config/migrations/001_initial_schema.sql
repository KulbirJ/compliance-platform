-- =====================================================
-- Cybersecurity Compliance Platform - Initial Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates all tables for NIST CSF compliance and STRIDE threat modeling
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES: Users and Organizations
-- =====================================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Organizations table
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_name ON organizations(name);

-- User-Organizations relationship with roles
CREATE TABLE user_organizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, organization_id),
    CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

CREATE INDEX idx_user_orgs_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_orgs_org_id ON user_organizations(organization_id);

-- =====================================================
-- NIST CSF FRAMEWORK STRUCTURE
-- =====================================================

-- NIST CSF Functions (5 core functions)
CREATE TABLE nist_csf_functions (
    id SERIAL PRIMARY KEY,
    function_code VARCHAR(10) UNIQUE NOT NULL,
    function_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NIST CSF Categories
CREATE TABLE nist_csf_categories (
    id SERIAL PRIMARY KEY,
    function_id INTEGER NOT NULL REFERENCES nist_csf_functions(id) ON DELETE CASCADE,
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nist_categories_function ON nist_csf_categories(function_id);

-- NIST CSF Controls (specific controls under each category)
CREATE TABLE nist_csf_controls (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES nist_csf_categories(id) ON DELETE CASCADE,
    control_code VARCHAR(50) UNIQUE NOT NULL,
    control_name VARCHAR(500) NOT NULL,
    description TEXT,
    guidance TEXT,
    importance VARCHAR(20) DEFAULT 'medium',
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (importance IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_nist_controls_category ON nist_csf_controls(category_id);
CREATE INDEX idx_nist_controls_importance ON nist_csf_controls(importance);

-- =====================================================
-- COMPLIANCE ASSESSMENTS
-- =====================================================

-- Compliance Assessments (assessment instances)
CREATE TABLE compliance_assessments (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    assessment_name VARCHAR(255) NOT NULL,
    assessment_version VARCHAR(50) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'draft',
    scope TEXT,
    assessment_date DATE,
    due_date DATE,
    completion_percentage DECIMAL(5,2) DEFAULT 0.0,
    overall_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CHECK (status IN ('draft', 'in_progress', 'under_review', 'completed', 'archived')),
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

CREATE INDEX idx_assessments_org ON compliance_assessments(organization_id);
CREATE INDEX idx_assessments_status ON compliance_assessments(status);
CREATE INDEX idx_assessments_created_by ON compliance_assessments(created_by);

-- Compliance Control Assessments (responses for each control)
CREATE TABLE compliance_control_assessments (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES compliance_assessments(id) ON DELETE CASCADE,
    control_id INTEGER NOT NULL REFERENCES nist_csf_controls(id) ON DELETE CASCADE,
    implementation_status VARCHAR(50) NOT NULL DEFAULT 'not_implemented',
    maturity_level VARCHAR(50),
    compliance_score DECIMAL(5,2),
    notes TEXT,
    recommendations TEXT,
    assessed_by INTEGER REFERENCES users(id),
    assessed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, control_id),
    CHECK (implementation_status IN ('not_implemented', 'partially_implemented', 'largely_implemented', 'fully_implemented', 'not_applicable')),
    CHECK (maturity_level IN ('initial', 'managed', 'defined', 'quantitatively_managed', 'optimizing')),
    CHECK (compliance_score >= 0 AND compliance_score <= 100)
);

CREATE INDEX idx_control_assessments_assessment ON compliance_control_assessments(assessment_id);
CREATE INDEX idx_control_assessments_control ON compliance_control_assessments(control_id);
CREATE INDEX idx_control_assessments_status ON compliance_control_assessments(implementation_status);

-- =====================================================
-- EVIDENCE MANAGEMENT
-- =====================================================

-- Evidence table (store file metadata and quality ratings)
CREATE TABLE evidence (
    id SERIAL PRIMARY KEY,
    control_assessment_id INTEGER REFERENCES compliance_control_assessments(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    evidence_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size BIGINT,
    evidence_type VARCHAR(50),
    quality_rating VARCHAR(20),
    expiration_date DATE,
    tags TEXT[],
    is_verified BOOLEAN DEFAULT false,
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (evidence_type IN ('document', 'screenshot', 'log', 'certificate', 'policy', 'procedure', 'report', 'other')),
    CHECK (quality_rating IN ('low', 'medium', 'high', 'excellent'))
);

CREATE INDEX idx_evidence_control_assessment ON evidence(control_assessment_id);
CREATE INDEX idx_evidence_organization ON evidence(organization_id);
CREATE INDEX idx_evidence_uploaded_by ON evidence(uploaded_by);
CREATE INDEX idx_evidence_type ON evidence(evidence_type);

-- =====================================================
-- STRIDE THREAT MODELING
-- =====================================================

-- STRIDE Categories table
CREATE TABLE stride_categories (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(10) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets table (reusable components for threat modeling)
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    description TEXT,
    criticality VARCHAR(20) DEFAULT 'medium',
    owner INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (asset_type IN ('data_store', 'process', 'external_entity', 'data_flow', 'trust_boundary')),
    CHECK (criticality IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_assets_organization ON assets(organization_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_criticality ON assets(criticality);

-- Threat Models table
CREATE TABLE threat_models (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50) DEFAULT '1.0',
    system_name VARCHAR(255),
    description TEXT,
    scope TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    risk_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('draft', 'in_review', 'approved', 'archived'))
);

CREATE INDEX idx_threat_models_org ON threat_models(organization_id);
CREATE INDEX idx_threat_models_status ON threat_models(status);

-- Link threat models to assets
CREATE TABLE threat_model_assets (
    id SERIAL PRIMARY KEY,
    threat_model_id INTEGER NOT NULL REFERENCES threat_models(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(threat_model_id, asset_id)
);

CREATE INDEX idx_tm_assets_model ON threat_model_assets(threat_model_id);
CREATE INDEX idx_tm_assets_asset ON threat_model_assets(asset_id);

-- Threats table (identified threats with risk scoring)
CREATE TABLE threats (
    id SERIAL PRIMARY KEY,
    threat_model_id INTEGER NOT NULL REFERENCES threat_models(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
    stride_category_id INTEGER REFERENCES stride_categories(id),
    threat_title VARCHAR(500) NOT NULL,
    threat_description TEXT,
    impact_description TEXT,
    likelihood VARCHAR(20),
    impact VARCHAR(20),
    risk_level VARCHAR(20),
    risk_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'identified',
    identified_by INTEGER REFERENCES users(id),
    identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    CHECK (impact IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    CHECK (status IN ('identified', 'analyzing', 'mitigating', 'mitigated', 'accepted', 'transferred'))
);

CREATE INDEX idx_threats_model ON threats(threat_model_id);
CREATE INDEX idx_threats_asset ON threats(asset_id);
CREATE INDEX idx_threats_stride ON threats(stride_category_id);
CREATE INDEX idx_threats_risk_level ON threats(risk_level);
CREATE INDEX idx_threats_status ON threats(status);

-- Threat Mitigations table
CREATE TABLE threat_mitigations (
    id SERIAL PRIMARY KEY,
    threat_id INTEGER NOT NULL REFERENCES threats(id) ON DELETE CASCADE,
    mitigation_strategy VARCHAR(50) NOT NULL,
    mitigation_description TEXT NOT NULL,
    implementation_status VARCHAR(50) DEFAULT 'proposed',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to INTEGER REFERENCES users(id),
    estimated_effort VARCHAR(50),
    cost_estimate DECIMAL(12,2),
    implementation_date DATE,
    verification_method TEXT,
    effectiveness_rating VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CHECK (mitigation_strategy IN ('eliminate', 'reduce', 'transfer', 'accept')),
    CHECK (implementation_status IN ('proposed', 'approved', 'in_progress', 'implemented', 'verified', 'rejected')),
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CHECK (effectiveness_rating IN ('low', 'medium', 'high', 'excellent'))
);

CREATE INDEX idx_mitigations_threat ON threat_mitigations(threat_id);
CREATE INDEX idx_mitigations_status ON threat_mitigations(implementation_status);
CREATE INDEX idx_mitigations_assigned ON threat_mitigations(assigned_to);

-- =====================================================
-- ARCHITECTURE AND REPORTING
-- =====================================================

-- Architecture Diagrams table
CREATE TABLE architecture_diagrams (
    id SERIAL PRIMARY KEY,
    threat_model_id INTEGER REFERENCES threat_models(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    diagram_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size BIGINT,
    diagram_type VARCHAR(50),
    version VARCHAR(50) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (diagram_type IN ('data_flow', 'network', 'system_context', 'component', 'deployment', 'other'))
);

CREATE INDEX idx_diagrams_threat_model ON architecture_diagrams(threat_model_id);
CREATE INDEX idx_diagrams_organization ON architecture_diagrams(organization_id);

-- Compliance Reports table
CREATE TABLE compliance_reports (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES compliance_assessments(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    generated_by INTEGER NOT NULL REFERENCES users(id),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    file_format VARCHAR(20),
    file_size BIGINT,
    report_data JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (report_type IN ('executive_summary', 'detailed_assessment', 'gap_analysis', 'action_plan', 'custom')),
    CHECK (file_format IN ('pdf', 'html', 'docx', 'json', 'csv'))
);

CREATE INDEX idx_compliance_reports_assessment ON compliance_reports(assessment_id);
CREATE INDEX idx_compliance_reports_organization ON compliance_reports(organization_id);

-- Threat Reports table
CREATE TABLE threat_reports (
    id SERIAL PRIMARY KEY,
    threat_model_id INTEGER NOT NULL REFERENCES threat_models(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    generated_by INTEGER NOT NULL REFERENCES users(id),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    file_format VARCHAR(20),
    file_size BIGINT,
    report_data JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (report_type IN ('threat_summary', 'risk_assessment', 'mitigation_plan', 'stride_analysis', 'custom')),
    CHECK (file_format IN ('pdf', 'html', 'docx', 'json', 'csv'))
);

CREATE INDEX idx_threat_reports_model ON threat_reports(threat_model_id);
CREATE INDEX idx_threat_reports_organization ON threat_reports(organization_id);

-- =====================================================
-- AUDIT LOGS (track all changes)
-- =====================================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- SEED DATA: NIST CSF Functions
-- =====================================================

INSERT INTO nist_csf_functions (function_code, function_name, description, display_order) VALUES
    ('ID', 'Identify', 'Develop organizational understanding to manage cybersecurity risk to systems, people, assets, data, and capabilities', 1),
    ('PR', 'Protect', 'Develop and implement appropriate safeguards to ensure delivery of critical services', 2),
    ('DE', 'Detect', 'Develop and implement appropriate activities to identify the occurrence of a cybersecurity event', 3),
    ('RS', 'Respond', 'Develop and implement appropriate activities to take action regarding a detected cybersecurity incident', 4),
    ('RC', 'Recover', 'Develop and implement appropriate activities to maintain plans for resilience and restore capabilities or services impaired due to a cybersecurity incident', 5);

-- =====================================================
-- SEED DATA: STRIDE Categories
-- =====================================================

INSERT INTO stride_categories (category_code, category_name, description, display_order) VALUES
    ('S', 'Spoofing', 'Threats involving pretending to be something or someone other than yourself', 1),
    ('T', 'Tampering', 'Threats involving modifying something on disk, network, memory, or elsewhere', 2),
    ('R', 'Repudiation', 'Threats involving claiming that you did not do something or were not responsible', 3),
    ('I', 'Information Disclosure', 'Threats involving exposing information to people who should not have access', 4),
    ('D', 'Denial of Service', 'Threats involving preventing the system from providing service', 5),
    ('E', 'Elevation of Privilege', 'Threats involving gaining capabilities without proper authorization', 6);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_assessments_updated_at BEFORE UPDATE ON compliance_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_control_assessments_updated_at BEFORE UPDATE ON compliance_control_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_updated_at BEFORE UPDATE ON evidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_models_updated_at BEFORE UPDATE ON threat_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threats_updated_at BEFORE UPDATE ON threats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_mitigations_updated_at BEFORE UPDATE ON threat_mitigations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_architecture_diagrams_updated_at BEFORE UPDATE ON architecture_diagrams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF MIGRATION
-- =====================================================
