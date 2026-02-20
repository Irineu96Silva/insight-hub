
import { api } from './api.service';
import type { Endpoint, CollectedData } from 'src/types';

export const endpointsService = {
  async getAll(): Promise<Endpoint[]> {
    const { data } = await api.get<Endpoint[]>('/endpoints');
    return data;
  },

  async getBySystem(systemId: string): Promise<Endpoint[]> {
    const { data } = await api.get<Endpoint[]>(`/endpoints/system/${systemId}`);
    return data;
  },

  async getById(id: string): Promise<Endpoint> {
    const { data } = await api.get<Endpoint>(`/endpoints/${id}`);
    return data;
  },

  async create(endpoint: Partial<Endpoint>): Promise<Endpoint> {
    const { data } = await api.post<Endpoint>('/endpoints', endpoint);
    return data;
  },

  async update(id: string, endpoint: Partial<Endpoint>): Promise<Endpoint> {
    const { data } = await api.patch<Endpoint>(`/endpoints/${id}`, endpoint);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/endpoints/${id}`);
  },

  async test(id: string, params?: any): Promise<any> {
    const { data } = await api.post(`/endpoints/${id}/test`, { params });
    return data;
  },

  /**
   * Coleta dados do endpoint com cache inteligente.
   */
  async collect(id: string, params: Record<string, any>): Promise<CollectedData> {
    const { data } = await api.post<CollectedData>(`/endpoints/${id}/collect`, { params });
    return data;
  },

  /**
   * Busca dados coletados de um endpoint.
   */
  async getCollectedData(id: string, params?: Record<string, any>): Promise<CollectedData[]> {
    const queryParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        queryParams[key] = String(val);
      });
    }
    const { data } = await api.get<CollectedData[]>(`/endpoints/${id}/data`, { params: queryParams });
    return data;
  },

  /**
   * Busca TODOS os dados coletados de um sistema.
   */
  async getCollectedBySystem(systemId: string, limit = 50): Promise<CollectedData[]> {
    const { data } = await api.get<CollectedData[]>(`/data-collector/system/${systemId}`, { params: { limit } });
    return data;
  },

  /**
   * URL de download CSV autenticado.
   */
  getDownloadCsvUrl(collectedId: string): string {
    const baseUrl = (api.defaults.baseURL || '').replace(/\/+$/, '');
    return `${baseUrl}/data-collector/download/${collectedId}/csv`;
  },

  /**
   * URL de download JSON autenticado.
   */
  getDownloadJsonUrl(collectedId: string): string {
    const baseUrl = (api.defaults.baseURL || '').replace(/\/+$/, '');
    return `${baseUrl}/data-collector/download/${collectedId}/json`;
  },
};
