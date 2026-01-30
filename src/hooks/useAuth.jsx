import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Validate the current session on load
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Calls your new backend: GET /auth/me
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (error) {
      console.error("Authentication check failed:", error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      // POST /auth/login returns { user, token }
      const { user: userData, token } = await api.post('/auth/login', credentials);
      
      localStorage.setItem('auth_token', token);
      setUser(userData);
      navigate('/');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}