// frontend/src/services/api.ts
import axios, { AxiosInstance } from 'axios';
import type { AuthResponse, User, Scan, ScanDetail, ScanStats, UserStats } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add token and handle FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  // Add authorization header if token exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // CRITICAL: Don't force JSON content-type on FormData requests
  // Let the browser set multipart/form-data with proper boundary
  if (config.data instanceof FormData) {
    // Remove the default application/json header
    delete config.headers['Content-Type'];
  }

  return config;
});

// Response interceptor: handle 401 and global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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

  // 422 Validation error (Pydantic)
  if (status === 422 && Array.isArray(data?.detail)) {
    const d = data.detail[0];
    const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : undefined;
    const msg = d?.msg || 'Validation error';
    return field ? `${field}: ${msg}` : msg;
  }

  // Generic detail string
  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  // Fallback to error message
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

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post<AuthResponse>('/auth/login', formData);
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
    console.log('📤 Uploading file:', file.name, file.size, 'bytes');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<Scan>('/scan/upload', formData);
      console.log('✅ Upload successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Upload failed:', error?.response?.status, error?.response?.data);
      throw error;
    }
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
