import { defineStore } from 'pinia';
import { api } from 'boot/axios';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: null as any,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchSummary() {
      this.loading = true;
      try {
        const response = await api.get('/dashboard/summary');
        this.summary = response.data;
      } catch (err: any) {
        this.error = err.message || 'Error fetching summary';
      } finally {
        this.loading = false;
      }
    },
  },
});
