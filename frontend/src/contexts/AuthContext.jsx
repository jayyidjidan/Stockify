import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { ROLES } from '../utils/constants';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockify_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('stockify_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('stockify_user', JSON.stringify(res.data.data));
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.data?.success) {
      const { token: newToken, user: userData } = res.data.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('stockify_token', newToken);
      localStorage.setItem('stockify_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: res.data?.message || 'Login failed' };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('stockify_token');
      localStorage.removeItem('stockify_user');
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem('stockify_user', JSON.stringify(merged));
  };

  const isAdmin = () => user?.role === ROLES.ADMIN;
  const isStaff = () => user?.role === ROLES.STAFF;
  const isManager = () => user?.role === ROLES.MANAGER;

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAdmin,
    isStaff,
    isManager,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
