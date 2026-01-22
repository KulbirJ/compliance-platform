export const COMPLIANCE_FRAMEWORKS = [
  { value: 'nist-csf', label: 'NIST Cybersecurity Framework' },
  { value: 'nist-csf-2.0', label: 'NIST CSF 2.0' },
  { value: 'iso27001', label: 'ISO 27001' },
  { value: 'soc2', label: 'SOC 2' },
  { value: 'hipaa', label: 'HIPAA' },
  { value: 'gdpr', label: 'GDPR' },
];

export const THREAT_CATEGORIES = [
  'Spoofing',
  'Tampering',
  'Repudiation',
  'Information Disclosure',
  'Denial of Service',
  'Elevation of Privilege',
];

export const RISK_LEVELS = [
  { value: 'low', label: 'Low', color: '#4caf50' },
  { value: 'medium', label: 'Medium', color: '#ff9800' },
  { value: 'high', label: 'High', color: '#f44336' },
  { value: 'critical', label: 'Critical', color: '#9c27b0' },
];

export const ASSESSMENT_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export const CONTROL_STATUS = {
  fully_implemented: { label: 'Fully Implemented', color: 'success' },
  largely_implemented: { label: 'Largely Implemented', color: 'info' },
  partially_implemented: { label: 'Partially Implemented', color: 'warning' },
  not_implemented: { label: 'Not Implemented', color: 'error' },
  not_applicable: { label: 'Not Applicable', color: 'default' },
};

export const EVIDENCE_QUALITY = [
  { value: 'high', label: 'High Quality' },
  { value: 'medium', label: 'Medium Quality' },
  { value: 'low', label: 'Low Quality' },
];
