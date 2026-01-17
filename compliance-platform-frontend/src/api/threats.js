import apiClient from './client';

// Threat Model API functions
export const createThreatModel = (data) => apiClient.post('/threat-models', data);

export const getThreatModels = () => apiClient.get('/threat-models');

export const getThreatModelById = (id) => apiClient.get(`/threat-models/${id}`);

export const updateThreatModel = (id, data) => apiClient.put(`/threat-models/${id}`, data);

export const deleteThreatModel = (id) => apiClient.delete(`/threat-models/${id}`);

export const getStrideCategories = () => apiClient.get('/stride/categories');

// Asset API functions
export const createAsset = (data) => apiClient.post('/assets', data);

export const getAssets = () => apiClient.get('/assets');

export const linkAsset = (threatModelId, assetId) => 
  apiClient.post(`/threat-models/${threatModelId}/assets/${assetId}`);

// Threat API functions
export const createThreat = (data) => apiClient.post('/threats', data);

export const getThreats = (threatModelId) => 
  apiClient.get(`/threat-models/${threatModelId}/threats`);

// Mitigation API functions
export const createMitigation = (threatId, data) => 
  apiClient.post(`/threats/${threatId}/mitigations`, data);

export const getMyMitigations = () => apiClient.get('/mitigations/my');
