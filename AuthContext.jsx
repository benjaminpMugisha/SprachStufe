import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, getToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { token, user } = await api.register(name, email, password);
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { user } = await api.me();
    setUser(user);
    return user;
  }, []);

  // Used after endpoints (like billing upgrade/cancel) that return a freshly
  // signed token reflecting a change in account state (e.g. isPremium).
  const applyAuthResponse = useCallback((token, user) => {
    setToken(token);
    setUser(user);
    return user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refreshUser, applyAuthResponse }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
