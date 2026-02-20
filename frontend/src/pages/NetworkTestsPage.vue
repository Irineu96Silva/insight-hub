<template>
  <q-page class="q-pa-md network-tests-page">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 text-white q-my-none orbitron-font">
          Testes de Rede
        </h1>
        <div class="text-subtitle2 text-grey-5">
          Monitoramento proativo de conectividade e saúde dos sistemas
        </div>
      </div>
    </div>

    <!-- System Selector -->
    <q-card class="glass-card q-mb-lg">
      <q-card-section class="row items-center q-gutter-md">
        <q-select
          v-model="selectedSystem"
          :options="systemOptions"
          label="Selecione um Sistema"
          dark
          outlined
          dense
          color="cyan"
          emit-value
          map-options
          style="min-width: 300px"
          @update:model-value="onSystemChange"
        />
        <q-btn
          icon="play_arrow"
          label="Rodar Todos os Testes"
          color="cyan"
          unelevated
          :loading="running"
          :disable="!selectedSystem"
          class="orbitron-font"
          @click="runAllTests"
        />
        <q-space />
        <div
          v-if="lastRun"
          class="text-caption text-grey-5"
        >
          <q-icon
            name="schedule"
            class="q-mr-xs"
          />
          Última execução: {{ formatDate(lastRun) }}
        </div>
      </q-card-section>
    </q-card>

    <!-- Status Dashboard Cards -->
    <div
      v-if="latestResults.length > 0"
      class="row q-col-gutter-md q-mb-lg"
    >
      <div
        v-for="result in latestResults"
        :key="result.test_type"
        class="col-12 col-sm-6 col-md-3"
      >
        <q-card
          class="glass-card full-height test-card"
          :class="'border-' + getStatusClass(result.status)"
        >
          <q-card-section class="text-center">
            <q-icon
              :name="getTestIcon(result.test_type)"
              :color="getStatusColor(result.status)"
              size="48px"
              class="q-mb-sm"
            />
            <div class="text-subtitle1 text-weight-bold q-mb-xs">
              {{ result.test_type }}
            </div>
            <q-badge
              :color="getStatusColor(result.status)"
              class="q-pa-xs text-weight-bold"
            >
              {{ result.status }}
            </q-badge>
            <div
              class="text-caption text-grey-5 q-mt-sm"
              style="min-height: 36px;"
            >
              {{ result.status_message }}
            </div>
            <div
              v-if="result.response_time_ms"
              class="text-h5 q-mt-sm"
              :class="'text-' + getStatusColor(result.status)"
            >
              {{ result.response_time_ms }}<span class="text-caption">ms</span>
            </div>
          </q-card-section>

          <!-- Re-run single test -->
          <q-card-actions align="center">
            <q-btn
              flat
              dense
              size="sm"
              color="cyan"
              icon="refresh"
              label="Re-testar"
              :loading="runningSingle === result.test_type"
              @click="runSingleTest(result.test_type)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!running && selectedSystem"
      class="text-center q-pa-xl"
    >
      <q-icon
        name="lan"
        size="64px"
        color="grey-6"
        class="q-mb-md"
      />
      <div class="text-h6 text-grey-5 q-mb-sm">
        Nenhum teste executado
      </div>
      <div class="text-grey-6 q-mb-lg">
        Clique em "Rodar Todos os Testes" para iniciar a verificação.
      </div>
    </div>

    <div
      v-else-if="!selectedSystem"
      class="text-center q-pa-xl"
    >
      <q-icon
        name="touch_app"
        size="64px"
        color="grey-6"
        class="q-mb-md"
      />
      <div class="text-h6 text-grey-5">
        Selecione um sistema acima para começar
      </div>
    </div>

    <!-- History Timeline -->
    <q-card
      v-if="history.length > 0"
      class="glass-card q-mt-lg"
    >
      <q-card-section>
        <div class="text-h6 text-cyan q-mb-md">
          Histórico de Testes
        </div>
      </q-card-section>
      <q-card-section class="q-pa-none">
        <q-table
          :rows="history"
          :columns="historyColumns"
          row-key="id"
          dark
          flat
          bordered
          :rows-per-page-options="[10, 25, 50]"
          class="history-table"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.row.status)">
                {{ props.row.status }}
              </q-badge>
            </q-td>
          </template>
          <template #body-cell-test_type="props">
            <q-td :props="props">
              <q-icon
                :name="getTestIcon(props.row.test_type)"
                size="18px"
                class="q-mr-xs"
              />
              {{ props.row.test_type }}
            </q-td>
          </template>
          <template #body-cell-response_time_ms="props">
            <q-td :props="props">
              <span :class="getLatencyClass(props.row.response_time_ms)">
                {{ props.row.response_time_ms || '-' }}ms
              </span>
            </q-td>
          </template>
          <template #body-cell-details="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                size="sm"
                color="cyan"
                icon="info"
                @click="showDetailDialog(props.row)"
              >
                <q-tooltip>Ver detalhes</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Detail Dialog -->
    <q-dialog v-model="detailDialogVisible">
      <q-card
        class="bg-dark text-white"
        style="min-width: 0; max-width: 700px; width: 100%;"
      >
        <q-card-section>
          <div class="text-h6">
            <q-icon
              :name="getTestIcon(detailItem?.test_type || '')"
              class="q-mr-sm"
            />
            Detalhes — {{ detailItem?.test_type }}
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section
          class="scroll"
          style="max-height: 400px;"
        >
          <div class="q-mb-md">
            <div class="text-caption text-grey-5">
              Alvo
            </div>
            <div>{{ detailItem?.target }}</div>
          </div>
          <div class="q-mb-md">
            <div class="text-caption text-grey-5">
              Status
            </div>
            <q-badge :color="getStatusColor(detailItem?.status || 'OK')">
              {{ detailItem?.status }}
            </q-badge>
          </div>
          <div class="q-mb-md">
            <div class="text-caption text-grey-5">
              Mensagem
            </div>
            <div>{{ detailItem?.status_message }}</div>
          </div>
          <div class="q-mb-md">
            <div class="text-caption text-grey-5">
              Tempo de Resposta
            </div>
            <div>{{ detailItem?.response_time_ms }}ms</div>
          </div>
          <div>
            <div class="text-caption text-grey-5 q-mb-xs">
              Dados Técnicos
            </div>
            <pre
              class="bg-black q-pa-sm rounded-borders overflow-auto"
              style="max-height: 200px; font-size: 0.8rem;"
            >{{ JSON.stringify(detailItem?.details, null, 2) }}</pre>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            flat
            label="Fechar"
            color="cyan"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar, date } from 'quasar';
