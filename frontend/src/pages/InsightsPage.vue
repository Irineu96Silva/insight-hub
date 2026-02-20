<template>
  <q-page class="q-pa-md insights-page">
    <!-- ═══════════════ HEADER ═══════════════ -->
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h1 class="text-h4 orbitron-font no-margin">
            Painel de Inteligência
          </h1>
          <div class="text-subtitle2 text-grey-6 q-mt-xs">
            Relatórios estratégicos gerados por IA a partir dos seus dados reais
          </div>
        </div>
        <div class="row items-center q-gutter-md">
          <q-select
            v-model="selectedSystem"
            :options="systemOptions"
            dense
            outlined
            options-dense
            dark
            color="cyan"
            label="Sistema"
            style="min-width: 220px"
            @update:model-value="loadInsights"
          />
          <q-btn
            unelevated
            color="cyan"
            text-color="dark"
            icon="auto_awesome"
            :label="generating ? 'Gerando...' : 'Gerar Relatório'"
            :loading="generating"
            class="orbitron-font"
            @click="generateReport"
          >
            <q-tooltip>
              A IA vai coletar dados e gerar um relatório estratégico completo
            </q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- ═══════════════ LOADING STATE ═══════════════ -->
    <div
      v-if="loading"
      class="flex flex-center q-pa-xl"
    >
      <q-spinner-orbit
        size="60px"
        color="cyan"
      />
    </div>

    <!-- ═══════════════ EMPTY STATE / ONBOARDING ═══════════════ -->
    <div
      v-else-if="insights.length === 0 && !loading"
      class="empty-state"
    >
      <q-card class="glass-card onboarding-card q-pa-xl text-center">
        <q-icon
          name="rocket_launch"
          size="80px"
          color="cyan"
          class="q-mb-lg"
        />
        <div class="text-h5 text-white q-mb-sm">
          Seu primeiro Insight começa aqui
        </div>
        <div
          class="text-body1 text-grey-5 q-mb-xl"
          style="max-width: 500px; margin: 0 auto;"
        >
          O InsightHub analisa os dados dos seus sistemas integrados e transforma 
          em relatórios de inteligência de negócio. Clique abaixo para gerar sua primeira análise.
        </div>

        <div class="row q-col-gutter-md justify-center q-mb-xl">
          <div class="col-12 col-sm-4">
            <div class="step-card q-pa-md">
              <q-icon
                name="link"
                size="32px"
                color="purple"
                class="q-mb-sm"
              />
              <div class="text-subtitle2 text-white">
                1. Cadastre Sistemas
              </div>
              <div class="text-caption text-grey-6">
                Conecte as APIs que deseja monitorar
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="step-card q-pa-md">
              <q-icon
                name="api"
                size="32px"
                color="purple"
                class="q-mb-sm"
              />
              <div class="text-subtitle2 text-white">
                2. Configure Endpoints
              </div>
              <div class="text-caption text-grey-6">
                Defina quais dados a IA deve coletar
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="step-card q-pa-md">
              <q-icon
                name="auto_awesome"
                size="32px"
                color="cyan"
                class="q-mb-sm"
              />
              <div class="text-subtitle2 text-white">
                3. Gere Relatórios
              </div>
              <div class="text-caption text-grey-6">
                A IA analisa e gera insights
              </div>
            </div>
          </div>
        </div>

        <q-btn
          unelevated
          color="cyan"
          text-color="dark"
          icon="auto_awesome"
          label="Gerar Primeiro Relatório"
          size="lg"
          class="orbitron-font"
          :loading="generating"
          @click="generateReport"
        />
      </q-card>
    </div>

    <!-- ═══════════════ MAIN CONTENT ═══════════════ -->
    <div v-else>
      <!-- Hero: Último Relatório -->
      <q-card
        v-if="latestInsight"
        class="glass-card hero-card q-mb-lg"
        @click="openInsightDetails(latestInsight)"
      >
        <q-card-section>
          <div class="row items-start justify-between q-mb-md">
            <div class="row items-center q-gutter-sm">
              <q-badge
                :color="getSeverityColor(latestInsight.severity)"
                class="q-py-xs q-px-sm"
              >
                {{ getSeverityLabel(latestInsight.severity) }}
              </q-badge>
              <q-badge
                outline
                color="cyan"
                class="q-py-xs q-px-sm"
              >
                {{ getTypeLabel(latestInsight.type) }}
              </q-badge>
              <q-badge
                v-if="latestInsight.system"
                outline
                color="purple"
                class="q-py-xs q-px-sm"
              >
                {{ latestInsight.system.name }}
              </q-badge>
            </div>
            <div class="text-caption text-grey-5">
              <q-icon
                name="schedule"
                size="14px"
                class="q-mr-xs"
              />
              {{ formatDate(latestInsight.created_at) }}
            </div>
          </div>

          <div class="text-h5 text-white q-mb-md">
            {{ latestInsight.title }}
          </div>

          <div
            class="hero-content text-body1 text-grey-4"
            style="line-height: 1.7;"
          >
            {{ truncate(latestInsight.content, 600) }}
          </div>

          <div class="row items-center q-mt-lg q-gutter-sm">
            <q-btn
              flat
              color="cyan"
              icon="visibility"
              label="Ler Relatório Completo"
            />
            <q-btn
              flat
              color="grey"
              icon="share"
              label="Compartilhar"
              disable
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Histórico de Relatórios -->
      <div v-if="insights.length > 1">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-white">
            Relatórios Anteriores
          </div>
          <div class="text-caption text-grey-6">
            {{ insights.length - 1 }} relatório(s)
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div
            v-for="insight in insights.slice(1)"
            :key="insight.id"
            class="col-12 col-md-6"
          >
            <q-card
              class="glass-card insight-card cursor-pointer"
              @click="openInsightDetails(insight)"
            >
              <q-card-section>
                <div class="row items-center q-gutter-xs q-mb-sm">
                  <q-badge
                    :color="getSeverityColor(insight.severity)"
                    dense
                  >
                    {{ insight.severity }}
                  </q-badge>
                  <q-badge
                    outline
                    color="grey"
                    dense
                  >
                    {{ getTypeLabel(insight.type) }}
                  </q-badge>
                  <q-space />
                  <span class="text-caption text-grey-6">{{ formatDate(insight.created_at) }}</span>
                </div>

                <div class="text-subtitle1 text-white q-mb-xs text-weight-medium">
                  {{ insight.title }}
                </div>
                <div
                  class="text-caption text-grey-5"
                  style="line-height: 1.5;"
                >
                  {{ truncate(insight.content, 200) }}
                </div>

                <div class="row items-center q-mt-sm">
                  <q-badge
                    v-if="insight.system"
                    outline
                    color="purple"
                    dense
                    class="q-mr-xs"
                  >
                    {{ insight.system.name }}
                  </q-badge>
                  <q-badge
                    v-if="insight.endpoint"
                    outline
                    color="teal"
                    dense
                  >
                    {{ insight.endpoint.name }}
                  </q-badge>
                  <q-space />
                  <q-icon
                    name="chevron_right"
                    color="grey-6"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════ DRILL DOWN DIALOG ═══════════════ -->
    <q-dialog
      v-model="showDetails"
      :maximized="$q.screen.lt.sm"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="insight-detail-card bg-dark text-white column">
        <q-bar class="insight-detail-bar">
          <q-icon name="auto_awesome" color="cyan" />
          <span class="orbitron-font text-caption q-ml-xs">RELATÓRIO DE INTELIGÊNCIA</span>
          <q-space />
          <q-btn
            v-close-popup
            dense
            flat
            icon="close"
          />
        </q-bar>

        <q-card-section class="col scroll q-pa-md">
          <div class="detail-container q-mx-auto">
            <!-- Header do relatório -->
            <div class="detail-badges q-mb-md">
              <q-badge
                :color="getSeverityColor(selectedInsight?.severity)"
                class="q-py-xs q-px-sm"
              >
                {{ getSeverityLabel(selectedInsight?.severity) }}
              </q-badge>
              <q-badge
                outline
                color="cyan"
                class="q-py-xs q-px-sm"
              >
                {{ getTypeLabel(selectedInsight?.type) }}
              </q-badge>
              <q-badge
                v-if="selectedInsight?.system"
                outline
                color="purple"
                class="q-py-xs q-px-sm"
              >
                {{ selectedInsight.system.name }}
              </q-badge>
              <span class="text-caption text-grey-5 q-ml-auto">
                {{ formatDate(selectedInsight?.created_at) }}
              </span>
            </div>

            <div class="detail-title q-mb-lg">
              {{ insightDisplayTitle }}
            </div>

            <!-- Conteúdo do relatório -->
            <div
              class="report-content q-pa-md q-pa-lg-md rounded-borders"
              v-html="renderedContent"
            />

            <!-- Dados utilizados -->
            <div
              v-if="selectedInsight?.data_snapshot"
              class="q-mt-lg"
            >
              <q-expansion-item
                icon="data_object"
                label="Dados Utilizados na Análise"
                header-class="text-cyan"
                dense
              >
                <pre class="bg-black q-pa-md rounded-borders overflow-auto code-block">{{ JSON.stringify(selectedInsight.data_snapshot, null, 2) }}</pre>
              </q-expansion-item>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar, date } from 'quasar';
