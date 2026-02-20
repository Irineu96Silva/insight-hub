<template>
  <q-page class="q-pa-md dashboard-page">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 q-my-none orbitron-font">
          Dashboard
        </h1>
        <div class="text-subtitle2 text-grey-5">
          Visão geral completa do InsightHub
        </div>
      </div>
      <q-btn
        icon="refresh"
        label="Atualizar"
        color="cyan"
        flat
        dense
        class="refresh-btn"
        :loading="loading"
        @click="loadStats"
      />
    </div>

    <!-- ═══════════════════ ROW 1: 4 KPI CARDS (expandíveis) ═══════════════════ -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- CARD: Sistemas -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card
          class="stat-card futuristic-card cursor-pointer"
          @click="expanded.systems = !expanded.systems"
        >
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-overline text-grey-4">
                  SISTEMAS
                </div>
                <div class="text-h3 text-cyan orbitron-font counter-value">
                  {{ d.overview.systems.active }}
                </div>
              </div>
              <div class="icon-wrapper icon-wrapper--cyan">
                <q-icon
                  name="dns"
                  size="36px"
                  color="cyan"
                />
              </div>
            </div>
            <div class="text-caption text-grey-5 q-mt-xs row items-center justify-between">
              <span>
                <q-icon
                  name="check_circle"
                  size="xs"
                  color="positive"
                />
                {{ d.overview.systems.active }} ativos · {{ d.overview.systems.inactive }} inativos
              </span>
              <q-icon
                :name="expanded.systems ? 'expand_less' : 'expand_more'"
                size="xs"
                color="grey-5"
              />
            </div>
          </q-card-section>

          <!-- DRILL-DOWN: Lista de todos os sistemas -->
          <q-slide-transition>
            <div v-show="expanded.systems">
              <q-separator dark />
              <q-card-section class="drilldown-section">
                <q-list
                  dense
                  dark
                  separator
                >
                  <q-item
                    v-for="sys in d.drilldown.systems"
                    :key="sys.id"
                    clickable
                    @click.stop="router.push(`/systems/${sys.id}`)"
                  >
                    <q-item-section avatar>
                      <q-icon
                        :name="sys.is_active ? 'check_circle' : 'cancel'"
                        :color="sys.is_active ? 'positive' : 'negative'"
                        size="xs"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-white text-weight-medium">
                        {{ sys.name }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ sys.company_name || '—' }} · {{ sys.endpointsActive }}/{{ sys.endpointsCount }} endpoints
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="column items-end q-gutter-xs">
                        <q-badge
                          v-if="sys.environment"
                          :color="getEnvColor(sys.environment)"
                          outline
                          dense
                        >
                          {{ sys.environment }}
                        </q-badge>
                        <q-badge
                          v-if="sys.criticality"
                          :color="getCritColor(sys.criticality)"
                          dense
                        >
                          {{ getCritLabel(sys.criticality) }}
                        </q-badge>
                      </div>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="d.drilldown.systems.length === 0">
                    <q-item-section class="text-grey-6 text-center">
                      Nenhum sistema
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </div>
          </q-slide-transition>
        </q-card>
      </div>

      <!-- CARD: Endpoints -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card
          class="stat-card futuristic-card cursor-pointer"
          @click="expanded.endpoints = !expanded.endpoints"
        >
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-overline text-grey-4">
                  ENDPOINTS
                </div>
                <div class="text-h3 text-purple orbitron-font counter-value">
                  {{ d.overview.endpoints.active }}
                </div>
              </div>
              <div class="icon-wrapper icon-wrapper--purple">
                <q-icon
                  name="api"
                  size="36px"
                  color="purple"
                />
              </div>
            </div>
            <div class="text-caption text-grey-5 q-mt-xs row items-center justify-between">
              <span>
                <q-icon
                  name="trending_up"
                  size="xs"
                  color="positive"
                />
                {{ d.overview.endpoints.total }} total · {{ d.overview.endpoints.inactive }} inativos
              </span>
              <q-icon
                :name="expanded.endpoints ? 'expand_less' : 'expand_more'"
                size="xs"
                color="grey-5"
              />
            </div>
          </q-card-section>

          <!-- DRILL-DOWN: Lista de todos os endpoints -->
          <q-slide-transition>
            <div v-show="expanded.endpoints">
              <q-separator dark />
              <q-card-section class="drilldown-section">
                <q-list
                  dense
                  dark
                  separator
                >
                  <q-item
                    v-for="ep in d.drilldown.endpoints"
                    :key="ep.id"
                    clickable
                    @click.stop="router.push(`/systems/${ep.system_id}?tab=endpoints`)"
                  >
                    <q-item-section avatar>
                      <q-badge
                        :color="getMethodColor(ep.method)"
                        class="text-weight-bold"
                        style="font-size:10px"
                      >
                        {{ ep.method || 'GET' }}
                      </q-badge>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-white text-weight-medium">
                        {{ ep.name }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ ep.system_name }} · {{ ep.url_template }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon
                        :name="ep.is_active ? 'check_circle' : 'cancel'"
                        :color="ep.is_active ? 'positive' : 'negative'"
                        size="xs"
                      />
                    </q-item-section>
                  </q-item>
                  <q-item v-if="d.drilldown.endpoints.length === 0">
                    <q-item-section class="text-grey-6 text-center">
                      Nenhum endpoint
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </div>
          </q-slide-transition>
        </q-card>
      </div>

      <!-- CARD: Coletas -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card
          class="stat-card futuristic-card cursor-pointer"
          @click="expanded.collections = !expanded.collections"
        >
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-overline text-grey-4">
                  COLETAS
                </div>
                <div class="text-h3 text-amber orbitron-font counter-value">
                  {{ d.overview.collections.total }}
                </div>
              </div>
              <div class="icon-wrapper icon-wrapper--amber">
                <q-icon
                  name="cloud_download"
                  size="36px"
                  color="amber"
                />
              </div>
            </div>
            <div class="text-caption text-grey-5 q-mt-xs row items-center justify-between">
              <span>
                <q-icon
                  name="schedule"
                  size="xs"
                />
                {{ d.overview.collections.last24h }} hoje
                <span
                  v-if="d.overview.collections.errors"
                  class="text-negative q-ml-xs"
                >
                  · {{ d.overview.collections.errors }} erros
                </span>
              </span>
              <q-icon
                :name="expanded.collections ? 'expand_less' : 'expand_more'"
                size="xs"
                color="grey-5"
              />
            </div>
          </q-card-section>

          <!-- DRILL-DOWN: Coletas com status -->
          <q-slide-transition>
            <div v-show="expanded.collections">
              <q-separator dark />
              <q-card-section class="drilldown-section">
                <!-- Summary bar -->
                <div class="row q-gutter-sm q-mb-sm">
                  <q-chip
                    dense
                    color="positive"
                    text-color="white"
                    size="sm"
                    icon="check"
                  >
                    {{ d.overview.collections.success }} sucesso
                  </q-chip>
                  <q-chip
                    dense
                    color="negative"
                    text-color="white"
                    size="sm"
                    icon="error"
                  >
                    {{ d.overview.collections.errors }} erros
                  </q-chip>
                  <q-chip
                    dense
                    color="cyan"
                    outline
                    size="sm"
                    icon="today"
                  >
                    {{ d.overview.collections.last7d }} (7 dias)
                  </q-chip>
                </div>
                <q-list
                  dense
                  dark
                  separator
                >
                  <q-item
                    v-for="col in d.drilldown.collections"
                    :key="col.id"
                  >
                    <q-item-section avatar>
                      <q-icon
                        :name="col.status === 'success' ? 'cloud_done' : 'cloud_off'"
                        :color="col.status === 'success' ? 'positive' : 'negative'"
                        size="xs"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-white">
                        {{ col.endpoint_name }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ col.system_name }}
                        <span v-if="col.params_used"> · {{ formatParams(col.params_used) }}</span>
                      </q-item-label>
                      <q-item-label
                        v-if="col.error_message"
                        caption
                        class="text-negative"
                      >
                        ⚠ {{ col.error_message }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="text-caption text-grey-5">
                        {{ formatDate(col.collected_at) }}
                      </div>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="d.drilldown.collections.length === 0">
                    <q-item-section class="text-grey-6 text-center">
                      Nenhuma coleta
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </div>
          </q-slide-transition>
        </q-card>
      </div>

      <!-- CARD: Insights IA -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card
          class="stat-card futuristic-card cursor-pointer"
          @click="expanded.insights = !expanded.insights"
        >
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-overline text-grey-4">
                  INSIGHTS IA
                </div>
                <div class="text-h3 text-pink orbitron-font counter-value">
                  {{ d.overview.insights.total }}
                </div>
              </div>
              <div class="icon-wrapper icon-wrapper--pink">
                <q-icon
                  name="auto_awesome"
                  size="36px"
                  color="pink"
                />
              </div>
            </div>
            <div class="text-caption text-grey-5 q-mt-xs row items-center justify-between">
              <span>
                <q-icon
                  name="chat"
                  size="xs"
                  color="cyan"
                />
                {{ d.overview.insights.last24h }} hoje · {{ d.overview.insights.last7d }} (7d)
              </span>
              <q-icon
                :name="expanded.insights ? 'expand_less' : 'expand_more'"
                size="xs"
                color="grey-5"
              />
            </div>
          </q-card-section>

          <!-- DRILL-DOWN: Breakdown por tipo e severidade -->
          <q-slide-transition>
            <div v-show="expanded.insights">
              <q-separator dark />
              <q-card-section class="drilldown-section">
                <div class="text-caption text-grey-4 text-weight-bold q-mb-xs">
                  POR TIPO
                </div>
                <div class="row q-gutter-xs q-mb-sm">
                  <q-chip
                    v-for="it in d.drilldown.insightsByType"
                    :key="it.type"
                    dense
                    outline
                    :color="getActivityColor(it.type)"
                    size="sm"
                  >
                    <q-icon
                      :name="getActivityIcon(it.type)"
                      size="14px"
                      class="q-mr-xs"
                    />
                    {{ getTypeLabel(it.type) }}: {{ it.count }}
                  </q-chip>
                  <span
                    v-if="d.drilldown.insightsByType.length === 0"
                    class="text-grey-6 text-caption"
                  >—</span>
                </div>
                <div class="text-caption text-grey-4 text-weight-bold q-mb-xs">
                  POR SEVERIDADE
                </div>
                <div class="row q-gutter-xs">
                  <q-chip
                    v-for="sev in d.drilldown.insightsBySeverity"
                    :key="sev.severity"
                    dense
                    :color="getSeverityColor(sev.severity)"
                    text-color="white"
                    size="sm"
                  >
                    {{ sev.severity }}: {{ sev.count }}
                  </q-chip>
                  <span
                    v-if="d.drilldown.insightsBySeverity.length === 0"
                    class="text-grey-6 text-caption"
                  >—</span>
                </div>
              </q-card-section>
            </div>
          </q-slide-transition>
        </q-card>
      </div>
    </div>

    <!-- ═══════════════════ ROW 2: AI STATUS (expandível) ═══════════════════ -->
    <q-card
      class="futuristic-card q-mb-md ai-status-card cursor-pointer"
      @click="expanded.ai = !expanded.ai"
    >
      <q-card-section>
        <div class="row items-center q-gutter-lg">
          <!-- Status Badge -->
          <div
            class="ai-status-badge"
            :class="d.ai.status === 'Online' ? 'ai-online' : 'ai-offline'"
          >
            <q-icon
              :name="d.ai.status === 'Online' ? 'smart_toy' : 'power_off'"
              size="40px"
            />
          </div>

          <!-- Provider Info -->
          <div class="col">
            <div class="row items-center q-gutter-sm">
              <div class="text-h6 orbitron-font">
                Motor de IA
              </div>
              <q-chip
                dense
                :color="d.ai.status === 'Online' ? 'positive' : 'negative'"
                text-color="white"
                size="sm"
              >
                {{ d.ai.status }}
              </q-chip>
              <q-icon
                :name="expanded.ai ? 'expand_less' : 'expand_more'"
                size="sm"
                color="grey-5"
              />
            </div>
            <div class="text-body2 text-grey-4 q-mt-xs">
              <strong>Provedor:</strong> {{ d.ai.provider }} &nbsp;|&nbsp;
              <strong>Modelo:</strong> <code class="model-code">{{ d.ai.model }}</code>
            </div>
          </div>

          <!-- AI Metrics (top level) -->
          <div class="row q-gutter-lg ai-metrics">
            <div class="ai-metric text-center">
              <div class="text-h5 text-cyan orbitron-font">
                {{ formatTokens(d.ai.monthly.tokens) }}
              </div>
              <div class="text-caption text-grey-5">
                Tokens (mês)
              </div>
            </div>
            <q-separator
              vertical
              dark
            />
            <div class="ai-metric text-center">
              <div class="text-h5 text-positive orbitron-font">
                R$ {{ d.ai.monthly.cost.toFixed(4) }}
              </div>
              <div class="text-caption text-grey-5">
                Custo (mês)
              </div>
            </div>
            <q-separator
              vertical
              dark
            />
            <div class="ai-metric text-center">
              <div class="text-h5 text-purple orbitron-font">
                {{ d.ai.monthly.requests }}
              </div>
              <div class="text-caption text-grey-5">
                Requisições
              </div>
            </div>
            <q-separator
              vertical
              dark
            />
            <div class="ai-metric text-center">
              <div class="text-h5 text-amber orbitron-font">
                {{ d.ai.chatInteractions.last7d }}
              </div>
              <div class="text-caption text-grey-5">
                Chats (7d)
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- DRILL-DOWN: Detalhamento da IA -->
      <q-slide-transition>
        <div
          v-show="expanded.ai"
          @click.stop
        >
          <q-separator dark />
          <q-card-section class="drilldown-section">
            <div class="row q-col-gutter-md">
              <!-- Uso Hoje -->
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-4 text-weight-bold q-mb-sm">
                  📊 USO HOJE (24h)
                </div>
                <q-list
                  dense
                  dark
                  bordered
                  class="rounded-borders"
                >
                  <q-item>
                    <q-item-section>Tokens</q-item-section>
                    <q-item-section
                      side
                      class="text-cyan text-weight-bold"
                    >
                      {{ formatTokens(d.ai.today.tokens) }}
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>Custo</q-item-section>
                    <q-item-section
                      side
                      class="text-positive text-weight-bold"
                    >
                      R$ {{ d.ai.today.cost.toFixed(6) }}
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>Requisições</q-item-section>
                    <q-item-section
                      side
                      class="text-purple text-weight-bold"
                    >
                      {{ d.ai.today.requests }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Interações de Chat -->
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-4 text-weight-bold q-mb-sm">
                  💬 INTERAÇÕES DE CHAT
                </div>
                <q-list
                  dense
                  dark
                  bordered
                  class="rounded-borders"
                >
                  <q-item>
                    <q-item-section>Total geral</q-item-section>
                    <q-item-section
                      side
                      class="text-weight-bold"
                    >
                      {{ d.ai.chatInteractions.total }}
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>Últimas 24h</q-item-section>
                    <q-item-section
                      side
                      class="text-cyan text-weight-bold"
                    >
                      {{ d.ai.chatInteractions.last24h }}
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>Últimos 7 dias</q-item-section>
                    <q-item-section
                      side
                      class="text-amber text-weight-bold"
                    >
                      {{ d.ai.chatInteractions.last7d }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Últimas chamadas -->
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-4 text-weight-bold q-mb-sm">
                  🕐 ÚLTIMAS CHAMADAS
                </div>
                <q-list
                  dense
                  dark
                  bordered
                  class="rounded-borders"
                >
                  <q-item
                    v-for="chat in d.ai.recentChats"
                    :key="chat.id"
                  >
                    <q-item-section>
                      <q-item-label class="text-caption text-grey-3">
                        <code
                          class="model-code"
                          style="font-size:10px"
                        >{{ chat.model }}</code>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="text-caption text-grey-5">
                        {{ formatDate(chat.created_at) }}
                      </div>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="d.ai.recentChats.length === 0">
                    <q-item-section class="text-grey-6 text-center text-caption">
                      Nenhuma chamada
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>
          </q-card-section>
        </div>
      </q-slide-transition>
    </q-card>

    <!-- ═══════════════════ ROW 3: Activity + Recent Insights (expandível) ═══════════════════ -->
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card class="futuristic-card">
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-h6 orbitron-font">
                Atividade Recente
              </div>
              <q-badge
                color="cyan"
                outline
              >
                {{ d.recentInsights.length }} últimos
              </q-badge>
            </div>

            <q-list dark>
              <div
                v-if="d.recentInsights.length === 0"
                class="text-center q-pa-lg text-grey-6"
              >
                <q-icon
                  name="hourglass_empty"
                  size="32px"
                  class="q-mb-sm"
                /><br>
                Nenhuma atividade recente.
              </div>

              <template
                v-for="(insight, idx) in d.recentInsights"
                :key="idx"
              >
                <q-item
                  clickable
                  class="activity-item"
                  @click="toggleInsight(idx)"
                >
                  <q-item-section avatar>
                    <q-avatar
                      size="36px"
                      :color="getActivityColor(insight.type)"
                      text-color="white"
                    >
                      <q-icon
                        :name="getActivityIcon(insight.type)"
                        size="18px"
                      />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-white text-weight-medium">
                      {{ insight.title }}
                    </q-item-label>
                    <q-item-label caption>
                      <span v-if="insight.system">{{ insight.system.name }} · </span>
                      <span v-if="insight.endpoint">{{ insight.endpoint.name }} · </span>
                      {{ formatDate(insight.created_at) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row items-center q-gutter-xs">
                      <q-badge
                        :color="getSeverityColor(insight.severity)"
                        outline
                        dense
                      >
                        {{ insight.severity || 'info' }}
                      </q-badge>
                      <q-icon
                        :name="expandedInsights[idx] ? 'expand_less' : 'expand_more'"
                        size="xs"
                        color="grey-5"
                      />
                    </div>
                  </q-item-section>
                </q-item>

                <!-- DRILL-DOWN: Conteúdo do insight -->
                <q-slide-transition>
                  <div v-show="expandedInsights[idx]">
                    <div class="q-pa-md q-ml-xl insight-content">
                      <div class="row q-gutter-sm q-mb-sm">
                        <q-chip
                          dense
                          outline
                          color="cyan"
                          size="sm"
                          icon="label"
                        >
                          {{ getTypeLabel(insight.type) }}
                        </q-chip>
                        <q-chip
                          v-if="insight.model_used"
                          dense
                          outline
                          color="purple"
                          size="sm"
                          icon="smart_toy"
                        >
                          {{ insight.model_used }}
                        </q-chip>
                      </div>
                      <div
                        class="text-body2 text-grey-3 insight-text"
                        v-html="formatContent(insight.content)"
                      />
                    </div>
                    <q-separator dark />
                  </div>
                </q-slide-transition>
              </template>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { date } from 'quasar';
import { dashboardService, type DashboardSummary } from 'src/services/dashboard.service';

const router = useRouter();
const loading = ref(false);

const expanded = reactive({
  systems: false,
  endpoints: false,
  collections: false,
  insights: false,
  ai: false,
});

const expandedInsights = reactive<Record<number, boolean>>({});

function toggleInsight(idx: number) {
  expandedInsights[idx] = !expandedInsights[idx];
}

const emptyData: DashboardSummary = {
  overview: {
    systems: { total: 0, active: 0, inactive: 0 },
    endpoints: { total: 0, active: 0, inactive: 0 },
    insights: { total: 0, last24h: 0, last7d: 0 },
    collections: { total: 0, success: 0, errors: 0, last24h: 0, last7d: 0 },
  },
  ai: {
    status: 'Checking...', provider: '-', model: '-',
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

const d = ref<DashboardSummary>({ ...emptyData });

// ─── Formatters ──────────────────────────────────
function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatDate(dt: string): string {
  if (!dt) return '—';
  return date.formatDate(dt, 'DD/MM/YYYY HH:mm');
}

function formatParams(params: Record<string, any>): string {
  if (!params) return '';
  return Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ');
}

function formatContent(content: string): string {
  if (!content) return '';
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .substring(0, 800) + (content.length > 800 ? '...' : '');
}

// ─── Color / Label Helpers ───────────────────────
function getMethodColor(m?: string) {
  const c: Record<string, string> = { GET: 'positive', POST: 'warning', PUT: 'info', DELETE: 'negative' };
  return c[m || 'GET'] || 'grey';
}

function getEnvColor(e: string) {
  const m: Record<string, string> = { production: 'positive', staging: 'warning', development: 'info' };
  return m[e] || 'grey';
}

function getCritColor(c: string) {
  const m: Record<string, string> = { low: 'info', medium: 'warning', high: 'deep-orange', critical: 'negative' };
  return m[c] || 'grey';
}

function getCritLabel(c: string) {
  const m: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
  return m[c] || c;
}

function getActivityIcon(type: string) {
  const icons: Record<string, string> = {
    analysis: 'analytics', comparison: 'compare_arrows',
    anomaly: 'warning', forecast: 'trending_up', custom: 'chat',
  };
  return icons[type] || 'lightbulb';
}

function getActivityColor(type: string) {
  const colors: Record<string, string> = {
    analysis: 'cyan', comparison: 'purple',
    anomaly: 'amber', forecast: 'teal', custom: 'pink',
  };
  return colors[type] || 'grey-7';
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    analysis: 'Análise', comparison: 'Comparativo',
    anomaly: 'Anomalia', forecast: 'Previsão', custom: 'Personalizado',
  };
  return labels[type] || type;
}

function getSeverityColor(s: string) {
  const colors: Record<string, string> = {
    info: 'info', warning: 'warning', critical: 'negative', positive: 'positive',
  };
  return colors[s] || 'grey';
}

// ─── Data Loading ────────────────────────────────
async function loadStats() {
  loading.value = true;
  try {
    d.value = await dashboardService.getSummary();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => { loadStats(); });
</script>

<style lang="scss" scoped>
.orbitron-font {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 1px;
}

.futuristic-card {
  background: rgba(15, 15, 30, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: transform 0.3s ease, border-color 0.3s ease;

  &:hover {
    border-color: rgba(0, 245, 255, 0.2);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  }
}

.stat-card {
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.5), transparent);
  }
}

.counter-value {
  font-weight: 700;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
}

.icon-wrapper {
  width: 56px; height: 56px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid;

  &--cyan { background: rgba(0, 245, 255, 0.1); border-color: rgba(0, 245, 255, 0.2); }
  &--purple { background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.2); }
  &--amber { background: rgba(255, 193, 7, 0.1); border-color: rgba(255, 193, 7, 0.2); }
  &--pink { background: rgba(236, 72, 153, 0.1); border-color: rgba(236, 72, 153, 0.2); }
}

// Drill-down sections
.drilldown-section {
  max-height: 300px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 245, 255, 0.3); border-radius: 4px; }
}

// AI Status Card
.ai-status-card {
  border-left: 3px solid rgba(0, 245, 255, 0.3);
}

.ai-status-badge {
  width: 70px; height: 70px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;

  &.ai-online {
    background: rgba(16, 185, 129, 0.15);
    border: 2px solid rgba(16, 185, 129, 0.4);
    color: #10b981;
    animation: pulse-glow 2s infinite;
  }

  &.ai-offline {
    background: rgba(239, 68, 68, 0.15);
    border: 2px solid rgba(239, 68, 68, 0.4);
    color: #ef4444;
  }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.3); }
  50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
}

