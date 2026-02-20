<template>
  <q-page class="q-pa-md systems-page">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 text-white q-my-none orbitron-font">
          Sistemas
        </h1>
        <div class="text-subtitle2 text-grey-5">
          Gerenciamento de integrações e dados empresariais
        </div>
      </div>
      <q-btn
        icon="add"
        label="Novo Sistema"
        color="cyan"
        unelevated
        class="action-btn"
        @click="openDialog()"
      />
    </div>

    <q-card class="futuristic-card">
      <q-table
        :rows="systems"
        :columns="columns"
        row-key="id"
        dark
        flat
        bordered
        :loading="loading"
        class="systems-table"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              :color="props.row.is_active ? 'positive' : 'negative'"
              text-color="white"
              dense
              class="status-chip"
            >
              {{ props.row.is_active ? 'Ativo' : 'Inativo' }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-criticality="props">
          <q-td :props="props">
            <q-badge
              v-if="props.row.criticality"
              :color="getCriticalityColor(props.row.criticality)"
            >
              {{ getCriticalityLabel(props.row.criticality) }}
            </q-badge>
            <span
              v-else
              class="text-grey-6"
            >—</span>
          </q-td>
        </template>

        <template #body-cell-environment="props">
          <q-td :props="props">
            <q-badge
              v-if="props.row.environment"
              :color="getEnvColor(props.row.environment)"
              outline
            >
              {{ props.row.environment }}
            </q-badge>
            <span
              v-else
              class="text-grey-6"
            >—</span>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              color="cyan"
              icon="edit"
              @click="openDialog(props.row)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              color="purple"
              icon="visibility"
              @click="viewSystem(props.row.id)"
            >
              <q-tooltip>Detalhes</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              color="negative"
              icon="delete"
              @click="confirmDelete(props.row)"
            >
              <q-tooltip>Excluir</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog for Create/Edit with Tabs -->
    <q-dialog
      v-model="dialogVisible"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="bg-dark text-white column">
        <q-bar class="bg-black">
          <div class="text-subtitle1 orbitron-font">
            {{ isEditing ? 'Editar Sistema' : 'Novo Sistema' }}
          </div>
          <q-space />
          <q-btn
            v-close-popup
            dense
            flat
            icon="close"
          >
            <q-tooltip>Fechar</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="col scroll">
          <div class="form-container q-mx-auto">
            <q-tabs
              v-model="activeTab"
              dense
              class="text-grey-5"
              active-color="cyan"
              indicator-color="cyan"
              narrow-indicator
              align="left"
            >
              <q-tab
                name="basic"
                icon="dns"
                label="Básico"
              />
              <q-tab
                name="company"
                icon="business"
                label="Empresa"
              />
              <q-tab
                name="infra"
                icon="cloud"
                label="Infraestrutura"
              />
              <q-tab
                name="sla"
                icon="verified"
                label="SLA & Regras"
              />
              <q-tab
                name="auth"
                icon="lock"
                label="Autenticação"
              />
            </q-tabs>

            <q-separator class="q-mb-lg" />

            <q-form
              class="q-mt-md"
              @submit="saveSystem"
            >
              <!-- TAB: Básico -->
              <q-tab-panel
                v-show="activeTab === 'basic'"
                name="basic"
                class="q-pa-none"
              >
                <div class="text-h6 q-mb-md text-cyan">
                  Informações Básicas
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.name"
                      label="Nome do Sistema *"
                      dark
                      outlined
                      dense
                      color="cyan"
                      :rules="[val => !!val || 'Nome é obrigatório']"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.base_url"
                      label="URL Base"
                      dark
                      outlined
                      dense
                      color="cyan"
                      hint="Ex: https://api.meusistema.com.br"
                    />
                  </div>
                  <div class="col-12">
                    <q-input
                      v-model="form.description"
                      label="Descrição"
                      dark
                      outlined
                      dense
                      color="cyan"
                      type="textarea"
                      rows="3"
                      hint="Descreva a função do sistema"
                    />
                  </div>
                  <div
                    v-if="isEditing"
                    class="col-12"
                  >
                    <q-toggle
                      v-model="form.is_active"
                      label="Sistema Ativo"
                      color="cyan"
                      dark
                    />
                  </div>
                </div>
              </q-tab-panel>

              <!-- TAB: Empresa -->
              <q-tab-panel
                v-show="activeTab === 'company'"
                name="company"
                class="q-pa-none"
              >
                <div class="text-h6 q-mb-xs text-cyan">
                  Dados da Empresa
                </div>
                <div class="text-caption text-grey-6 q-mb-md">
                  Preencha para que a IA possa contextualizar análises com dados do cliente.
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.company_name"
                      label="Razão Social"
                      dark
                      outlined
                      dense
                      color="cyan"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.cnpj"
                      label="CNPJ"
                      dark
                      outlined
                      dense
                      color="cyan"
                      mask="##.###.###/####-##"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="form.contact_name"
                      label="Responsável Técnico"
                      dark
                      outlined
                      dense
                      color="cyan"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="form.contact_email"
                      label="Email do Responsável"
                      dark
                      outlined
                      dense
                      color="cyan"
                      type="email"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="form.contact_phone"
                      label="Telefone"
                      dark
                      outlined
                      dense
                      color="cyan"
                      mask="(##) #####-####"
                    />
                  </div>
                </div>
              </q-tab-panel>

              <!-- TAB: Infraestrutura -->
              <q-tab-panel
                v-show="activeTab === 'infra'"
                name="infra"
                class="q-pa-none"
              >
                <div class="text-h6 q-mb-xs text-cyan">
                  Infraestrutura
                </div>
                <div class="text-caption text-grey-6 q-mb-md">
                  Dados técnicos usados para Testes de Rede e monitoramento.
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.ip_address"
                      label="IP do Servidor"
                      dark
                      outlined
                      dense
                      color="cyan"
                      hint="Ex: 192.168.1.100 ou domínio"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.port"
                      label="Porta Principal"
                      dark
                      outlined
                      dense
                      color="cyan"
                      type="number"
                      hint="Ex: 443, 8080, 3000"
                    />
                  </div>
                  <div class="col-12">
                    <q-input
                      v-model="form.health_check_url"
                      label="URL de Health Check"
                      dark
                      outlined
                      dense
                      color="cyan"
                      hint="Ex: https://api.sistema.com/health"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="form.environment"
                      :options="environmentOptions"
                      label="Ambiente"
                      dark
                      outlined
                      dense
                      color="cyan"
                      emit-value
                      map-options
                      clearable
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="form.criticality"
                      :options="criticalityOptions"
                      label="Criticalidade"
                      dark
                      outlined
                      dense
                      color="cyan"
                      emit-value
                      map-options
                      clearable
                    />
                  </div>
                </div>
              </q-tab-panel>

              <!-- TAB: SLA & Regras -->
              <q-tab-panel
                v-show="activeTab === 'sla'"
                name="sla"
                class="q-pa-none"
              >
                <div class="text-h6 q-mb-xs text-cyan">
                  SLA & Regras de Negócio
                </div>
                <div class="text-caption text-grey-6 q-mb-md">
                  Defina os parâmetros de qualidade para alertas inteligentes.
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.sla_uptime"
                      label="SLA Uptime (%)"
                      dark
                      outlined
                      dense
                      color="cyan"
                      type="number"
                      step="0.01"
                      hint="Ex: 99.9"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.sla_response_time_ms"
                      label="Tempo Resp. Máximo (ms)"
                      dark
                      outlined
                      dense
                      color="cyan"
                      type="number"
                      hint="Tempo permitido (ex: 2000)"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.business_hours"
                      label="Horário Comercial"
                      dark
                      outlined
                      dense
                      color="cyan"
                      hint="Ex: 08:00-18:00"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="form.tags"
                      :options="tagSuggestions"
                      label="Tags"
                      dark
                      outlined
                      dense
                      color="cyan"
                      use-chips
                      multiple
                      use-input
                      new-value-mode="add-unique"
                      hint="Digite para adicionar"
                    />
                  </div>
                  <div class="col-12">
                    <q-input
                      v-model="form.notes"
                      label="Observações"
                      dark
                      outlined
                      dense
                      color="cyan"
                      type="textarea"
                      rows="3"
                      hint="Notas importantes sobre o sistema"
                    />
                  </div>
                </div>
              </q-tab-panel>

              <!-- TAB: Autenticação -->
              <q-tab-panel
                v-show="activeTab === 'auth'"
                name="auth"
                class="q-pa-none"
              >
                <div class="text-h6 q-mb-md text-cyan">
                  Autenticação da API
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-select
                      v-model="form.auth_type"
                      :options="authTypeOptions"
                      label="Tipo de Autenticação"
                      dark
                      outlined
                      dense
                      color="cyan"
                      emit-value
                      map-options
                    />
                  </div>

                  <div
                    v-if="form.auth_type === 'bearer'"
                    class="col-12"
                  >
                    <div class="q-pa-md bg-dark-layer rounded-borders">
                      <div class="text-caption text-cyan q-mb-sm">
                        Configuração Bearer
                      </div>
                      <q-input
                        v-model="authConfig.token"
                        label="Token"
                        dark
                        outlined
                        dense
                        color="cyan"
                      />
                    </div>
                  </div>

                  <div
                    v-if="form.auth_type === 'api_key'"
                    class="col-12"
                  >
                    <div class="q-pa-md bg-dark-layer rounded-borders">
                      <div class="text-caption text-cyan q-mb-sm">
                        Configuração API Key
                      </div>
                      <q-input
                        v-model="authConfig.header"
                        label="Header Name (ex: X-API-KEY)"
                        dark
                        outlined
                        dense
                        color="cyan"
                        class="q-mb-sm"
                      />
                      <q-input
                        v-model="authConfig.value"
                        label="Value"
                        dark
                        outlined
                        dense
                        color="cyan"
                      />
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Action Buttons -->
              <div class="row justify-between q-mt-xl">
                <div>
                  <q-btn
                    v-if="activeTab !== 'basic'"
                    flat
                    label="← Anterior"
                    color="grey"
                    @click="prevTab"
                  />
                </div>
                <div class="row q-gutter-sm">
                  <q-btn
                    v-close-popup
                    label="Cancelar"
                    color="grey"
                    flat
                  />
                  <q-btn
                    v-if="activeTab !== 'auth'"
                    label="Próximo →"
                    color="cyan"
                    flat
                    @click="nextTab"
                  />
                  <q-btn
                    :label="isEditing ? 'Salvar' : 'Criar Sistema'"
                    color="cyan"
                    type="submit"
                    :loading="saving"
                    unelevated
                  />
                </div>
              </div>
            </q-form>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import { systemsService } from 'src/services/systems.service';
import type { System } from 'src/types';

const $q = useQuasar();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const systems = ref<System[]>([]);
const dialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const activeTab = ref('basic');

const form = reactive({
  name: '',
  description: '',
  base_url: '',
  is_active: true,
  // Empresa
  company_name: '',
  cnpj: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  // Infra
  ip_address: '',
  port: null as number | null,
  health_check_url: '',
  environment: null as string | null,
  criticality: null as string | null,
  // SLA
  sla_uptime: null as number | null,
  sla_response_time_ms: null as number | null,
  business_hours: '',
  notes: '',
  tags: [] as string[],
  // Auth
  auth_type: 'none',
});

const authConfig = reactive({
  token: '',
  header: '',
  value: ''
});

const tabs = ['basic', 'company', 'infra', 'sla', 'auth'];

function nextTab() {
  const idx = tabs.indexOf(activeTab.value);
  if (idx < tabs.length - 1) activeTab.value = tabs[idx + 1] ?? activeTab.value;
}

function prevTab() {
  const idx = tabs.indexOf(activeTab.value);
  if (idx > 0) activeTab.value = tabs[idx - 1] ?? activeTab.value;
}

const authTypeOptions = [
  { label: 'Nenhuma', value: 'none' },
  { label: 'Bearer Token', value: 'bearer' },
  { label: 'API Key', value: 'api_key' }
];

const environmentOptions = [
  { label: 'Produção', value: 'production' },
  { label: 'Staging', value: 'staging' },
  { label: 'Desenvolvimento', value: 'development' },
];

const criticalityOptions = [
  { label: 'Baixa', value: 'low' },
  { label: 'Média', value: 'medium' },
  { label: 'Alta', value: 'high' },
  { label: 'Crítica', value: 'critical' },
];

const tagSuggestions = ['ERP', 'CRM', 'Financeiro', 'RH', 'E-commerce', 'API', 'Monitoramento'];

const columns: QTableColumn[] = [
  { name: 'name', label: 'Nome', field: 'name', sortable: true, align: 'left' },
  { name: 'base_url', label: 'URL Base', field: 'base_url', align: 'left' },
  { name: 'environment', label: 'Ambiente', field: 'environment', align: 'center' },
  { name: 'criticality', label: 'Criticalidade', field: 'criticality', align: 'center' },
  { name: 'status', label: 'Status', field: 'is_active', align: 'center' },
  { name: 'actions', label: 'Ações', field: 'actions', align: 'right' }
];

function getCriticalityColor(c: string) {
  const m: Record<string, string> = { low: 'info', medium: 'warning', high: 'deep-orange', critical: 'negative' };
  return m[c] || 'grey';
}

function getCriticalityLabel(c: string) {
  const m: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
  return m[c] || c;
}

function getEnvColor(e: string) {
  const m: Record<string, string> = { production: 'positive', staging: 'warning', development: 'info' };
  return m[e] || 'grey';
}

async function loadSystems() {
  loading.value = true;
  try {
    systems.value = await systemsService.findAll();
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Erro ao carregar sistemas' });
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.name = '';
  form.description = '';
  form.base_url = '';
  form.is_active = true;
  form.company_name = '';
  form.cnpj = '';
  form.contact_name = '';
  form.contact_email = '';
  form.contact_phone = '';
  form.ip_address = '';
  form.port = null;
  form.health_check_url = '';
  form.environment = null;
  form.criticality = null;
  form.sla_uptime = null;
  form.sla_response_time_ms = null;
  form.business_hours = '';
  form.notes = '';
  form.tags = [];
  form.auth_type = 'none';
  authConfig.token = '';
  authConfig.header = '';
  authConfig.value = '';
}

function openDialog(system?: System) {
  activeTab.value = 'basic';
  if (system) {
    isEditing.value = true;
    editingId.value = system.id;
    form.name = system.name;
    form.description = system.description || '';
    form.base_url = system.base_url || '';
    form.is_active = system.is_active;
    form.company_name = system.company_name || '';
    form.cnpj = system.cnpj || '';
    form.contact_name = system.contact_name || '';
    form.contact_email = system.contact_email || '';
    form.contact_phone = system.contact_phone || '';
    form.ip_address = system.ip_address || '';
    form.port = system.port || null;
    form.health_check_url = system.health_check_url || '';
    form.environment = system.environment || null;
    form.criticality = system.criticality || null;
    form.sla_uptime = system.sla_uptime || null;
    form.sla_response_time_ms = system.sla_response_time_ms || null;
    form.business_hours = system.business_hours || '';
    form.notes = system.notes || '';
    form.tags = system.tags || [];
    form.auth_type = system.auth_type || 'none';
    if (system.auth_config) {
      authConfig.token = system.auth_config.token || '';
      authConfig.header = system.auth_config.header || '';
      authConfig.value = system.auth_config.value || '';
    }
  } else {
    isEditing.value = false;
    editingId.value = null;
    resetForm();
  }
  dialogVisible.value = true;
}

async function saveSystem() {
  saving.value = true;
  try {
    const payload: any = { ...form };

    // Auth config
    if (form.auth_type === 'bearer') {
      payload.auth_config = { token: authConfig.token };
    } else if (form.auth_type === 'api_key') {
      payload.auth_config = { header: authConfig.header, value: authConfig.value };
    } else {
      payload.auth_config = {};
    }

    // Limpar nulls para não enviar campos desnecessários
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null) delete payload[key];
    });

    if (isEditing.value && editingId.value) {
      await systemsService.update(editingId.value, payload);
      $q.notify({ type: 'positive', message: 'Sistema atualizado com sucesso!' });
      dialogVisible.value = false;
      loadSystems();
    } else {
      const created = await systemsService.create(payload);
      $q.notify({
        type: 'positive',
        message: '✅ Sistema criado! Agora adicione os endpoints para coleta de dados.',
        timeout: 4000,
      });
      dialogVisible.value = false;
      // Redirecionar direto para o detalhe do sistema com aba Endpoints aberta
      router.push(`/systems/${created.id}?tab=endpoints`);
    }
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Erro ao salvar sistema' });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(system: System) {
  $q.dialog({
    title: 'Confirmar exclusão',
    message: `Deseja excluir o sistema ${system.name}?`,
    dark: true,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await systemsService.remove(system.id);
      $q.notify({ type: 'positive', message: 'Sistema removido' });
      loadSystems();
    } catch (error) {
      console.error(error);
      $q.notify({ type: 'negative', message: 'Erro ao remover sistema' });
    }
  });
}

