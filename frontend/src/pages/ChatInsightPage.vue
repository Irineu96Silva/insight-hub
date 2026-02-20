<template>
  <q-page class="chat-page">
    <div class="chat-container">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="header-left">
          <div class="ai-avatar">
            <q-icon
              name="smart_toy"
              size="24px"
            />
          </div>
          <div>
            <h1 class="header-title">
              InsightHub AI
            </h1>
            <div class="header-status">
              <span class="status-dot" />
              Online
            </div>
          </div>
        </div>

        <div class="header-right">
          <!-- Seletor de Sistema -->
          <q-select
            v-model="selectedSystemId"
            :options="systemOptions"
            emit-value
            map-options
            dense
            borderless
            dark
            class="system-selector"
            label="Sistema"
          >
            <template #prepend>
              <q-icon
                name="dns"
                size="18px"
                color="cyan"
              />
            </template>
          </q-select>

          <q-btn
            flat
            round
            icon="delete_outline"
            color="grey-5"
            @click="clearHistory"
          >
            <q-tooltip>Limpar conversa</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Messages Area -->
      <div
        ref="scrollArea"
        class="messages-area"
      >
        <div
          v-if="loading"
          class="row justify-center q-pa-md"
        >
          <q-spinner-dots
            color="cyan"
            size="2em"
          />
        </div>

        <template v-else>
          <!-- Welcome tips -->
          <div
            v-if="messages.length <= 1"
            class="tips-container"
          >
            <div class="tips-grid">
              <div
                class="tip-card"
                @click="sendQuickMessage('Quais são as tendências dos dados coletados?')"
              >
                <q-icon
                  name="trending_up"
                  color="cyan"
                  size="24px"
                />
                <span>Tendências dos dados</span>
              </div>
              <div
                class="tip-card"
                @click="sendQuickMessage('Me gere um relatório em Excel com os dados coletados')"
              >
                <q-icon
                  name="table_chart"
                  color="positive"
                  size="24px"
                />
                <span>Relatório Excel 📊</span>
              </div>
              <div
                class="tip-card"
                @click="sendQuickMessage('Gere um documento Word com um insight completo sobre este sistema')"
              >
                <q-icon
                  name="article"
                  color="info"
                  size="24px"
                />
                <span>Documento Word 📝</span>
              </div>
              <div
                class="tip-card"
                @click="sendQuickMessage('Existe alguma anomalia nos dados recentes?')"
              >
                <q-icon
                  name="warning_amber"
                  color="warning"
                  size="24px"
                />
                <span>Detectar anomalias</span>
              </div>
              <div
                class="tip-card"
                @click="sendQuickMessage('Faça um resumo comparando o mês atual com o anterior')"
              >
                <q-icon
                  name="compare_arrows"
                  color="purple"
                  size="24px"
                />
                <span>Comparar períodos</span>
              </div>
            </div>
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-wrapper"
            :class="`message--${msg.role}`"
          >
            <div class="message-content">
              <div class="message-bubble">
                <div v-html="formatMessage(msg.content)" />

                <!-- Download Report Button -->
                <div
                  v-if="msg.report"
                  class="report-download q-mt-md"
                >
                  <q-separator class="q-mb-sm" />
                  <div class="row items-center q-gutter-sm">
                    <q-icon
                      :name="msg.report.format === 'docx' ? 'article' : 'table_chart'"
                      :color="msg.report.format === 'docx' ? 'info' : 'positive'"
                      size="28px"
                    />
                    <div class="col">
                      <div
                        class="text-caption text-weight-bold"
                        style="color: #10b981;"
                      >
                        {{ msg.report.format === 'docx' ? '📝 Documento Word gerado!' : '📊 Planilha Excel gerada!' }}
                      </div>
                      <div
                        class="text-caption"
                        style="color: #94a3b8;"
                      >
                        {{ msg.report.filename }}
                      </div>
                    </div>
                    <q-btn
                      :color="msg.report.format === 'docx' ? 'info' : 'positive'"
                      icon="download"
                      :label="msg.report.format === 'docx' ? 'Baixar Word' : 'Baixar Excel'"
                      unelevated
                      size="sm"
                      @click="downloadReport(msg.report)"
                    />
                  </div>
                </div>
              </div>
              <div class="message-time">
                {{ formatTime(msg.timestamp) }}
              </div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div
            v-if="isTyping"
            class="message-wrapper message--assistant"
          >
            <div class="message-content">
              <div class="message-bubble typing-bubble">
                <q-spinner-dots
                  size="1.5em"
                  color="cyan"
                />
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-wrapper">
          <q-input
            v-model="newMessage"
            placeholder="Pergunte algo ou peça um relatório Excel..."
            dense
            borderless
            autogrow
            dark
            class="chat-input"
            @keydown.enter.prevent="sendMessage"
          >
            <template #prepend>
              <q-icon
                name="auto_awesome"
                color="cyan"
              />
            </template>
          </q-input>
          <q-btn
            round
            flat
            color="cyan"
            icon="send"
            :disable="!newMessage.trim() || isTyping"
            class="send-btn"
            @click="sendMessage"
          />
        </div>
        <div class="input-hint q-mt-sm">
          💡 Dica: peça <strong>"relatório Excel"</strong> para dados tabulares ou <strong>"documento Word"</strong> para insights formatados
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useQuasar } from 'quasar';
import { chatService, type ChatMessage } from 'src/services/chat.service';
import { useSystemsStore } from 'src/stores/systems.store';
import { api } from 'boot/axios';

