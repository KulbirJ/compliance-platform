import apiClient from './client';

// Compliance Report API functions
export const generateComplianceReport = (assessmentId) => 
  apiClient.post('/reports/compliance', { assessmentId });

export const getComplianceReports = (assessmentId) => 
  apiClient.get('/reports/compliance', {
    params: { assessmentId },
  });

export const downloadComplianceReport = (id) => 
  apiClient.get(`/reports/compliance/${id}/download`, {
    responseType: 'blob',
  });

// Threat Report API functions
export const generateThreatReport = (threatModelId) => 
  apiClient.post('/reports/threat', { threatModelId });

export const getThreatReports = (threatModelId) => 
  apiClient.get('/reports/threat', {
    params: { threatModelId },
  });

export const downloadThreatReport = (id) => 
  apiClient.get(`/reports/threat/${id}/download`, {
    responseType: 'blob',
  });
