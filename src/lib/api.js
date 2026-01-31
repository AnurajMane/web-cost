import axios from 'axios';

// Get the base URLs from your .env file
const authBase = import.meta.env.VITE_AUTH_API_URL;
const analyticsBase = import.meta.env.VITE_ANALYTICS_API_URL;

export const api = axios.create({
  // Leave baseURL empty here because we will handle it in the interceptor
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Logic to route the request to the correct service
    if (config.url.startsWith('/costs')) {
      config.baseURL = analyticsBase; // Send to C# Service
    } else {
      config.baseURL = authBase;      // Send to Java Service (Auth/Accounts)
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle expired tokens (401 errors)
api.interceptors.response.use(
  (response) => response.data, // This simplifies your calls (no need for .data everywhere)
  (error) => {
    if (error.response?.status === 401) {
      // If the token is invalid or expired, log the user out
      localStorage.removeItem('auth_token');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);