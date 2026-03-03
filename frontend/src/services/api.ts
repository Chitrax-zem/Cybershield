// frontend/src/services/api.ts

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type {
  AuthResponse,
  User,
  Scan,
  ScanDetail,
  ScanStats,
  UserStats,
} from '../types';

/* ==================== CONFIG ==================== */

// Build base URL from env, fallback to localhost
const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  'http://localhost:8000';

const API_BASE_URL = `${API_ORIGIN}/api`;

// 🔥 Increase timeout (Render cold start fix)
const REQUEST_TIMEOUT = 60000; // 60 seconds

// Retry configuration
const MAX_RETRIES = 1; // Prevent excessive retries
const RETRY_DELAY = 1500;

/* ==================== AXIOS INSTANCE ==================== */

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
});

/* ==================== REQUEST INTERCEPTOR ==================== */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem('access_token');

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Let browser handle FormData boundary
      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
      }
    } catch {
      // ignore localStorage issues
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/* ==================== RESPONSE INTERCEPTOR ==================== */

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: number;
    };

    /* ---------- Handle 401 ---------- */
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } catch {}

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

    /* ---------- Retry Logic (Cold Start / Network) ---------- */

    const shouldRetry =
      (error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        (error.response?.status && error.response.status >= 500)) &&
      (!originalRequest._retry || originalRequest._retry < MAX_RETRIES);

    if (shouldRetry) {
      originalRequest._retry = (originalRequest._retry || 0) + 1;

      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY)
      );

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

/* ==================== ERROR HELPER ==================== */

export function extractErrorMessage(error: any): string {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 422 && Array.isArray(data?.detail)) {
    const d = data.detail[0];
    const field = Array.isArray(d?.loc)
      ? d.loc[d.loc.length - 1]
      : undefined;
    const msg = d?.msg || 'Validation error';
    return field ? `${field}: ${msg}` : msg;
  }

  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (error.code === 'ECONNABORTED') {
    return 'Server is waking up. Please wait a moment and try again.';
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Network error. Please check your connection.';
  }

  return error?.message || 'Request failed. Please try again.';
}

/* ==================== AUTH APIs ==================== */

export const authApi = {
  signup: async (
    username: string,
    email: string,
    password: string,
    role: string = 'user'
  ): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      '/auth/signup',
      { username, email, password, role }
    );
    return response.data;
  },

  login: async (
    username: string,
    password: string
  ): Promise<AuthResponse> => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post<AuthResponse>(
      '/auth/login',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

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

/* ==================== SCAN APIs ==================== */

export const scanApi = {
  uploadFile: async (file: File): Promise<Scan> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<Scan>(
      '/scan/upload',
      formData
    );

    return response.data;
  },

  startScan: async (scanId: string): Promise<Scan> => {
    const response = await api.post<Scan>(
      `/scan/${scanId}/start`
    );
    return response.data;
  },

  getScan: async (scanId: string): Promise<ScanDetail> => {
    const response = await api.get<ScanDetail>(
      `/scan/${scanId}`
    );
    return response.data;
  },

  getMyHistory: async (
    skip = 0,
    limit = 20
  ): Promise<Scan[]> => {
    const response = await api.get<Scan[]>(
      `/scan/history/my`,
      { params: { skip, limit } }
    );
    return response.data;
  },

  deleteScan: async (scanId: string): Promise<void> => {
    await api.delete(`/scan/${scanId}`);
  },
};

/* ==================== ANALYTICS APIs ==================== */

export const analyticsApi = {
  getStats: async (): Promise<ScanStats> => {
    const response = await api.get<ScanStats>(
      '/analytics/stats'
    );
    return response.data;
  },

  getMyStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>(
      '/analytics/my-stats'
    );
    return response.data;
  },
};

export default api;