import { insightsService, type Insight } from 'src/services/insights.service';
import { useSystemsStore } from 'src/stores/systems.store';

const $q = useQuasar();
const systemsStore = useSystemsStore();

const loading = ref(false);
const generating = ref(false);
const insights = ref<Insight[]>([]);
const selectedSystem = ref<{ label: string; value: string } | null>(null);

// Drill down
const showDetails = ref(false);
const selectedInsight = ref<Insight | null>(null);

// System options
const systemOptions = computed(() => [
  { label: 'Todos os Sistemas', value: '' },
  ...systemsStore.systems.map(s => ({ label: s.name, value: s.id }))
]);

const latestInsight = computed(() => insights.value[0] ?? null);

// Título limpo: remove UUIDs feios do título do insight
const insightDisplayTitle = computed(() => {
  if (!selectedInsight.value) return '';
  const title = selectedInsight.value.title || '';
  // Remove UUIDs do título (formato: xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const cleaned = title.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '').trim();
  // Remove traços/hífens sobrando no final
  const final = cleaned.replace(/[\s\-—]+$/, '').replace(/^[\s\-—]+/, '').trim();
  // Se ficou vazio, usar nome do sistema
  if (!final || final === 'Relatório de BI' || final === 'Relatório de BI -') {
    return selectedInsight.value.system
      ? `Relatório de BI — ${selectedInsight.value.system.name}`
      : 'Relatório de Inteligência';
  }
  return final;
});

