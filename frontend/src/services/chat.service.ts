import { api } from 'boot/axios';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  report?: {
    filename: string;
    downloadUrl: string;
    format?: 'xlsx' | 'docx';
  };
}

class ChatService {
  private history: ChatMessage[] = [
    {
      id: 'intro',
      role: 'assistant',
      content:
        'Olá! Sou a IA do InsightHub. Posso analisar seus sistemas e também **gerar relatórios em Excel** sob demanda. Pergunte o que precisar!',
      timestamp: new Date().toISOString(),
    },
  ];

  async getHistory(): Promise<ChatMessage[]> {
    return [...this.history];
  }

  async sendMessage(
    content: string,
    systemId?: string,
    dataContext?: any,
  ): Promise<ChatMessage> {
    // Adiciona mensagem do usuário ao histórico
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    this.history.push(userMsg);

    try {
      // Chama a API real de chat
      const { data } = await api.post('/insights/chat', {
        systemId: systemId || 'general',
        question: content,
        dataContext: dataContext || {},
      });

      // A resposta agora pode ter { response, report? }
      const responseText =
        typeof data === 'string'
          ? data
          : data?.response || String(data);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      // Se o backend retornou um relatório para download
      if (data?.report) {
        aiMsg.report = {
          filename: data.report.filename,
          downloadUrl: data.report.downloadUrl,
          format: data.report.format || (data.report.filename?.endsWith('.docx') ? 'docx' : 'xlsx'),
        };
      }

      this.history.push(aiMsg);
      return aiMsg;
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Erro ao processar sua pergunta: ${error?.response?.data?.message || error?.message || 'Erro desconhecido'}. Verifique se a API Key do OpenRouter está configurada.`,
        timestamp: new Date().toISOString(),
      };
      this.history.push(errorMsg);
      return errorMsg;
    }
  }

  /**
   * Gera um relatório Excel diretamente (sem depender do chat).
   */
  async generateReport(systemId: string, title?: string): Promise<{ filename: string; downloadUrl: string }> {
    const { data } = await api.post('/insights/reports/generate', {
      systemId,
      title,
    });
    return data;
  }

  /**
   * Retorna a URL completa de download de um relatório.
   */
  getDownloadUrl(downloadPath: string): string {
    const baseUrl = (api.defaults.baseURL || '').replace(/\/+$/, '');
    return `${baseUrl}${downloadPath}`;
  }

  async clearHistory(): Promise<void> {
    this.history = [
      {
        id: 'intro',
        role: 'assistant',
        content:
          'Histórico limpo. Posso gerar relatórios Excel ou analisar seus dados. O que precisa?',
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

export const chatService = new ChatService();
