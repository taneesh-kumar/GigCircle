import axios from 'axios';

/**
 * Shared Axios instance for all API calls.
 * Base URL is "/api" which the Vite dev server proxies to http://localhost:8080.
 */
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

export default apiClient;
