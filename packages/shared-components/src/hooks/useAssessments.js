import { useState, useCallback } from 'react';

/**
 * useAssessments - Hook for managing assessments
 * Expects an API adapter to be passed in
 * 
 * @param {Object} apiAdapter - API adapter (REST or SharePoint)
 */
export const useAssessments = (apiAdapter) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdapter.getAssessments();
      setAssessments(response.data || response);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [apiAdapter]);

  const fetchAssessmentById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdapter.getAssessmentById(id);
      return response.data || response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiAdapter]);

  const createAssessment = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdapter.createAssessment(data);
      await fetchAssessments(); // Refresh list
      return response.data || response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiAdapter, fetchAssessments]);

  const updateAssessment = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdapter.updateAssessment(id, data);
      await fetchAssessments(); // Refresh list
      return response.data || response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiAdapter, fetchAssessments]);

  const deleteAssessment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await apiAdapter.deleteAssessment(id);
      await fetchAssessments(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiAdapter, fetchAssessments]);

  return {
    assessments,
    loading,
    error,
    fetchAssessments,
    fetchAssessmentById,
    createAssessment,
    updateAssessment,
    deleteAssessment,
  };
};

export default useAssessments;
