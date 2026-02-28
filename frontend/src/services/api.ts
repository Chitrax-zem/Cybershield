// frontend/src/services/api.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { AuthResponse, User, Scan, ScanDetail, ScanStats, UserStats } from '../types';

// Build base URL from env, fallback to localhost
const API_ORIGIN =
  (import.meta as any)?.env?.VITE_API_URL
    ? String((import.meta as any).env.VITE_API_URL).replace(/\/$/, '')
    : 'http://localhost:8000';

const API_BASE_URL = `${API_ORIGIN}/api`;

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
});

// Request interceptor: add token and handle FormData content-type
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Let the browser set multipart/form-data boundary for FormData
      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
      }
    } catch {
      // Ignore localStorage errors in non-browser contexts
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: handle 401s, avoid redirect loops
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: number };
    
    // Handle 401 unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Retry logic for network errors and 5xx errors
    if (
      (error.code === 'ECONNABORTED' || 
       error.code === 'ERR_NETWORK' || 
       (error.response?.status && error.response.status >= 500)) &&
      (!originalRequest._retry || originalRequest._retry < MAX_RETRIES)
    ) {
      originalRequest._retry = (originalRequest._retry || 0) + 1;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

/**
 * Extract readable error message from Axios error
 */
function extractErrorMessage(error: any): string {
  const status = error?.response?.status;
  const data = error?.response?.data;

  // 422 Validation error (FastAPI/Pydantic)
  if (status === 422 && Array.isArray(data?.detail)) {
    const d = data.detail[0];
    const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : undefined;
    const msg = d?.msg || 'Validation error';
    return field ? `${field}: ${msg}` : msg;
  }

  // Generic "detail" message from backend
  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  // Network timeout
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // Network error
  if (error.code === 'ERR_NETWORK') {
    return 'Network error. Please check your connection.';
  }

  // Fallback to error.message
  if (error?.message) {
    return error.message;
  }

  return 'Request failed. Please try again.';
}

// ==================== Auth APIs ====================
export const authApi = {
  signup: async (username: string, email: string, password: string, role: string = 'user'): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      '/auth/signup',
      { username, email, password, role }
    );
    return response.data;
  },

  // Use application/x-www-form-urlencoded for FastAPI OAuth2PasswordRequestForm
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post<AuthResponse>('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

// ==================== Scan APIs ====================
export const scanApi = {
  uploadFile: async (file: File): Promise<Scan> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<Scan>('/scan/upload', formData);
    return response.data;
  },

  startScan: async (scanId: string): Promise<Scan> => {
    const response = await api.post<Scan>(`/scan/${scanId}/start`);
    return response.data;
  },

  getScan: async (scanId: string): Promise<ScanDetail> => {
    const response = await api.get<ScanDetail>(`/scan/${scanId}`);
    return response.data;
  },

  getMyHistory: async (skip: number = 0, limit: number = 20): Promise<Scan[]> => {
    const response = await api.get<Scan[]>(`/scan/history/my?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  deleteScan: async (scanId: string): Promise<void> => {
    await api.delete(`/scan/${scanId}`);
  },
};

// ==================== Analytics APIs ====================
export const analyticsApi = {
  getStats: async (): Promise<ScanStats> => {
    const response = await api.get<ScanStats>('/analytics/stats');
    return response.data;
  },

  getTrends: async (days: number = 30): Promise<Record<string, any>> => {
    const response = await api.get(`/analytics/trends?days=${days}`);
    return response.data;
  },

  getUsers: async (): Promise<any> => {
    const response = await api.get('/analytics/users');
    return response.data;
  },

  getTopMalware: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get(`/analytics/top-malware?limit=${limit}`);
    return response.data;
  },

  getRecentScans: async (limit: number = 20): Promise<any[]> => {
    const response = await api.get(`/analytics/recent-scans?limit=${limit}`);
    return response.data;
  },

  getMyStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/analytics/my-stats');
    return response.data;
  },
};

export default api;
export { extractErrorMessage };