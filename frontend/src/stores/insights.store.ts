
import { defineStore } from 'pinia';
import { insightsService } from 'src/services/insights.service';
import type { Insight } from 'src/types';

export const useInsightsStore = defineStore('insights', {
  state: () => ({
    insights: [] as Insight[],
    currentInsight: null as Insight | null,
    loading: false,
    error: null as string | null,
    generating: false,
  }),

  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        this.insights = await insightsService.findAll();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchBySystem(systemId: string) {
      this.loading = true;
      try {
        this.insights = await insightsService.getBySystem(systemId);
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchInsight(id: string) {
        this.loading = true;
        try {
            this.currentInsight = await insightsService.findOne(id) || null; // Handle undefined by defaulting to null
        } catch (err: any) {
            this.error = err.message;
        } finally {
            this.loading = false;
        }
    },

    async generateInsight(type: string, dataCtx: any) {
      this.generating = true;
      try {
        const insight = await insightsService.generate(type, dataCtx);
        this.insights.unshift(insight);
        return insight;
      } catch (err: any) {
        this.error = err.message || 'Erro ao gerar insight';
        throw err;
      } finally {
        this.generating = false;
      }
    },
    
    async chatWithData(systemId: string, question: string, dataCtx: any) {
        this.generating = true;
        try {
            const { response } = await insightsService.chat(systemId, question, dataCtx);
            return response;
        } catch (err: any) {
            this.error = err.message;
            throw err;
        } finally {
            this.generating = false;
        }
    }
  }
});
