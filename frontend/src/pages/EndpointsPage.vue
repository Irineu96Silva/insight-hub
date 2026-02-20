<template>
  <q-page class="endpoints-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <q-icon
              name="api"
              class="title-icon"
            />
            Endpoints
          </h1>
          <p class="page-subtitle">
            Gerencie as APIs monitoradas e colete dados com cache inteligente
          </p>
        </div>
        <div class="header-right">
          <q-btn
            color="cyan"
            icon="add"
            label="Novo Endpoint"
            class="add-btn"
            unelevated
            @click="openCreateDialog"
          />
        </div>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="filters-bar">
      <q-input
        v-model="searchQuery"
        placeholder="Buscar endpoints..."
        dense
        borderless
        class="search-input"
      >
        <template #prepend>
          <q-icon
            name="search"
            color="grey-6"
          />
        </template>
      </q-input>
      <div class="method-filters">
        <q-chip
          v-for="method in methods"
          :key="method.value"
          :outline="activeMethod !== method.value"
          :color="activeMethod === method.value ? method.color : 'grey-8'"
          text-color="white"
          clickable
          class="filter-chip"
          @click="activeMethod = method.value"
        >
          {{ method.label }}
        </q-chip>
      </div>
    </div>

    <!-- Endpoints List -->
    <div
      v-if="!endpointsStore.loading"
      class="endpoints-list"
    >
      <div
        v-for="endpoint in filteredEndpoints"
        :key="endpoint.id"
        class="endpoint-card"
      >
        <div
          class="endpoint-card__method"
          :class="`endpoint-card__method--${endpoint.method?.toLowerCase()}`"
        >
          {{ endpoint.method || 'GET' }}
        </div>

        <div class="endpoint-card__content">
          <div class="endpoint-card__header">
            <h3 class="endpoint-card__name">
              {{ endpoint.name }}
            </h3>
            <q-badge
              v-if="endpoint.response_type === 'csv'"
              color="amber-8"
              text-color="white"
              class="response-badge"
            >
              CSV
            </q-badge>
            <q-badge
              v-else
              color="teal-8"
              text-color="white"
              class="response-badge"
            >
              JSON
            </q-badge>
            <div class="endpoint-card__status">
              <div class="status-dot status-dot--online" />
              <span>Ativo</span>
            </div>
          </div>
          <p class="endpoint-card__url">
            {{ endpoint.url_template }}
          </p>
          <div class="endpoint-card__meta">
            <span
              v-if="endpoint.system?.name"
              class="meta-tag"
            >
              <q-icon
                name="dns"
                size="14px"
              />
              {{ endpoint.system.name }}
            </span>
            <span
              v-if="endpoint.last_collected_at"
              class="meta-tag"
            >
              <q-icon
                name="schedule"
                size="14px"
              />
              {{ formatDate(endpoint.last_collected_at) }}
            </span>
            <span
              v-if="hasParams(endpoint)"
              class="meta-tag meta-tag--params"
            >
              <q-icon
                name="tune"
                size="14px"
              />
              {{ getParamNames(endpoint).join(', ') }}
            </span>
          </div>
        </div>

        <div class="endpoint-card__actions">
          <q-btn
            flat
            round
            icon="download"
            size="sm"
            color="cyan"
            @click="openCollectDialog(endpoint)"
          >
            <q-tooltip>Coletar Dados</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="visibility"
            size="sm"
            color="teal"
            @click="viewCollectedData(endpoint)"
          >
            <q-tooltip>Ver Dados</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="play_arrow"
            size="sm"
            color="positive"
            @click="testEndpoint(endpoint)"
          >
            <q-tooltip>Testar</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="edit"
            size="sm"
            color="purple"
            @click="openEditDialog(endpoint)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="delete"
            size="sm"
            color="pink"
            @click="confirmDelete(endpoint)"
          >
            <q-tooltip>Excluir</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredEndpoints.length === 0"
        class="empty-state"
      >
        <div class="empty-state__icon">
          <q-icon
            name="http"
            size="64px"
          />
        </div>
        <h3 class="empty-state__title">
          Nenhum endpoint encontrado
        </h3>
        <p class="empty-state__text">
          Adicione um novo endpoint para começar o monitoramento
        </p>
        <q-btn
          color="cyan"
          icon="add"
          label="Adicionar Endpoint"
          unelevated
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-else
      class="loading-state"
    >
      <q-spinner-orbit
        color="cyan"
        size="64px"
      />
      <span>Carregando endpoints...</span>
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog
      v-model="dialogOpen"
      class="futuristic-dialog"
    >
      <q-card class="dialog-card">
        <div class="dialog-card__glow" />

        <q-card-section class="dialog-header">
          <div class="dialog-header__icon">
            <q-icon
              :name="isEdit ? 'edit' : 'add_circle'"
              size="24px"
            />
          </div>
          <h2 class="dialog-header__title">
            {{ isEdit ? 'Editar Endpoint' : 'Novo Endpoint' }}
          </h2>
        </q-card-section>

        <q-card-section class="dialog-body">
          <q-form
            class="dialog-form"
            @submit="handleSave"
          >
            <div class="field-wrapper">
              <label class="field-label">Sistema</label>
              <q-select
                v-model="form.system_id"
                :options="systemOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                dense
                borderless
                class="futuristic-input"
                popup-content-class="dark-select-popup"
                :rules="[val => !!val || 'Selecione um sistema']"
              >
                <template #prepend>
                  <q-icon
                    name="dns"
                    color="cyan"
                  />
                </template>
              </q-select>
            </div>

            <div class="field-wrapper">
              <label class="field-label">Nome</label>
              <q-input
                v-model="form.name"
                placeholder="Ex: Cartões Ativos por Mês"
                dense
                borderless
                class="futuristic-input"
                :rules="[val => !!val || 'Nome obrigatório']"
              >
                <template #prepend>
                  <q-icon
                    name="badge"
                    color="cyan"
                  />
                </template>
              </q-input>
            </div>

            <div class="field-wrapper">
              <label class="field-label">Descrição</label>
              <q-input
                v-model="form.description"
                placeholder="Descreva o que este endpoint retorna..."
                dense
                borderless
                type="textarea"
                autogrow
                class="futuristic-input"
              />
            </div>

            <div class="field-row">
              <div class="field-wrapper field-wrapper--small">
                <label class="field-label">Método</label>
                <q-select
                  v-model="form.method"
                  :options="['GET', 'POST', 'PUT', 'DELETE', 'PATCH']"
                  dense
                  borderless
                  class="futuristic-input"
                  popup-content-class="dark-select-popup"
                />
              </div>
              <div class="field-wrapper field-wrapper--medium">
                <label class="field-label">Tipo Resposta</label>
                <q-select
                  v-model="form.response_type"
                  :options="[{ label: 'JSON', value: 'json' }, { label: 'CSV', value: 'csv' }]"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  dense
                  borderless
                  class="futuristic-input"
                  popup-content-class="dark-select-popup"
                />
              </div>
            </div>

            <div class="field-wrapper">
              <label class="field-label">URL Template</label>
              <q-input
                v-model="form.url_template"
                placeholder="/ords/sistema/endpoint/:mes/:ano"
                dense
                borderless
                class="futuristic-input"
                :rules="[val => !!val || 'URL obrigatória']"
                hint="Use :param para parâmetros dinâmicos"
              >
                <template #prepend>
                  <q-icon
                    name="link"
                    color="cyan"
                  />
                </template>
              </q-input>
            </div>

            <!-- Dynamic Params Preview -->
            <div
              v-if="detectedParams.length > 0"
              class="params-preview"
            >
              <label class="field-label">Parâmetros Detectados</label>
              <div class="params-chips">
                <q-chip
                  v-for="param in detectedParams"
                  :key="param"
                  color="cyan-9"
                  text-color="white"
                  icon="tune"
                  size="sm"
                >
                  :{{ param }}
                </q-chip>
              </div>
            </div>

            <div class="dialog-actions">
              <q-btn
                v-close-popup
                flat
                label="Cancelar"
                color="grey-6"
              />
              <q-btn
                type="submit"
                label="Salvar"
                color="cyan"
                unelevated
                class="save-btn"
                :loading="endpointsStore.loading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Collect Dialog -->
    <q-dialog
      v-model="collectDialogOpen"
      class="futuristic-dialog"
    >
      <q-card class="dialog-card">
        <div class="dialog-card__glow" />

        <q-card-section class="dialog-header">
          <div class="dialog-header__icon dialog-header__icon--collect">
            <q-icon
              name="download"
              size="24px"
            />
          </div>
          <h2 class="dialog-header__title">
            Coletar Dados
          </h2>
          <p class="dialog-header__subtitle">
            {{ collectingEndpoint?.name }}
          </p>
        </q-card-section>

        <q-card-section class="dialog-body">
          <div
            v-if="collectParams.length > 0"
            class="dialog-form"
          >
            <div
              v-for="param in collectParams"
              :key="param"
              class="field-wrapper"
            >
              <label class="field-label">{{ param.toUpperCase() }}</label>
              <q-input
                v-model="collectFormValues[param]"
                :placeholder="`Valor para :${param}`"
                dense
                borderless
                class="futuristic-input"
                type="number"
              >
                <template #prepend>
                  <q-icon
                    name="tune"
                    color="cyan"
                  />
                </template>
              </q-input>
            </div>
          </div>
          <div
            v-else
            class="no-params-msg"
          >
            <q-icon
              name="info"
              color="cyan"
              size="20px"
            />
            Este endpoint não possui parâmetros. Coletar diretamente?
          </div>

          <div class="dialog-actions">
            <q-btn
              v-close-popup
              flat
              label="Cancelar"
              color="grey-6"
            />
            <q-btn
              label="Coletar"
              icon="download"
              color="cyan"
              unelevated
              class="save-btn"
              :loading="endpointsStore.collecting"
              @click="executeCollect"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Collected Data Viewer Dialog -->
    <q-dialog
      v-model="dataDialogOpen"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="data-viewer-card">
        <q-bar class="data-viewer-bar">
          <q-icon name="storage" />
          <span>Dados Coletados — {{ dataViewEndpoint?.name }}</span>
          <q-space />
          <q-btn
            v-close-popup
            dense
            flat
            icon="close"
          />
        </q-bar>

        <q-card-section>
          <div
            v-if="endpointsStore.collectedData.length > 0"
            class="data-list"
          >
            <q-card
              v-for="item in endpointsStore.collectedData"
              :key="item.id"
              class="data-item"
              flat
              bordered
            >
              <q-card-section>
                <div class="data-item__header">
                  <q-badge
                    :color="item.status === 'success' ? 'positive' : 'negative'"
                  >
                    {{ item.status }}
                  </q-badge>
                  <span class="data-item__date">
                    {{ formatDate(item.collected_at) }}
                  </span>
                  <span
                    v-if="item.params_used"
                    class="data-item__params"
                  >
                    Params: {{ JSON.stringify(item.params_used) }}
                  </span>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <div class="data-item__content">
                  <div
                    v-if="item.processed_data"
                    class="data-summary"
                  >
                    <span class="summary-label">Total items:</span>
                    <span class="summary-value">{{ item.processed_data.total_items || '—' }}</span>
                  </div>
                  <pre class="data-raw">{{ JSON.stringify(Array.isArray(item.raw_data) ? item.raw_data.slice(0, 10) : item.raw_data, null, 2) }}</pre>
                  <p
                    v-if="Array.isArray(item.raw_data) && item.raw_data.length > 10"
                    class="data-truncated"
                  >
                    ...e mais {{ item.raw_data.length - 10 }} registros
                  </p>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div
            v-else
            class="empty-state"
          >
            <q-icon
              name="inbox"
              size="48px"
              color="grey-6"
            />
            <p>Nenhum dado coletado ainda</p>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useEndpointsStore } from 'src/stores/endpoints.store';
