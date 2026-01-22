import { create } from 'zustand';
import * as authApi from '../api/auth';

const useAuthStore = create((set) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  
  // Actions
  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ 
      token, 
      user, 
      isAuthenticated: true,
      isLoading: false
    });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      isLoading: false
    });
  },
  
  setUser: (user) => {
    set({ user });
  },
  
  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Fetch user data with the stored token
        const response = await authApi.getCurrentUser();
        const userData = response.data?.data || response.data;
        set({ 
          token, 
          user: userData,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        // Only clear auth on 401 (invalid/expired token)
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          set({ 
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        } else {
          // For other errors, keep the token but set loading false
          // User might still be authenticated, just a temporary API issue
          set({ 
            token,
            isAuthenticated: true,
            isLoading: false
          });
        }
      }
    } else {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