import { networkTestsService, type NetworkTestResult } from 'src/services/network-tests.service';
import { useSystemsStore } from 'src/stores/systems.store';

const $q = useQuasar();
const systemsStore = useSystemsStore();

const selectedSystem = ref<string | null>(null);
const running = ref(false);
const runningSingle = ref<string | null>(null);
const latestResults = ref<NetworkTestResult[]>([]);
const history = ref<NetworkTestResult[]>([]);
const detailDialogVisible = ref(false);
const detailItem = ref<NetworkTestResult | null>(null);

const systemOptions = computed(() => {
  return systemsStore.systems
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      label: `${s.name}${s.ip_address ? ' (' + s.ip_address + ')' : ''}`,
      value: s.id
    }));
});

const lastRun = computed(() => {
  if (latestResults.value.length === 0) return null;
  return latestResults.value[0]?.created_at ?? null;
});

const historyColumns = [
  { name: 'test_type', label: 'Tipo', field: 'test_type', align: 'left' as const, sortable: true },
  { name: 'target', label: 'Alvo', field: 'target', align: 'left' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'center' as const, sortable: true },
  { name: 'response_time_ms', label: 'Latência', field: 'response_time_ms', align: 'center' as const, sortable: true },
  { name: 'status_message', label: 'Mensagem', field: 'status_message', align: 'left' as const },
  { name: 'created_at', label: 'Data', field: (row: NetworkTestResult) => date.formatDate(row.created_at, 'DD/MM HH:mm:ss'), align: 'right' as const, sortable: true },
  { name: 'details', label: '', field: 'details', align: 'center' as const },
];

async function onSystemChange() {
  if (!selectedSystem.value) return;
  await loadLatest();
  await loadHistory();
}

