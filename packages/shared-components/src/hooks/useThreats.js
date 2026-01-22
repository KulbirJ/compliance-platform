import { useState, useCallback } from 'react';

/**
 * useThreats - Hook for managing threat models and threats
 * Expects an API adapter to be passed in
 * 
 * @param {Object} apiAdapter - API adapter (REST or SharePoint)
 */
export const useThreats = (apiAdapter) => {
  const [threatModels, setThreatModels] = useState([]);
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchThreatModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdapter.getThreatModels();
      setThreatModels(response.data || response);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [apiAdapter]);

  const fetchThreatModelById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdapter.getThreatModelById(id);
      return response.data || response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiAdapter]);

  const createThreatModel = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdapter.createThreatModel(data);
      await fetchThreatModels(); // Refresh list
      return response.data || response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiAdapter, fetchThreatModels]);

  const createThreat = useCallback(async (threatModelId, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdapter.createThreat(threatModelId, data);
      return response.data || response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiAdapter]);

  return {
    threatModels,
    threats,
    loading,
    error,
    fetchThreatModels,
    fetchThreatModelById,
    createThreatModel,
    createThreat,
  };
};

export default useThreats;