function viewSystem(id: string) {
  router.push(`/systems/${id}`);
}

onMounted(() => {
  loadSystems();
});
</script>

<style lang="scss" scoped>
.orbitron-font {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 1px;
}

.action-btn {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 1px;
}

.futuristic-card {
  background: rgba(15, 15, 30, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.systems-table {
  background: transparent !important;
  
  :deep(th) {
    font-size: 0.85rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
  }

  :deep(td) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
}

.status-chip {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.7rem;
}

.form-container {
  max-width: 900px;
  width: 100%;
}

.bg-dark-layer {
  background: rgba(0,0,0,0.3);
}

// ═══════════════ RESPONSIVIDADE MOBILE ═══════════════
@media (max-width: 599px) {
  .systems-page {
    padding: 8px !important;
  }

  .systems-page > .row.items-center.justify-between {
    flex-direction: column;
    gap: 8px;
    align-items: stretch !important;

    .text-h4 {
      font-size: 1.3rem !important;
    }

    .action-btn {
      width: 100%;
    }
  }

  // Table horizontal scroll
  .systems-table {
    :deep(.q-table__container) {
      overflow-x: auto;
    }

    :deep(th), :deep(td) {
      white-space: nowrap;
    }
  }

  .form-container {
    max-width: 100%;
    padding: 8px;
  }
}
</style>
