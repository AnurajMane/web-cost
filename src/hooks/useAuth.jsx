import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { authService } from '@/lib/authService';

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
      // Use the service we just updated
      const response = await authService.signInWithPassword(
        credentials.email, 
        credentials.password
      );
      
      const { user: userData, token } = response;
      
      // Handle the updates here in one place
      localStorage.setItem('auth_token', token);
      setUser(userData); // This triggers the UI update immediately
      
      navigate('/');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (signupData) => {
    setLoading(true);
    try {
      // Calls your Java backend: POST /auth/verify
      const response = await authService.verifyOtpAndSetPassword(
        signupData.email, 
        signupData.otp, 
        signupData.password, 
        signupData.username
      );
      
      const { user: userData, token } = response;
      
      // Immediately establish the session
      localStorage.setItem('auth_token', token);
      setUser(userData);
      
      navigate('/');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Signup failed' 
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