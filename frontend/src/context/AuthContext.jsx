import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService, userService } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [authReady, setAuthReady] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('shoplite:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('shoplite:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setAuthReady(true);
      return;
    }

    localStorage.setItem('token', token);
    userService.getProfile()
      .then((data) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setAuthReady(true));
  }, [token, logout]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthReady(true);
    return data.user;
  };

  const register = (name, email, password) => authService.register(name, email, password);

  const updateUser = (nextUser) => setUser(nextUser);

  const value = useMemo(
    () => ({ user, token, authReady, login, logout, register, updateUser }),
    [user, token, authReady, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
