import apiClient from './client';

// Authentication API functions
export const login = (credentials) => apiClient.post('/auth/login', credentials);

export const register = (userData) => apiClient.post('/auth/register', userData);

export const getCurrentUser = () => apiClient.get('/auth/me');
