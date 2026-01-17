import apiClient from './client';

// Compliance Assessment API functions
export const createAssessment = (data) => apiClient.post('/assessments', data);

export const getAssessments = () => apiClient.get('/assessments');

export const getAssessmentById = (id) => apiClient.get(`/assessments/${id}`);

export const updateAssessment = (id, data) => apiClient.put(`/assessments/${id}`, data);

export const deleteAssessment = (id) => apiClient.delete(`/assessments/${id}`);

export const getAssessmentProgress = (id) => apiClient.get(`/assessments/${id}/progress`);

export const getNistCsfFramework = () => apiClient.get('/nist-csf/framework');

export const assessControl = (assessmentId, data) => 
  apiClient.post(`/assessments/${assessmentId}/controls`, data);

export const getControlAssessments = (assessmentId) => 
  apiClient.get(`/assessments/${assessmentId}/controls`);
