
import { defineStore } from 'pinia';
import { systemsService, type CreateSystemDto } from 'src/services/systems.service';
import type { System } from 'src/types';

export const useSystemsStore = defineStore('systems', {
  state: () => ({
    systems: [] as System[],
    currentSystem: null as System | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchSystems() {
      this.loading = true;
      try {
        this.systems = await systemsService.findAll();
      } catch (err: any) {
        this.error = err.message || 'Erro ao buscar sistemas';
      } finally {
        this.loading = false;
      }
    },

    async fetchSystem(id: string) {
      this.loading = true;
      try {
        this.currentSystem = await systemsService.findOne(id);
      } catch (err: any) {
        this.error = err.message || 'Erro ao buscar sistema';
      } finally {
        this.loading = false;
      }
    },

    async createSystem(system: CreateSystemDto) {
      this.loading = true;
      try {
        const newSystem = await systemsService.create(system);
        this.systems.push(newSystem);
        return newSystem;
      } catch (err: any) {
        this.error = err.message || 'Erro ao criar sistema';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateSystem(id: string, updates: Partial<System>) {
        this.loading = true;
        try {
            const updated = await systemsService.update(id, updates);
            const index = this.systems.findIndex(s => s.id === id);
            if (index !== -1) {
                this.systems[index] = updated;
            }
            if (this.currentSystem?.id === id) {
                this.currentSystem = updated;
            }
            return updated;
        } catch (err: any) {
            this.error = err.message || 'Erro ao atualizar sistema';
            throw err;
        } finally {
            this.loading = false;
        }
    },

    async deleteSystem(id: string) {
      this.loading = true;
      try {
        await systemsService.remove(id);
        this.systems = this.systems.filter(s => s.id !== id);
      } catch (err: any) {
         this.error = err.message || 'Erro ao remover sistema';
         throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