import { useSystemsStore } from 'src/stores/systems.store';
import { useQuasar } from 'quasar';
import type { Endpoint } from 'src/types';

const endpointsStore = useEndpointsStore();
const systemsStore = useSystemsStore();
const $q = useQuasar();

const searchQuery = ref('');
const activeMethod = ref('all');
const dialogOpen = ref(false);
const isEdit = ref(false);

const collectDialogOpen = ref(false);
const collectingEndpoint = ref<Endpoint | null>(null);
const collectFormValues = reactive<Record<string, any>>({});

const dataDialogOpen = ref(false);
const dataViewEndpoint = ref<Endpoint | null>(null);

const form = reactive({
  id: '',
  system_id: '',
  name: '',
  description: '',
  method: 'GET',
  url_template: '',
  response_type: 'json' as 'json' | 'csv',
});

const methods = [
  { label: 'Todos', value: 'all', color: 'cyan' },
  { label: 'GET', value: 'GET', color: 'positive' },
  { label: 'POST', value: 'POST', color: 'info' },
  { label: 'PUT', value: 'PUT', color: 'warning' },
  { label: 'DELETE', value: 'DELETE', color: 'negative' },
];

const systemOptions = computed(() =>
  systemsStore.systems.map(s => ({ label: s.name, value: s.id }))
);

