
import { defineStore } from 'pinia';
import { endpointsService } from 'src/services/endpoints.service';
import type { Endpoint, CollectedData } from 'src/types';

export const useEndpointsStore = defineStore('endpoints', {
  state: () => ({
    endpoints: [] as Endpoint[], // Global list
    systemEndpoints: [] as Endpoint[], // For a specific system
    currentEndpoint: null as Endpoint | null,
    collectedData: [] as CollectedData[], // Coletados do endpoint atual
    loading: false,
    collecting: false,
    error: null as string | null,
  }),

  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        this.endpoints = await endpointsService.getAll();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchBySystem(systemId: string) {
      this.loading = true;
      try {
        this.systemEndpoints = await endpointsService.getBySystem(systemId);
      } catch (err: any) {
        this.error = err.message || 'Erro ao buscar endpoints do sistema';
      } finally {
        this.loading = false;
      }
    },

    async createEndpoint(endpoint: Partial<Endpoint>) {
      this.loading = true;
      try {
        const newEndpoint = await endpointsService.create(endpoint);
        this.endpoints.push(newEndpoint);
        this.systemEndpoints.push(newEndpoint);
        return newEndpoint;
      } catch (err: any) {
        this.error = err.message || 'Erro ao criar endpoint';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateEndpoint(id: string, updates: Partial<Endpoint>) {
      this.loading = true;
      try {
        const updated = await endpointsService.update(id, updates);
        const idx = this.endpoints.findIndex(e => e.id === id);
        if (idx !== -1) this.endpoints[idx] = updated;
        const sIdx = this.systemEndpoints.findIndex(e => e.id === id);
        if (sIdx !== -1) this.systemEndpoints[sIdx] = updated;
        return updated;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteEndpoint(id: string) {
      this.loading = true;
      try {
        await endpointsService.delete(id);
        this.endpoints = this.endpoints.filter(e => e.id !== id);
        this.systemEndpoints = this.systemEndpoints.filter(e => e.id !== id);
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async collectData(id: string, params: Record<string, any>) {
      this.collecting = true;
      try {
        const result = await endpointsService.collect(id, params);
        return result;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.collecting = false;
      }
    },

    async fetchCollectedData(id: string, params?: Record<string, any>) {
      this.loading = true;
      try {
        this.collectedData = await endpointsService.getCollectedData(id, params);
        return this.collectedData;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },
  }
});
