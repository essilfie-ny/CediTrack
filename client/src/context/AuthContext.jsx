import React, { createContext, useState, useEffect } from 'react';
import { get, post } from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ceditrack_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const { data } = await get('/auth/me');
          setUser(data);
        } catch (error) {
          console.error('Failed to fetch user', error);
          setToken(null);
          localStorage.removeItem('ceditrack_token');
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await post('/auth/login', { email, password });
    setToken(data.token);
    localStorage.setItem('ceditrack_token', data.token);
    setUser(data.user);
  };

  const register = async (name, email, password) => {
    const { data } = await post('/auth/register', { name, email, password });
    setToken(data.token);
    localStorage.setItem('ceditrack_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ceditrack_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
