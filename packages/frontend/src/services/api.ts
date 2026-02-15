import axios from 'axios';
import { UserRegistrationData, LoginCredentials, AuthResult } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken
          });
          
          if (response.data.success) {
            localStorage.setItem('authToken', response.data.token);
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (userData: UserRegistrationData): Promise<AuthResult> => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  },

  logout: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/api/auth/logout');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Logout failed'
      };
    }
  },

  updateLanguagePreference: async (language: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.put('/api/auth/language', { language });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Language update failed'
      };
    }
  }
};

export default api;