const detectedParams = computed(() => {
  const matches = form.url_template.match(/:(\w+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
});

const filteredEndpoints = computed(() => {
  let endpoints = endpointsStore.endpoints;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    endpoints = endpoints.filter(e =>
      e.name?.toLowerCase().includes(query) ||
      e.url_template?.toLowerCase().includes(query) ||
      e.system?.name?.toLowerCase().includes(query)
    );
  }

  if (activeMethod.value !== 'all') {
    endpoints = endpoints.filter(e => e.method === activeMethod.value);
  }

  return endpoints;
});

const collectParams = computed(() => {
  if (!collectingEndpoint.value) return [];
  const matches = collectingEndpoint.value.url_template.match(/:(\w+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
});

onMounted(() => {
  endpointsStore.fetchAll();
  systemsStore.fetchSystems();
});

function openCreateDialog() {
  isEdit.value = false;
  form.id = '';
  form.system_id = '';
  form.name = '';
  form.description = '';
  form.method = 'GET';
  form.url_template = '';
  form.response_type = 'json';
  dialogOpen.value = true;
}

function openEditDialog(endpoint: Endpoint) {
  isEdit.value = true;
  form.id = endpoint.id;
  form.system_id = endpoint.system_id;
  form.name = endpoint.name || '';
  form.description = endpoint.description || '';
  form.method = endpoint.method || 'GET';
  form.url_template = endpoint.url_template || '';
  form.response_type = endpoint.response_type || 'json';
  dialogOpen.value = true;
}

async function handleSave() {
  try {
    const payload = {
      system_id: form.system_id,
      name: form.name,
      description: form.description || undefined,
      method: form.method,
      url_template: form.url_template,
      response_type: form.response_type,
    };

    if (isEdit.value) {
      await endpointsStore.updateEndpoint(form.id, payload);
      $q.notify({
        type: 'positive',
        message: 'Endpoint atualizado com sucesso!',
        icon: 'check_circle',
      });
    } else {
      await endpointsStore.createEndpoint(payload);
      $q.notify({
        type: 'positive',
        message: 'Endpoint criado com sucesso!',
        icon: 'check_circle',
      });
    }

    dialogOpen.value = false;
    endpointsStore.fetchAll();
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Erro ao salvar endpoint',
      icon: 'error',
    });
  }
}

function confirmDelete(endpoint: Endpoint) {
  $q.dialog({
    title: 'Confirmar Exclusão',
    message: `Deseja excluir o endpoint "${endpoint.name}"?`,
    cancel: { flat: true, color: 'grey-6' },
    ok: { color: 'negative', flat: true, label: 'Excluir' },
    persistent: true,
  }).onOk(async () => {
    try {
      await endpointsStore.deleteEndpoint(endpoint.id);
      $q.notify({
        type: 'positive',
        message: 'Endpoint excluído!',
        icon: 'check_circle',
      });
    } catch (err: any) {
      $q.notify({
        type: 'negative',
        message: err.message || 'Erro ao excluir',
        icon: 'error',
      });
    }
  });
}

function testEndpoint(endpoint: Endpoint) {
  $q.notify({
    type: 'info',
    message: `Testando endpoint: ${endpoint.name}`,
    icon: 'play_arrow',
  });
}

function openCollectDialog(endpoint: Endpoint) {
  collectingEndpoint.value = endpoint;
  // Preencher com valores defaults (mês/ano atual)
  const now = new Date();
  const params = endpoint.url_template.match(/:(\w+)/g)?.map(m => m.slice(1)) || [];
  params.forEach(p => {
    if (p === 'mes') collectFormValues[p] = now.getMonth() + 1;
    else if (p === 'ano') collectFormValues[p] = now.getFullYear();
    else collectFormValues[p] = '';
  });
  collectDialogOpen.value = true;
}

async function executeCollect() {
  if (!collectingEndpoint.value) return;

  try {
    const params: Record<string, any> = {};
    collectParams.value.forEach(p => {
      params[p] = collectFormValues[p];
    });

    const result = await endpointsStore.collectData(
      collectingEndpoint.value.id,
      params,
    );

    $q.notify({
      type: 'positive',
      message: `Dados coletados com sucesso!${result.csv_raw ? ' (CSV parseado)' : ''}`,
      caption: result.processed_data?.total_items
        ? `${result.processed_data.total_items} registros`
        : undefined,
      icon: 'check_circle',
    });

    collectDialogOpen.value = false;
    endpointsStore.fetchAll(); // Refresh last_collected_at
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Erro ao coletar dados',
      icon: 'error',
    });
  }
}