// Renderizar markdown básico em HTML
const renderedContent = computed(() => {
  if (!selectedInsight.value?.content) return '';
  let text = selectedInsight.value.content;
  // Escapar HTML
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Headers ### -> h3, ## -> h2
  text = text.replace(/^### (.+)$/gm, '<h3 style="color:#22d3ee;margin:20px 0 8px;font-size:1.1rem;">$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2 style="color:#22d3ee;margin:24px 0 10px;font-size:1.25rem;">$1</h2>');
  // Bold **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f1f5f9;">$1</strong>');
  // Lists - item
  text = text.replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>');
  // Numbered lists
  text = text.replace(/^(\d+)\. (.+)$/gm, '<li style="margin:4px 0;padding-left:4px;"><strong>$1.</strong> $2</li>');
  // Newlines
  text = text.replace(/\n/g, '<br>');
  // Clean up consecutive br tags around lists
  text = text.replace(/<br><li/g, '<li');
  text = text.replace(/<\/li><br>/g, '</li>');
  return text;
});

// ═══════════════ ACTIONS ═══════════════

async function loadInsights() {
  loading.value = true;
  try {
    const systemId = selectedSystem.value?.value || undefined;
    insights.value = await insightsService.getAll(systemId);
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Erro ao carregar relatórios' });
  } finally {
    loading.value = false;
  }
}

async function generateReport() {
  generating.value = true;
  $q.loading.show({
    message: 'A IA está coletando e analisando seus dados...\nIsso pode levar alguns segundos.',
    spinnerColor: 'cyan',
  });
  try {
    const systemId = selectedSystem.value?.value || undefined;
    await insightsService.generateGlobal(systemId);
    $q.notify({
      type: 'positive',
      message: '🎯 Relatório gerado com sucesso!',
      caption: 'Confira o novo insight abaixo.',
      timeout: 4000,
    });
    await loadInsights();
  } catch (e: any) {
    console.error(e);
    const msg = e.response?.data?.message || 'Erro ao gerar relatório.';
    $q.notify({
      type: 'negative',
      message: msg,
      caption: 'Verifique se há sistemas e endpoints configurados.',
      timeout: 6000,
    });
  } finally {
    generating.value = false;
    $q.loading.hide();
  }
}

function openInsightDetails(insight: Insight | null) {
  if (!insight) return;
  selectedInsight.value = insight;
  showDetails.value = true;
}

// ═══════════════ HELPERS ═══════════════

function getSeverityColor(severity?: string) {
  const m: Record<string, string> = {
    CRITICAL: 'negative', critical: 'negative',
    WARNING: 'warning', warning: 'warning',
    SUCCESS: 'positive', success: 'positive',
    INFO: 'info', info: 'info',
  };
  return m[severity || ''] || 'info';
}

function getSeverityLabel(severity?: string) {
  const m: Record<string, string> = {
    CRITICAL: '🔴 Crítico', critical: '🔴 Crítico',
    WARNING: '🟡 Atenção', warning: '🟡 Atenção',
    SUCCESS: '🟢 Positivo', success: '🟢 Positivo',
    INFO: '🔵 Info', info: '🔵 Info',
  };
  return m[severity || ''] || severity || 'Info';
}

function getTypeLabel(type?: string) {
  const m: Record<string, string> = {
    ANALYSIS: 'Análise', analysis: 'Análise',
    COMPARISON: 'Comparação', comparison: 'Comparação',
    ANOMALY: 'Anomalia', anomaly: 'Anomalia',
    FORECAST: 'Previsão', forecast: 'Previsão',
    CUSTOM: 'Personalizado', custom: 'Personalizado',
  };
  return m[type || ''] || type || '';
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return date.formatDate(dateStr, 'DD/MM/YYYY [às] HH:mm');
}

function truncate(text: string, max: number) {
  if (!text) return '';
  return text.length > max ? text.substring(0, max) + '...' : text;
}

// ═══════════════ LIFECYCLE ═══════════════

onMounted(async () => {
  await systemsStore.fetchSystems();
  loadInsights();
});
</script>

<style lang="scss" scoped>
.insights-page {
  max-width: 1200px;
  margin: 0 auto;
}

.orbitron-font {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 0.5px;
}

.glass-card {
  border-radius: 16px;
}

// ── Onboarding ──
.onboarding-card {
  background: linear-gradient(135deg, rgba(15, 15, 35, 0.8) 0%, rgba(10, 10, 25, 0.9) 100%);
  border: 1px solid rgba(0, 245, 255, 0.1);
}

.step-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 245, 255, 0.05);
    border-color: rgba(0, 245, 255, 0.15);
    transform: translateY(-2px);
  }
}

