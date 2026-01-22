export const COMPLIANCE_FRAMEWORKS = [
  { value: 'nist-csf', label: 'NIST Cybersecurity Framework' },
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
