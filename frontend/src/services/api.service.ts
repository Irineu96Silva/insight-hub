import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { Notify } from 'quasar';
import { useAuthStore } from 'stores/auth.store';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Add Authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Auto-unwrap backend wrapper { success, data, timestamp }
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error: AxiosError) => {
    const authStore = useAuthStore();
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (authStore.user) {
        Notify.create({
          type: 'warning',
          message: 'Sessão expirada. Faça login novamente.',
        });
        authStore.logout();
      }
    } else {
        // Generic error handler
        const message = (error.response?.data as any)?.message || error.message || 'Erro desconhecido';
        Notify.create({
            type: 'negative',
            message: Array.isArray(message) ? message.join(', ') : message,
        });
    }
    return Promise.reject(error);
  }
);

export { api };
