import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token is still valid by fetching user data
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      // Token is invalid, clear storage
      clearAuthData();
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('token'); // Also remove any old token key
    setUser(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      
      // Store token
      localStorage.setItem(TOKEN_KEY, response.access_token);
      
      // Store user data
      if (response.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setUser(response.user);
      } else {
        // If user data not in response, fetch it
        const userData = await authApi.getMe();
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error: any) {
      // Clear any partial data
      clearAuthData();
      throw new Error(error?.response?.data?.detail || error?.message || 'Login failed');
    }
  }, [clearAuthData]);

  const signup = useCallback(async (username: string, email: string, password: string) => {
    try {
      const response = await authApi.signup(username, email, password);
      
      // Store token
      localStorage.setItem(TOKEN_KEY, response.access_token);
      
      // Store user data
      if (response.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setUser(response.user);
      } else {
        // If user data not in response, fetch it
        const userData = await authApi.getMe();
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error: any) {
      // Clear any partial data
      clearAuthData();
      throw new Error(error?.response?.data?.detail || error?.message || 'Signup failed');
    }
  }, [clearAuthData]);

  const logout = useCallback(() => {
    // Clear all auth data
    clearAuthData();
    
    // Call logout API (optional, can fail silently)
    authApi.logout().catch(() => {
      // Ignore logout API errors
    });
  }, [clearAuthData]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};