const $q = useQuasar();
const systemsStore = useSystemsStore();
const messages = ref<ChatMessage[]>([]);
const newMessage = ref('');
const loading = ref(true);
const isTyping = ref(false);
const scrollArea = ref<HTMLElement | null>(null);
const selectedSystemId = ref<string>('general');

// Opções de sistema
const systemOptions = computed(() => {
  const opts = [{ label: 'Todos os sistemas', value: 'general' }];
  if (systemsStore.systems) {
    systemsStore.systems.forEach((s: any) => {
      opts.push({ label: s.name, value: s.id });
    });
  }
  return opts;
});

async function loadHistory() {
  try {
    messages.value = await chatService.getHistory();
    scrollToBottom();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function sendMessage() {
  if (!newMessage.value.trim()) return;

  const content = newMessage.value;
  newMessage.value = '';

  // ── Exibir mensagem do usuário IMEDIATAMENTE na tela ──
  const userMsg: ChatMessage = {
    id: `temp-${Date.now()}`,
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };
  messages.value.push(userMsg);
  isTyping.value = true;
  scrollToBottom();

  try {
    await chatService.sendMessage(content, selectedSystemId.value);
    // Recarregar histórico para ter as mensagens reais (com IDs corretos e resposta da IA)
    messages.value = await chatService.getHistory();
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Erro ao enviar mensagem' });
    // Remover a mensagem temporária em caso de erro
    messages.value = messages.value.filter(m => m.id !== userMsg.id);
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
}

function sendQuickMessage(text: string) {
  newMessage.value = text;
  sendMessage();
}

async function clearHistory() {
  try {
    await chatService.clearHistory();
    messages.value = await chatService.getHistory();
  } catch (error) {
    console.error(error);
  }
}

function downloadReport(report: { filename: string; downloadUrl: string }) {
  const baseUrl = (api.defaults.baseURL || '').replace(/\/+$/, '');
  const url = `${baseUrl}${report.downloadUrl}`;

  // Pegar token para autenticação
  const token = localStorage.getItem('token');
  
  // Fazer download autenticado
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => {
      if (!res.ok) throw new Error('Download falhou');
      return res.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = report.filename;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      $q.notify({ type: 'positive', message: '✅ Download iniciado!' });
    })
    .catch(err => {
      console.error(err);
      $q.notify({ type: 'negative', message: 'Erro ao baixar relatório' });
    });
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollArea.value) {
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
    }
  });
}

function formatMessage(content: string) {
  // Markdown bold
  let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

onMounted(() => {
  systemsStore.fetchSystems();
  loadHistory();
});
</script>

<style lang="scss" scoped>
.chat-page {
  height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  position: relative;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(15, 15, 30, 0.95);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.system-selector {
  min-width: 180px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0 12px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 245, 255, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
  border: 1px solid rgba(0, 245, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00f5ff;
}

.header-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #10b981;

  .status-dot {
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  }
}

// ─── Tips ──────────────────────────────
.tips-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 500px;
  width: 100%;
}

.tip-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #94a3b8;
  font-size: 0.85rem;

  &:hover {
    background: rgba(0, 245, 255, 0.08);
    border-color: rgba(0, 245, 255, 0.2);
    color: #f1f5f9;
    transform: translateY(-2px);
  }
}

// ─── Messages ──────────────────────────
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 80%;

  &.message--user {
    align-self: flex-end;
    align-items: flex-end;

    .message-bubble {
      background: linear-gradient(135deg, rgba(0, 245, 255, 0.2) 0%, rgba(0, 245, 255, 0.1) 100%);
      border: 1px solid rgba(0, 245, 255, 0.3);
      color: #f1f5f9;
      border-bottom-right-radius: 4px;
    }
  }

  &.message--assistant {
    align-self: flex-start;
    align-items: flex-start;

    .message-bubble {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #e2e8f0;
      border-bottom-left-radius: 4px;
    }
  }
}

.message-bubble {
  padding: 16px;
  border-radius: 16px;
  font-size: 0.95rem;
  line-height: 1.6;
  position: relative;
  
  &.typing-bubble {
    padding: 12px 20px;
    min-width: 60px;
    display: flex;
    justify-content: center;
  }
}

.report-download {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 10px;
  padding: 12px;
}

.message-time {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 6px;
  margin-left: 4px;
  margin-right: 4px;
}

// ─── Input ─────────────────────────────
.input-area {
  padding: 24px;
  background: rgba(15, 15, 30, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.input-wrapper {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 8px 16px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: rgba(0, 245, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 20px rgba(0, 245, 255, 0.1);
  }
}

.chat-input {
  flex: 1;
  max-height: 150px;
  overflow-y: auto;
}

.input-hint {
  text-align: center;
  font-size: 0.72rem;
  color: #475569;
  margin-top: 8px;
}

// ═══════════════ RESPONSIVIDADE MOBILE ═══════════════
@media (max-width: 599px) {
  .chat-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .system-selector {
    min-width: 0;
    flex: 1;
  }

  .header-title {
    font-size: 0.95rem;
  }

  .tips-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .tip-card {
    padding: 12px;
    font-size: 0.8rem;
  }

  .messages-area {
    padding: 12px;
    gap: 12px;
  }

  .message-wrapper {
    max-width: 95%;
  }

  .message-bubble {
    padding: 12px;
    font-size: 0.88rem;
  }

  .input-area {
    padding: 12px;
  }

  .input-wrapper {
    padding: 6px 10px;
    gap: 8px;
  }
}
</style>
