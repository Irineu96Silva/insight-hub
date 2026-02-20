import { api } from 'boot/axios';

export interface NetworkTestResult {
  id: string;
  system_id: string;
  test_type: 'HTTP' | 'PORT' | 'DNS' | 'SSL';
  target: string;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'TIMEOUT';
  response_time_ms: number;
  status_message: string;
  details: Record<string, any>;
  created_at: string;
}

class NetworkTestsService {
  async runAll(systemId: string): Promise<NetworkTestResult[]> {
    const { data } = await api.post(`/network-tests/${systemId}/run`);
    return data;
  }

  async runSingle(systemId: string, type: string): Promise<NetworkTestResult> {
    const { data } = await api.post(`/network-tests/${systemId}/run/${type}`);
    return data;
  }

  async getLatest(systemId: string): Promise<NetworkTestResult[]> {
    const { data } = await api.get(`/network-tests/${systemId}/latest`);
    return data;
  }

  async getHistory(systemId: string, limit = 50): Promise<NetworkTestResult[]> {
    const { data } = await api.get(`/network-tests/${systemId}/history`, { params: { limit } });
    return data;
  }
}

export const networkTestsService = new NetworkTestsService();
