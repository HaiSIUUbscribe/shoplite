import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService, userService } from '../services/api';

export const AuthContext = createContext(null);

const STORED_USER_KEY = 'shoplite_user';
let restoreSessionPromise = null;

function readStoredUser() {
  try {
    const value = JSON.parse(localStorage.getItem(STORED_USER_KEY) || 'null');
    if (!value?.id || !value?.email || !['client', 'admin'].includes(value.role)) return null;
    return value;
  } catch {
    return null;
  }
}

function storeUser(user) {
  if (user) localStorage.setItem(STORED_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORED_USER_KEY);
}

function restoreSession() {
  if (!restoreSessionPromise) {
    const storedToken = localStorage.getItem('token');
    const hasSessionHint = Boolean(readStoredUser());
    let request = Promise.resolve({ user: null });
    if (storedToken) request = userService.getProfile();
    else if (hasSessionHint) request = authService.refresh();

    restoreSessionPromise = request.finally(() => {
      restoreSessionPromise = null;
    });
  }
  return restoreSessionPromise;
}

export function AuthProvider({ children }) {
  const [cachedUser, setCachedUser] = useState(readStoredUser);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    storeUser(null);
    setCachedUser(null);
    setUser(null);
    setAuthReady(true);
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* Clear the local session even if the API is unavailable. */ }
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('shoplite:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('shoplite:unauthorized', handleUnauthorized);
    };
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    const initializeSession = async () => {
      try {
        const data = await restoreSession();

        if (!active) return;
        if (data.token) localStorage.setItem('token', data.token);
        const restoredUser = data.user || null;
        storeUser(restoredUser);
        setCachedUser(restoredUser);
        setUser(restoredUser);
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setAuthReady(true);
      }
    };

    initializeSession();
    return () => { active = false; };
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.token);
    storeUser(data.user);
    setCachedUser(data.user);
    setUser(data.user);
    setAuthReady(true);
    return data.user;
  }, []);

  const socialLogin = useCallback(async (tokenProvider, provider) => {
    const data = await authService.socialLogin(tokenProvider, provider);
    localStorage.setItem('token', data.token);
    storeUser(data.user);
    setCachedUser(data.user);
    setUser(data.user);
    setAuthReady(true);
    return data.user;
  }, []);

  const register = useCallback(
    (name, email, password) => authService.register(name, email, password),
    []
  );

  const updateUser = useCallback((nextUser) => {
    storeUser(nextUser);
    setCachedUser(nextUser);
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({ user, cachedUser, authReady, login, socialLogin, logout, register, updateUser }),
    [authReady, cachedUser, login, logout, register, socialLogin, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
