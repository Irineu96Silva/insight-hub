import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

interface AIStatus {
  connected: boolean;
  model: string;
}

interface SystemSettings {
  collectionInterval: number;
  insightGenerationInterval: number;
  maxInsightsPerSystem: number;
  retentionDays: number;
  autoGenerateInsights: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  criticalAlertsOnly: boolean;
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    aiStatus: {
      connected: false,
      model: 'openai/gpt-3.5-turbo',
    } as AIStatus,
    systemSettings: {
      collectionInterval: 5,
      insightGenerationInterval: 30,
      maxInsightsPerSystem: 100,
      retentionDays: 90,
      autoGenerateInsights: true,
      notificationsEnabled: true,
      emailNotifications: false,
      criticalAlertsOnly: false,
    } as SystemSettings,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isAIConnected: (state) => state.aiStatus.connected,
    currentModel: (state) => state.aiStatus.model,
  },

  actions: {
    async checkAIStatus() {
      this.loading = true;
      try {
        const response = await api.get('/insights/health');
        this.aiStatus = {
          connected: response.data.openrouter_connected,
          model: response.data.current_model,
        };
      } catch {
        this.aiStatus.connected = false;
        this.error = 'Não foi possível conectar ao serviço de IA';
      } finally {
        this.loading = false;
      }
    },

    async fetchSettings() {
      this.loading = true;
      try {
        const response = await api.get('/settings');
        this.systemSettings = { ...this.systemSettings, ...response.data };
      } catch (err) {
        console.error('Erro ao buscar configurações:', err);
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(settings: Partial<SystemSettings>) {
      try {
        await api.patch('/settings', settings);
        this.systemSettings = { ...this.systemSettings, ...settings };
      } catch (error) {
        this.error = 'Erro ao salvar configurações';
        throw error;
      }
    },
  },
});
