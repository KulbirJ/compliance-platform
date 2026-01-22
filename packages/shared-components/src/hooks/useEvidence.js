import { useState, useCallback } from 'react';

/**
 * useEvidence - Hook for managing evidence
 * Expects an API adapter to be passed in
 * 
 * @param {Object} apiAdapter - API adapter (REST or SharePoint)
 */
export const useEvidence = (apiAdapter) => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvidence = useCallback(async (assessmentId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdapter.getEvidence(assessmentId);
      setEvidence(response.data || response);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [apiAdapter]);

  const uploadEvidence = useCallback(async (file, controlAssessmentId, quality, description) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('evidence', file);
      formData.append('control_assessment_id', controlAssessmentId);
      formData.append('evidence_quality', quality);
      formData.append('description', description);

      const response = await apiAdapter.uploadEvidence(formData);
      await fetchEvidence(); // Refresh list
      return response.data || response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiAdapter, fetchEvidence]);

  const deleteEvidence = useCallback(async (evidenceId) => {
    setLoading(true);
    setError(null);
    try {
      await apiAdapter.deleteEvidence(evidenceId);
      await fetchEvidence(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiAdapter, fetchEvidence]);

  return {
    evidence,
    loading,
    error,
    fetchEvidence,
    uploadEvidence,
    deleteEvidence,
  };
};

export default useEvidence;
