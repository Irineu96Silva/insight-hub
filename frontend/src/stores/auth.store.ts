
import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { LoginDto, User } from 'src/types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(credentials: LoginDto) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/auth/login', credentials);
        const data = response.data.data || response.data;
        const { access_token, user } = data;

        this.user = user;
        this.token = access_token;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', access_token);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        return true;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Falha no login';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async register(data: any) {
        this.loading = true;
        try {
            await api.post('/auth/register', data);
        } catch (error) {
            throw error;
        } finally {
            this.loading = false;
        }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    },

    async checkAuth() {
        if (!this.token) return false;
        try {
            const response = await api.get('/auth/me');
            const user = response.data.data || response.data;
            this.user = user;
            localStorage.setItem('user', JSON.stringify(user));
            return true;
        } catch {
            this.logout();
            return false;
        }
    }
  },
});
