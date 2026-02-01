import axios from 'axios';

const authBase = import.meta.env.VITE_AUTH_API_URL;      // http://localhost:8080
const analyticsBase = import.meta.env.VITE_ANALYTICS_API_URL; // https://localhost:7188

export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // 1. Determine the Correct BaseURL
    // We check if the URL starts with our C# specific paths
    const isAnalyticsRequest = config.url.startsWith('/cost') || 
                               config.url.startsWith('/free-tier') ||
                               config.url.startsWith('/api/cost');

    if (isAnalyticsRequest) {
      config.baseURL = analyticsBase;
    } else {
      config.baseURL = authBase;
    }

    // 2. Attach Authorization Token
    // Use the key 'auth_token' to match your localStorage logic
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 3. Global 401 handling
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Only redirect if we aren't already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);