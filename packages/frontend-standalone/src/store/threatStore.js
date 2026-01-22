import { create } from 'zustand';
import {
  getThreatModels,
  getThreatModelById,
  getStrideCategories,
  getAssets,
  getThreats,
} from '../api/threats';

const useThreatStore = create((set) => ({
  // State
  threatModels: [],
  currentThreatModel: null,
  strideCategories: [],
  assets: [],
  threats: [],
  loading: false,
  error: null,
  
  // Actions
  fetchThreatModels: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getThreatModels();
      set({ threatModels: response.data?.data || [], loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch threat models',
        loading: false 
      });
    }
  },
  
  fetchThreatModelById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await getThreatModelById(id);
      set({ currentThreatModel: response.data?.data, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch threat model',
        loading: false 
      });
    }
  },
  
  fetchStrideCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getStrideCategories();
      set({ strideCategories: response.data?.data || [], loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch STRIDE categories',
        loading: false 
      });
    }
  },
  
  fetchAssets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getAssets();
      set({ assets: response.data?.data || [], loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch assets',
        loading: false 
      });
    }
  },
  
  fetchThreats: async (threatModelId) => {
    set({ loading: true, error: null });
    try {
      const response = await getThreats(threatModelId);
      set({ threats: response.data?.data || [], loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch threats',
        loading: false 
      });
    }
  },
  
  setCurrentThreatModel: (threatModel) => {
    set({ currentThreatModel: threatModel });
  },
  
  addThreatModel: (threatModel) => {
    set((state) => ({ 
      threatModels: [...state.threatModels, threatModel] 
    }));
  },
  
  addThreat: (threat) => {
    set((state) => ({ 
      threats: [...state.threats, threat] 
    }));
  },
}));

export default useThreatStore;
