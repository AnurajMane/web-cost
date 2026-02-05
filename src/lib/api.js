import axios from 'axios';

// 1. Define the base URLs for two backends
const JAVA_BASE_URL = "http://localhost:8080"; // Java: Auth & Gemini AI
const CSHARP_BASE_URL = "http://localhost:5022"; // C#: AWS Cost Data

// 2. Creating Axios instance for each backend
export const javaApi = axios.create({ baseURL: JAVA_BASE_URL });
export const csharpApi = axios.create({ baseURL: CSHARP_BASE_URL });

// 3. Interceptor to add JWT token to every outgoing request
const addAuthToken = (config) => {
    const token = localStorage.getItem('token'); // Assuming to store it as 'token'
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Sets "Bearer <token>"
    }
    return config;
};

// Applying the interceptor to both instances
javaApi.interceptors.request.use(addAuthToken);
csharpApi.interceptors.request.use(addAuthToken);

// --- API FUNCTIONS ---

// A. Auth & AI (Java Backend)
export const login = (credentials) => javaApi.post('/auth/login', credentials);
export const signup = (userData) => javaApi.post('/auth/signup', userData);
export const getGeminiResponse = (message) => javaApi.post('/assistant/chat', { message });

// B. AWS Data (C# Backend)
export const getMonthlyCosts = () => csharpApi.get('/api/Cost/monthly-summary');
export const getFreeTierUsage = () => csharpApi.get('/api/Cost/free-tier-status');

export default { javaApi, csharpApi };