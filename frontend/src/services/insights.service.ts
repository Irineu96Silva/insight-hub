import { api } from 'boot/axios';
import type { Insight } from 'src/types';

// Re-export do tipo centralizado para manter compatibilidade de imports
export type { Insight };

class InsightsService {
  async getAll(systemId?: string): Promise<Insight[]> {
    const params = systemId ? { systemId } : {};
    const response = await api.get<Insight[]>('/insights', { params });
    return response.data;
  }

  async findAll(): Promise<Insight[]> {
    const response = await api.get<Insight[]>('/insights');
    return response.data;
  }

  async findOne(id: string): Promise<Insight | undefined> {
    const response = await api.get<Insight>(`/insights/${id}`);
    return response.data;
  }

  async getBySystem(systemId: string): Promise<Insight[]> {
    const response = await api.get<Insight[]>('/insights', { params: { systemId } });
    return response.data;
  }

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/insights/${id}/read`);
  }

  async dismiss(id: string): Promise<void> {
    await api.delete(`/insights/${id}`);
  }

  async generate(type: string, dataCtx: any): Promise<Insight> {
    const response = await api.post<Insight>('/insights/generate', { type, ...dataCtx });
    return response.data;
  }

  async generateGlobal(systemId?: string): Promise<Insight> {
    const response = await api.post<Insight>('/insights/global', { systemId });
    return response.data;
  }

  async chat(systemId: string, question: string, dataCtx: any): Promise<{ response: string }> {
    const res = await api.post<{ response: string }>('/insights/chat', { systemId, question, ...dataCtx });
    return res.data;
  }
}

export const insightsService = new InsightsService();
