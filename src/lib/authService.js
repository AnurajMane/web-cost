import { api } from './api';

/**
 * Service to handle authentication for the AWS Cost Intelligence platform.
 * Translated from TypeScript to JavaScript to support the new backend architecture.
 */
export const authService = {
  /**
   * Logs in a user with email and password.
   * Targets the Java/C# backend: POST /auth/login
   */
  async signInWithPassword(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      //commented the localStorage.setItem line here. 
      //The service should only be responsible for talking to the server and returning the data.
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  /**
   * Sends a one-time password to the user's email.
   * Targets the backend: POST /auth/send-otp
   */
  async sendOtp(email) {
    try {
      return await api.post('/auth/send-otp', { email });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  },

  /**
   * Verifies OTP and completes the registration/password set process.
   * Targets the backend: POST /auth/verify
   */
  async verifyOtpAndSetPassword(email, otp, password, username) {
    try {
      const response = await api.post('/auth/verify', {
        email,
        otp,
        password,
        username,
      });
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Verification failed');
    }
  },

  /**
   * Clears local authentication state.
   */
  logout() {
    localStorage.removeItem('auth_token');
    // Optional: Add a backend call to invalidate the session if needed
  },

  /**
   * Helper to check if the user is currently authenticated.
   */
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }
};