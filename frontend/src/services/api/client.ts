import axios from 'axios';

/**
 * Shared Axios instance for all API calls.
 * Base URL is "/api" which the Vite dev server proxies to http://localhost:8080.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

// Request interceptor: attach JWT token if present in sessionStorage
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
