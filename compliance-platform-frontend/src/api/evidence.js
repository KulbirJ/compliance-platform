import apiClient from './client';

// Evidence API functions
export const uploadEvidence = (file, controlAssessmentId, evidenceQuality, description) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('control_assessment_id', controlAssessmentId);
  formData.append('evidence_quality', evidenceQuality);
  formData.append('description', description);
  
  return apiClient.post('/evidence/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getEvidenceList = (controlAssessmentId) => 
  apiClient.get('/evidence', {
    params: { controlAssessmentId },
  });

export const downloadEvidence = (id) => 
  apiClient.get(`/evidence/${id}/download`, {
    responseType: 'blob',
  });

export const deleteEvidence = (id) => apiClient.delete(`/evidence/${id}`);
