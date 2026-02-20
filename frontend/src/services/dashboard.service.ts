import { api } from 'boot/axios';

export interface DashboardSummary {
  overview: {
    systems: { total: number; active: number; inactive: number };
    endpoints: { total: number; active: number; inactive: number };
    insights: { total: number; last24h: number; last7d: number };
    collections: { total: number; success: number; errors: number; last24h: number; last7d: number };
  };
  ai: {
    status: string;
    provider: string;
    model: string;
    monthly: { tokens: number; cost: number; requests: number };
    today: { tokens: number; cost: number; requests: number };
    chatInteractions: { total: number; last24h: number; last7d: number };
    recentChats: { id: string; model: string; created_at: string }[];
  };
  drilldown: {
    systems: {
      id: string; name: string; base_url: string; is_active: boolean;
      environment: string; criticality: string; company_name: string;
      endpointsCount: number; endpointsActive: number; created_at: string;
    }[];
    endpoints: {
      id: string; name: string; method: string; url_template: string;
      is_active: boolean; response_type: string; system_name: string;
      system_id: string; last_collected_at: string;
    }[];
    collections: {
      id: string; endpoint_name: string; system_name: string;
      status: string; error_message: string; params_used: any;
      collected_at: string;
    }[];
    insightsByType: { type: string; count: string }[];
    insightsBySeverity: { severity: string; count: string }[];
  };
  recentInsights: any[];
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    try {
      const { data } = await api.get('/dashboard/summary');
      return data;
    } catch (error) {
      console.warn('Dashboard summary fetch failed', error);
      return {
        overview: {
          systems: { total: 0, active: 0, inactive: 0 },
          endpoints: { total: 0, active: 0, inactive: 0 },
          insights: { total: 0, last24h: 0, last7d: 0 },
          collections: { total: 0, success: 0, errors: 0, last24h: 0, last7d: 0 },
        },
        ai: {
          status: 'Offline', provider: 'N/A', model: 'N/A',
          monthly: { tokens: 0, cost: 0, requests: 0 },
          today: { tokens: 0, cost: 0, requests: 0 },
          chatInteractions: { total: 0, last24h: 0, last7d: 0 },
          recentChats: [],
        },
        drilldown: {
          systems: [], endpoints: [], collections: [],
          insightsByType: [], insightsBySeverity: [],
        },
        recentInsights: [],
      };
    }
  },
};