async function viewCollectedData(endpoint: Endpoint) {
  dataViewEndpoint.value = endpoint;
  dataDialogOpen.value = true;
  await endpointsStore.fetchCollectedData(endpoint.id);
}

function hasParams(endpoint: Endpoint): boolean {
  return /:(\w+)/.test(endpoint.url_template || '');
}

function getParamNames(endpoint: Endpoint): string[] {
  const matches = endpoint.url_template?.match(/:(\w+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style lang="scss" scoped>
.endpoints-page {
  padding: 24px;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;

  .title-icon {
    color: #00f5ff;
    filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.5));
  }
}

.page-subtitle {
  color: #64748b;
  margin-top: 6px;
  font-size: 0.9rem;
}

.add-btn {
  background: linear-gradient(135deg, #00f5ff 0%, #3b82f6 100%) !important;
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
}

// Filters
.filters-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  max-width: 400px;

  :deep(.q-field__control) {
    background: rgba(15, 15, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 8px 16px;
  }

  :deep(.q-field__native) {
    color: #f1f5f9;
  }
}

.method-filters {
  display: flex;
  gap: 8px;
}

.filter-chip {
  font-size: 0.8rem;
}

// Endpoints List
.endpoints-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.endpoint-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  background: linear-gradient(
    135deg,
    rgba(15, 15, 30, 0.9) 0%,
    rgba(10, 10, 20, 0.95) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 245, 255, 0.2);
    transform: translateX(4px);
  }

  &__method {
    min-width: 70px;
    padding: 8px 12px;
    border-radius: 10px;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;

    &--get {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    &--post {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    &--put {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }

    &--delete {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }

    &--patch {
      background: rgba(168, 85, 247, 0.15);
      color: #a855f7;
      border: 1px solid rgba(168, 85, 247, 0.3);
    }
  }

  &__content {
    flex: 1;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  &__name {
    font-family: 'Orbitron', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    color: #22d3ee;
  }

  &__url {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0 0 10px;
    font-family: monospace;
  }

  &__meta {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__actions {
    display: flex;
    gap: 4px;
  }
}

.response-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #94a3b8;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;

  .q-icon {
    color: #00f5ff;
  }

  &--params {
    color: #fbbf24;

    .q-icon {
      color: #fbbf24;
    }
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &--online {
    background: #22d3ee;
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
  }
}

// Params Preview
.params-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.params-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

// No Params
.no-params-msg {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(0, 245, 255, 0.05);
  border-radius: 12px;
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;

  &__icon {
    width: 100px;
    height: 100px;
    background: rgba(15, 15, 30, 0.8);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
    margin-bottom: 24px;
  }

  &__title {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.25rem;
    color: #f1f5f9;
    margin: 0 0 8px;
  }

  &__text {
    color: #64748b;
    margin: 0 0 24px;
    font-size: 0.9rem;
  }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: #64748b;
}

// Dialog
.dialog-card {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    135deg,
    rgba(15, 15, 30, 0.98) 0%,
    rgba(8, 8, 18, 0.99) 100%
  );
  border: 1px solid rgba(0, 245, 255, 0.15);
  border-radius: 24px;
  position: relative;
  overflow: visible;

  &__glow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(0, 245, 255, 0.05) 0%,
      transparent 50%
    );
    pointer-events: none;
    z-index: 0;
  }
}

.dialog-header {
  text-align: center;
  padding: 32px 32px 24px;
  position: relative;

  &__icon {
    width: 56px;
    height: 56px;
    background: rgba(0, 245, 255, 0.15);
    border: 1px solid rgba(0, 245, 255, 0.3);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #00f5ff;

    &--collect {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.3);
      color: #22c55e;
    }
  }

  &__title {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  &__subtitle {
    color: #64748b;
    margin: 8px 0 0;
    font-size: 0.85rem;
  }
}

.dialog-body {
  padding: 0 32px 32px;
  overflow-y: auto;
  flex: 1;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-row {
  display: flex;
  gap: 16px;
}

.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &--small {
    flex: 0 0 100px;
  }

  &--medium {
    flex: 0 0 160px;
  }

  &--large {
    flex: 1;
  }
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.futuristic-input {
  :deep(.q-field__control) {
    background: rgba(10, 10, 25, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 8px 16px;
  }

  :deep(.q-field__native) {
    color: #f1f5f9;
  }

  :deep(.q-field__bottom) {
    color: #64748b;
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.save-btn {
  background: linear-gradient(135deg, #00f5ff 0%, #3b82f6 100%) !important;
  font-weight: 600;
}

// Data Viewer
.data-viewer-card {
  background: #0a0a14;
}

.data-viewer-bar {
  background: linear-gradient(135deg, rgba(0, 245, 255, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  color: #f1f5f9;

  .q-icon {
    color: #00f5ff;
  }
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-item {
  background: rgba(15, 15, 30, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px !important;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__date {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  &__params {
    font-size: 0.75rem;
    color: #fbbf24;
    font-family: monospace;
  }
}

.data-summary {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  .summary-label {
    color: #64748b;
    font-size: 0.85rem;
  }

  .summary-value {
    color: #00f5ff;
    font-weight: 600;
  }
}

.data-raw {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.75rem;
  max-height: 300px;
  overflow: auto;
  margin: 0;
}

.data-truncated {
  color: #64748b;
  font-size: 0.8rem;
  font-style: italic;
  margin: 8px 0 0;
}

@media (max-width: 768px) {
  .endpoints-page {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    max-width: none;
  }

  .endpoint-card {
    flex-direction: column;
    align-items: flex-start;

    &__method {
      align-self: flex-start;
    }

    &__actions {
      align-self: flex-end;
    }
  }

  .field-row {
    flex-direction: column;
  }

  .field-wrapper--small,
  .field-wrapper--medium {
    flex: none;
  }
}
</style>

<!-- Estilos globais para dropdown dos selects (renderizados fora do escopo) -->
<style lang="scss">
.dark-select-popup {
  background: #0d0d1e !important;
  border: 1px solid rgba(0, 245, 255, 0.15) !important;
  border-radius: 12px !important;

  .q-item {
    color: #f1f5f9 !important;
    min-height: 40px;

    &:hover,
    &.q-manual-focusable--focused {
      background: rgba(0, 245, 255, 0.1) !important;
    }

    &.q-item--active {
      color: #00f5ff !important;
      background: rgba(0, 245, 255, 0.08) !important;
    }
  }

  .q-virtual-scroll__content {
    background: transparent !important;
  }
}
</style>
