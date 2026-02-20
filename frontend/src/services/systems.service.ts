import { api } from 'boot/axios';
import type { System, SystemFile } from 'src/types';

export interface CreateSystemDto {
  name: string;
  description?: string;
  base_url?: string;
  auth_type: string;
  auth_config?: any;
}

export interface UpdateSystemDto extends Partial<CreateSystemDto> {
  is_active?: boolean;
}

export const systemsService = {
  async findAll(): Promise<System[]> {
    const { data } = await api.get('/systems');
    return data;
  },

  async findOne(id: string): Promise<System> {
    const { data } = await api.get(`/systems/${id}`);
    return data;
  },

  async create(payload: CreateSystemDto): Promise<System> {
    const { data } = await api.post('/systems', payload);
    return data;
  },

  async update(id: string, payload: UpdateSystemDto): Promise<System> {
    const { data } = await api.patch(`/systems/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/systems/${id}`);
  },
  
  async getStats(id: string): Promise<any> {
    const { data } = await api.get(`/systems/${id}/stats`);
    return data;
  },

  async uploadFile(systemId: string, file: File, description?: string): Promise<SystemFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    
    const { data } = await api.post(`/systems/${systemId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async getFiles(systemId: string): Promise<SystemFile[]> {
    const { data } = await api.get(`/systems/${systemId}/files`);
    return data;
  },

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/systems/files/${fileId}`);
  },

  getDownloadUrl(fileId: string): string {
    return `${api.defaults.baseURL}/systems/files/${fileId}/download`;
  }
};
