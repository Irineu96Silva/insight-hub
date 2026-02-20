

export interface SystemHealth {
  openRouter: {
    status: 'online' | 'offline';
    model: string;
    version?: string;
  };
  database: {
    status: 'connected' | 'disconnected';
    latency: number;
  };
  collector: {
    status: 'active' | 'idle';
    lastRun: string;
    nextRun: string;
    cron: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'dev' | 'viewer';
  active: boolean;
}

class StatsService {
  async getHealth(): Promise<SystemHealth> {
    // Mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          openRouter: { status: 'online', model: 'openai/gpt-3.5-turbo' },
          database: {
            status: 'connected',
            latency: 45
          },
          collector: {
            status: 'idle',
            lastRun: new Date(Date.now() - 3600000).toISOString(),
            nextRun: new Date(Date.now() + 3600000).toISOString(),
            cron: '0 */6 * * *'
          }
        });
      }, 800);
    });
  }

  async getUsers(): Promise<User[]> {
    // Mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '1', name: 'Administrador', email: 'admin@insighthub.com', role: 'admin', active: true },
          { id: '2', name: 'Desenvolvedor', email: 'dev@insighthub.com', role: 'dev', active: true },
          { id: '3', name: 'Visitante', email: 'viewer@insighthub.com', role: 'viewer', active: false }
        ]);
      }, 600);
    });
  }

  async toggleUserStatus(userId: string, active: boolean): Promise<void> {
    console.log(`Toggling user ${userId} to ${active}`);
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  async triggerCollection(): Promise<void> {
    console.log('Triggering manual collection...');
    return new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

export const statsService = new StatsService();