.model-code {
  background: rgba(0, 245, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  color: #22d3ee;
  font-size: 0.85em;
}

.ai-metrics { flex-wrap: wrap; }
.ai-metric { min-width: 90px; }

// Activity & Insights
.activity-item {
  transition: background 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.03); }
}

.insight-content {
  background: rgba(0, 0, 0, 0.25);
  border-left: 3px solid rgba(0, 245, 255, 0.3);
  border-radius: 0 8px 8px 0;
}

.insight-text {
  line-height: 1.6;
  font-size: 0.9em;
}

.refresh-btn {
  border: 1px solid rgba(0, 245, 255, 0.3);
  border-radius: 8px;
  &:hover { background: rgba(0, 245, 255, 0.1); }
}

// ═══════════════ RESPONSIVIDADE MOBILE ═══════════════
@media (max-width: 599px) {
  .dashboard-page {
    padding: 8px !important;
  }

  .dashboard-page > .row:first-child {
    flex-direction: column;
    gap: 8px;

    .text-h4 {
      font-size: 1.3rem !important;
    }
  }

  .counter-value {
    font-size: 1.8rem !important;
  }

  .icon-wrapper {
    width: 44px;
    height: 44px;
  }

  // AI Status Card - stack vertically
  .ai-status-card .row.items-center.q-gutter-lg {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }

  .ai-status-badge {
    width: 50px;
    height: 50px;
  }

  .ai-metrics {
    width: 100%;
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    .q-separator--vertical {
      display: none;
    }
  }

  .ai-metric {
    min-width: 0;
    text-align: left !important;

    .text-h5 {
      font-size: 1.1rem !important;
    }
  }

  .model-code {
    font-size: 0.75em;
    word-break: break-all;
  }

  // Drill-down sections
  .drilldown-section {
    max-height: 250px;
    padding: 8px !important;
  }

  // Activity section
  .activity-item {
    padding: 8px 4px !important;
  }

  .insight-content {
    margin-left: 8px !important;
    padding: 10px !important;
  }
}

@media (max-width: 400px) {
  .counter-value {
    font-size: 1.5rem !important;
  }

  .ai-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