// ── Hero Card ──
.hero-card {
  cursor: pointer;
  border: 1px solid rgba(0, 245, 255, 0.08);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 245, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 245, 255, 0.08);
  }

  .hero-content {
    border-left: 3px solid rgba(0, 245, 255, 0.3);
    padding-left: 16px;
  }
}

// ── Insight Cards ──
.insight-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.04);
  height: 100%;

  &:hover {
    border-color: rgba(0, 245, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
}

// ── Detail Dialog ──
.insight-detail-card {
  width: 100%;
  max-width: 960px;
  max-height: 92vh;
}

.insight-detail-bar {
  background: linear-gradient(135deg, rgba(0, 245, 255, 0.08) 0%, rgba(128, 0, 255, 0.08) 100%);
  border-bottom: 1px solid rgba(0, 245, 255, 0.1);
}

.detail-container {
  max-width: 100%;
  width: 100%;
}

.detail-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.detail-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.3;
  word-break: break-word;
}

.report-content {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.95rem;
  color: #cbd5e1;
  line-height: 1.8;
  word-break: break-word;
  overflow-wrap: anywhere;

  h2, h3 {
    font-family: 'Orbitron', sans-serif;
  }

  li {
    list-style: none;
    position: relative;
    padding-left: 16px;

    &::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: #22d3ee;
    }
  }
}

.code-block {
  max-height: 400px;
  font-family: 'Fira Code', monospace;
  font-size: 0.75rem;
  word-break: break-all;
  white-space: pre-wrap;
}

// ═══════════════ RESPONSIVIDADE MOBILE ═══════════════
@media (max-width: 599px) {
  .page-header .row {
    flex-direction: column;
    gap: 12px;
    align-items: stretch !important;
  }

  .page-header .row .row {
    flex-direction: column;
    gap: 8px;
  }

  .page-header .q-select {
    min-width: 0 !important;
    width: 100%;
  }

  .page-header .q-btn {
    width: 100%;
  }

  .page-header .text-h4 {
    font-size: 1.3rem !important;
  }

  // Detail dialog mobile
  .detail-title {
    font-size: 1.15rem;
  }

  .detail-badges {
    gap: 6px;

    .q-badge {
      font-size: 0.65rem;
    }
  }

  .report-content {
    font-size: 0.85rem;
    padding: 12px !important;
    line-height: 1.6;
  }

  .code-block {
    font-size: 0.65rem;
    max-height: 250px;
  }
}
</style>
