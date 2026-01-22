// REST API Adapter for standalone frontend
import axios from 'axios';

export class RestApiAdapter {
  constructor(config) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: config.headers || {}
    });
  }

  // Assessments
  async getAssessments() {
    const response = await this.client.get('/assessments');
    return response.data;
  }

  async getAssessmentById(id) {
    const response = await this.client.get(`/assessments/${id}`);
    return response.data;
  }

  async createAssessment(data) {
    const response = await this.client.post('/assessments', data);
    return response.data;
  }

  async updateAssessment(id, data) {
    const response = await this.client.put(`/assessments/${id}`, data);
    return response.data;
  }

  async deleteAssessment(id) {
    const response = await this.client.delete(`/assessments/${id}`);
    return response.data;
  }

  // Control Assessments
  async createControlAssessment(assessmentId, data) {
    const response = await this.client.post(`/assessments/${assessmentId}/controls`, data);
    return response.data;
  }

  async updateControlAssessment(assessmentId, controlId, data) {
    const response = await this.client.put(`/assessments/${assessmentId}/controls/${controlId}`, data);
    return response.data;
  }

  // Threats
  async getThreatModels() {
    const response = await this.client.get('/threat-models');
    return response.data;
  }

  async getThreatModelById(id) {
    const response = await this.client.get(`/threat-models/${id}`);
    return response.data;
  }

  async createThreatModel(data) {
    const response = await this.client.post('/threat-models', data);
    return response.data;
  }

  async createThreat(threatModelId, data) {
    const response = await this.client.post(`/threat-models/${threatModelId}/threats`, data);
    return response.data;
  }

  // Evidence
  async getEvidence(assessmentId = null) {
    const url = assessmentId ? `/evidence?assessment_id=${assessmentId}` : '/evidence';
    const response = await this.client.get(url);
    return response.data;
  }

  async uploadEvidence(formData) {
    const response = await this.client.post('/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async deleteEvidence(evidenceId) {
    const response = await this.client.delete(`/evidence/${evidenceId}`);
    return response.data;
  }
}
