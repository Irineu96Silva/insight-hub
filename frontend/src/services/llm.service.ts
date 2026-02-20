import { api } from 'boot/axios';

export interface LlmProviderData {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  default_model: string;
  is_active: boolean;
  extra_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LlmPreset {
  slug: string;
  name: string;
  base_url: string;
  default_model: string;
  requires_key: boolean;
}

export interface LlmModel {
  id: string;
  name: string;
}

class LlmService {
  async getProviders(): Promise<LlmProviderData[]> {
    const { data } = await api.get('/llm/providers');
    return data;
  }

  async getPresets(): Promise<LlmPreset[]> {
    const { data } = await api.get('/llm/presets');
    return data;
  }

  async createProvider(payload: {
    name: string;
    slug: string;
    base_url: string;
    api_key?: string;
    default_model: string;
    is_active?: boolean;
  }): Promise<LlmProviderData> {
    const { data } = await api.post('/llm/providers', payload);
    return data;
  }

  async updateProvider(
    id: string,
    payload: Partial<{
      name: string;
      base_url: string;
      api_key: string;
      default_model: string;
    }>,
  ): Promise<LlmProviderData> {
    const { data } = await api.put(`/llm/providers/${id}`, payload);
    return data;
  }

  async deleteProvider(id: string): Promise<void> {
    await api.delete(`/llm/providers/${id}`);
  }

  async activateProvider(id: string): Promise<LlmProviderData> {
    const { data } = await api.patch(`/llm/providers/${id}/activate`);
    return data;
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post(`/llm/providers/${id}/test`);
    return data;
  }

  async listModels(id: string): Promise<LlmModel[]> {
    const { data } = await api.get(`/llm/providers/${id}/models`);
    return data;
  }
}

export const llmService = new LlmService();
