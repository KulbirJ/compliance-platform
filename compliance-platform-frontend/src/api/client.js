import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for login/register endpoints or if already on login page
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                          error.config?.url?.includes('/auth/register');
    const isOnLoginPage = window.location.pathname === '/login';
    
    if (error.response?.status === 401 && !isAuthEndpoint && !isOnLoginPage) {
      localStorage.removeItem('token');
      // Use setTimeout to avoid potential issues with navigation during API calls
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
