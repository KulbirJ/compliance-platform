import { create } from 'zustand';
import {
  getAssessments,
  getAssessmentById,
  getNistCsfFramework,
} from '../api/assessments';

const useAssessmentStore = create((set) => ({
  // State
  assessments: [],
  currentAssessment: null,
  nistFramework: null,
  loading: false,
  error: null,
  
  // Actions
  fetchAssessments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getAssessments();
      set({ assessments: response.data?.data || [], loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch assessments',
        loading: false 
      });
    }
  },
  
  fetchAssessmentById: async (id) => {
    console.log('Store: fetchAssessmentById called with id:', id);
    set({ loading: true, error: null });
    try {
      const response = await getAssessmentById(id);
      console.log('Store: API response:', response);
      console.log('Store: Setting currentAssessment to:', response.data?.data);
      set({ currentAssessment: response.data?.data, loading: false });
    } catch (error) {
      console.error('Store: Error fetching assessment:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch assessment',
        loading: false 
      });
    }
  },
  
  fetchNistFramework: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getNistCsfFramework();
      set({ nistFramework: response.data?.data || [], loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch NIST framework',
        loading: false 
      });
    }
  },
  
  setCurrentAssessment: (assessment) => {
    set({ currentAssessment: assessment });
  },
  
  addAssessment: (assessment) => {
    set((state) => ({ 
      assessments: [...state.assessments, assessment] 
    }));
  },
  
  updateAssessment: (id, data) => {
    set((state) => ({
      assessments: state.assessments.map((a) => 
        a.id === id ? { ...a, ...data } : a
      ),
    }));
  },
  
  deleteAssessment: (id) => {
    set((state) => ({
      assessments: state.assessments.filter((a) => a.id !== id),
    }));
  },
}));

export default useAssessmentStore;