async function loadLatest() {
  if (!selectedSystem.value) return;
  try {
    latestResults.value = await networkTestsService.getLatest(selectedSystem.value);
  } catch (e) {
    console.error(e);
  }
}

async function loadHistory() {
  if (!selectedSystem.value) return;
  try {
    history.value = await networkTestsService.getHistory(selectedSystem.value, 50);
  } catch (e) {
    console.error(e);
  }
}

async function runAllTests() {
  if (!selectedSystem.value) return;
  running.value = true;
  try {
    const results = await networkTestsService.runAll(selectedSystem.value);
    latestResults.value = results;

    const criticalCount = results.filter(r => r.status === 'CRITICAL' || r.status === 'TIMEOUT').length;
    if (criticalCount > 0) {
      $q.notify({ type: 'negative', message: `⚠️ ${criticalCount} teste(s) com falha crítica!`, timeout: 5000 });
    } else {
      $q.notify({ type: 'positive', message: '✅ Todos os testes concluídos!', timeout: 3000 });
    }

    await loadHistory();
  } catch (e: any) {
    console.error(e);
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Erro ao executar testes' });
  } finally {
    running.value = false;
  }
}

async function runSingleTest(type: string) {
  if (!selectedSystem.value) return;
  runningSingle.value = type;
  try {
    const result = await networkTestsService.runSingle(selectedSystem.value, type);
    // Replace result in latestResults
    const idx = latestResults.value.findIndex(r => r.test_type === type);
    if (idx >= 0) {
      latestResults.value[idx] = result;
    } else {
      latestResults.value.push(result);
    }
    await loadHistory();
  } catch (e: any) {
    console.error(e);
    $q.notify({ type: 'negative', message: `Erro no teste ${type}` });
  } finally {
    runningSingle.value = null;
  }
}

function showDetailDialog(item: NetworkTestResult) {
  detailItem.value = item;
  detailDialogVisible.value = true;
}

function getStatusColor(status: string) {
  const m: Record<string, string> = { OK: 'positive', WARNING: 'warning', CRITICAL: 'negative', TIMEOUT: 'deep-orange' };
  return m[status] || 'grey';
}

function getStatusClass(status: string) {
  const m: Record<string, string> = { OK: 'positive', WARNING: 'warning', CRITICAL: 'negative', TIMEOUT: 'negative' };
  return m[status] || 'grey';
}

function getTestIcon(type: string) {
  const m: Record<string, string> = { HTTP: 'http', PORT: 'settings_ethernet', DNS: 'dns', SSL: 'lock' };
  return m[type] || 'lan';
}

function getLatencyClass(ms: number) {
  if (!ms) return 'text-grey';
  if (ms < 200) return 'text-positive';
  if (ms < 1000) return 'text-warning';
  return 'text-negative';
}

function formatDate(dateStr: string) {
  return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm:ss');
}

onMounted(async () => {
  await systemsStore.fetchSystems();
});
</script>

<style lang="scss" scoped>
.network-tests-page {
  max-width: 1400px;
  margin: 0 auto;
}

.orbitron-font {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 0.5px;
}

.glass-card {
  border-radius: 16px;
}

.test-card {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;

  &.border-positive { border-left-color: var(--q-positive); }
  &.border-warning { border-left-color: var(--q-warning); }
  &.border-negative { border-left-color: var(--q-negative); }
  &.border-grey { border-left-color: grey; }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
}

.full-height {
  height: 100%;
}

.history-table {
  background: transparent !important;

  :deep(th) {
    font-size: 0.8rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
  }

  :deep(td) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
}

// ═══════════════ RESPONSIVIDADE MOBILE ═══════════════
@media (max-width: 599px) {
  .network-tests-page {
    padding: 8px !important;
  }

  .network-tests-page .row.items-center.justify-between .text-h4 {
    font-size: 1.3rem !important;
  }

  // System selector - stack vertically
  .glass-card > .q-card__section.row {
    flex-direction: column;
    gap: 8px;

    .q-select {
      min-width: 0 !important;
      width: 100%;
    }

    .q-btn {
      width: 100%;
    }
  }

  // History table horizontal scroll
  .history-table {
    :deep(.q-table__container) {
      overflow-x: auto;
    }
  }
}
</style>
