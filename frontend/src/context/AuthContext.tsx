import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthResponse } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted auth state
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.login(username, password);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      throw new Error(msg);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.signup(username, email, password);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Convert Axios/FastAPI error to readable string.
 * Handles:
 * - 422 validation errors with detail: [{loc, msg, ...}, ...]
 * - detail as string
 * - generic fallbacks
 */
function extractErrorMessage(error: any): string {
  const status = error?.response?.status;
  const data = error?.response?.data;

  // FastAPI validation error (422)
  if (status === 422 && data?.detail && Array.isArray(data.detail)) {
    // Build a concise message from first error
    const d = data.detail[0];
    const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : undefined;
    const msg = d?.msg || 'Validation error';
    return field ? `${field}: ${msg}` : msg;
  }

  // FastAPI HTTPException detail
  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  // JSON {detail: {...}} rare case
  if (data?.detail && typeof data.detail === 'object') {
    // Try to stringify safely
    try {
      return Object.values(data.detail).join(', ');
    } catch {
      return 'Request failed. Please check your input.';
    }
  }

  // Generic Axios error message
  if (error?.message) return error.message;

  return 'Request failed. Please try again.';
}
