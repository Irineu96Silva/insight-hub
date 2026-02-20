<template>
  <q-page class="q-pa-md llm-config-page">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 text-white q-my-none orbitron-font">
          Configuração LLM
        </h1>
        <div class="text-subtitle2 text-grey-5">
          Gerencie provedores de IA do sistema
        </div>
      </div>
      <q-btn
        icon="add"
        label="Novo Provedor"
        color="cyan"
        outline
        @click="openCreateDialog"
      />
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="row justify-center q-pa-xl"
    >
      <q-spinner-orbit
        color="cyan"
        size="3em"
      />
    </div>

    <!-- Provider Cards -->
    <div
      v-else
      class="row q-col-gutter-md"
    >
      <div
        v-for="provider in providers"
        :key="provider.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card
          class="provider-card"
          :class="{ 'provider-card--active': provider.is_active }"
        >
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-h6 text-white">
                {{ provider.name }}
              </div>
              <q-badge
                :color="provider.is_active ? 'positive' : 'grey-7'"
                :label="provider.is_active ? 'ATIVO' : 'INATIVO'"
              />
            </div>

            <div class="text-caption text-grey-5 q-mb-xs">
              <q-icon
                name="dns"
                size="xs"
                class="q-mr-xs"
              />
              {{ provider.slug }}
            </div>
            <div class="text-caption text-grey-5 q-mb-xs">
              <q-icon
                name="link"
                size="xs"
                class="q-mr-xs"
              />
              {{ provider.base_url }}
            </div>
            <div class="text-caption text-cyan q-mb-md">
              <q-icon
                name="smart_toy"
                size="xs"
                class="q-mr-xs"
              />
              {{ provider.default_model }}
            </div>
          </q-card-section>

          <q-separator dark />

          <q-card-actions align="right">
            <q-btn
              flat
              dense
              icon="science"
              label="Testar"
              color="amber"
              size="sm"
              :loading="testingId === provider.id"
              @click="testProvider(provider)"
            />
            <q-btn
              flat
              dense
              icon="edit"
              label="Editar"
              color="cyan"
              size="sm"
              @click="openEditDialog(provider)"
            />
            <q-btn
              v-if="!provider.is_active"
              flat
              dense
              icon="power_settings_new"
              label="Ativar"
              color="positive"
              size="sm"
              @click="activateProvider(provider)"
            />
            <q-btn
              v-if="!provider.is_active"
              flat
              dense
              icon="delete"
              color="negative"
              size="sm"
              @click="deleteProvider(provider)"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Empty state -->
      <div
        v-if="providers.length === 0"
        class="col-12 text-center q-pa-xl text-grey-6"
      >
        <q-icon
          name="psychology"
          size="4em"
          class="q-mb-md"
        />
        <div class="text-h6">
          Nenhum provedor configurado
        </div>
        <div class="text-body2 q-mb-md">
          Cadastre um provedor LLM para começar a usar a IA
        </div>
        <q-btn
          icon="add"
          label="Cadastrar Provedor"
          color="cyan"
          outline
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Dialog: Create/Edit Provider -->
    <q-dialog
      v-model="showDialog"
      persistent
    >
      <q-card
        class="dialog-card"
        style="width: 100%; max-width: 560px;"
      >
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-white">
            {{ isEditing ? 'Editar Provedor' : 'Novo Provedor' }}
          </div>
          <q-space />
          <q-btn
            icon="close"
            flat
            round
            dense
            @click="showDialog = false"
          />
        </q-card-section>

        <q-card-section>
          <!-- Preset selector (somente ao criar) -->
          <q-select
            v-if="!isEditing"
            v-model="selectedPreset"
            :options="presetOptions"
            label="Preset (preenche automaticamente)"
            dark
            outlined
            dense
            clearable
            class="q-mb-md"
            emit-value
            map-options
            @update:model-value="applyPreset"
          />

          <q-input
            v-model="form.name"
            label="Nome do Provedor"
            dark
            outlined
            dense
            class="q-mb-md"
            :rules="[val => !!val || 'Nome obrigatório']"
          />

          <q-input
            v-if="!isEditing"
            v-model="form.slug"
            label="Slug (identificador único)"
            dark
            outlined
            dense
            class="q-mb-md"
            hint="Ex: openai, openrouter, anthropic"
            :rules="[val => !!val || 'Slug obrigatório']"
          />

          <q-input
            v-model="form.base_url"
            label="Base URL"
            dark
            outlined
            dense
            class="q-mb-md"
            hint="Ex: https://api.openai.com/v1"
            :rules="[val => !!val || 'URL obrigatória']"
          />

          <q-input
            v-model="form.api_key"
            label="API Key"
            dark
            outlined
            dense
            class="q-mb-md"
            :type="showApiKey ? 'text' : 'password'"
            :hint="isEditing ? 'Deixe vazio para manter a key atual' : 'Opcional para Ollama'"
          >
            <template #append>
              <q-icon
                :name="showApiKey ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showApiKey = !showApiKey"
              />
            </template>
          </q-input>

          <q-select
            v-if="availableModels.length > 0"
            v-model="form.default_model"
            :options="modelOptions"
            label="Modelo Padrão"
            dark
            outlined
            dense
            class="q-mb-md"
            emit-value
            map-options
            use-input
            input-debounce="200"
            @filter="filterModels"
          />
          <q-input
            v-else
            v-model="form.default_model"
            label="Modelo Padrão"
            dark
            outlined
            dense
            class="q-mb-md"
            hint="Ex: gpt-4o-mini"
            :rules="[val => !!val || 'Modelo obrigatório']"
          />
        </q-card-section>

        <q-card-actions
          align="right"
          class="q-pa-md"
        >
          <q-btn
            flat
            label="Cancelar"
            color="grey"
            @click="showDialog = false"
          />
          <q-btn
            v-if="isEditing && editingId"
            flat
            label="Carregar Modelos"
            color="amber"
            icon="refresh"
            :loading="loadingModels"
            @click="loadModelsForProvider(editingId)"
          />
          <q-btn
            label="Salvar"
            color="cyan"
            icon="save"
            :loading="saving"
            @click="saveProvider"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  llmService,
  type LlmProviderData,
  type LlmPreset,
  type LlmModel,
} from 'src/services/llm.service';

const $q = useQuasar();

const loading = ref(true);
const saving = ref(false);
const loadingModels = ref(false);
const testingId = ref<string | null>(null);
const showDialog = ref(false);
const showApiKey = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const selectedPreset = ref<string | null>(null);

const providers = ref<LlmProviderData[]>([]);
const presets = ref<LlmPreset[]>([]);
const availableModels = ref<LlmModel[]>([]);

const form = ref({
  name: '',
  slug: '',
  base_url: '',
  api_key: '',
  default_model: '',
});

const presetOptions = computed(() =>
  presets.value.map((p) => ({ label: p.name, value: p.slug })),
);

const modelOptions = ref<{ label: string; value: string }[]>([]);

function filterModels(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    modelOptions.value = availableModels.value
      .filter((m) => m.id.toLowerCase().includes(needle))
      .map((m) => ({ label: m.name || m.id, value: m.id }));
  });
}

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const [p, pr] = await Promise.all([
      llmService.getProviders(),
      llmService.getPresets(),
    ]);
    providers.value = p;
    presets.value = pr;
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Erro ao carregar provedores' });
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  selectedPreset.value = null;
  availableModels.value = [];
  modelOptions.value = [];
  form.value = { name: '', slug: '', base_url: '', api_key: '', default_model: '' };
  showApiKey.value = false;
  showDialog.value = true;
}

function openEditDialog(provider: LlmProviderData) {
  isEditing.value = true;
  editingId.value = provider.id;
  availableModels.value = [];
  modelOptions.value = [];
  form.value = {
    name: provider.name,
    slug: provider.slug,
    base_url: provider.base_url,
    api_key: '',
    default_model: provider.default_model,
  };
  showApiKey.value = false;
  showDialog.value = true;
}

function applyPreset(slug: string | null) {
  if (!slug) return;
  const preset = presets.value.find((p) => p.slug === slug);
  if (preset) {
    form.value.name = preset.name;
    form.value.slug = preset.slug;
    form.value.base_url = preset.base_url;
    form.value.default_model = preset.default_model;
  }
}

async function saveProvider() {
  if (!form.value.name || !form.value.default_model) {
    $q.notify({ type: 'warning', message: 'Preencha os campos obrigatórios' });
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value && editingId.value) {
      await llmService.updateProvider(editingId.value, {
        name: form.value.name,
        base_url: form.value.base_url,
        default_model: form.value.default_model,
        ...(form.value.api_key ? { api_key: form.value.api_key } : {}),
      });
      $q.notify({ type: 'positive', message: 'Provedor atualizado!' });
    } else {
      await llmService.createProvider({
        name: form.value.name,
        slug: form.value.slug,
        base_url: form.value.base_url,
        default_model: form.value.default_model,
        ...(form.value.api_key ? { api_key: form.value.api_key } : {}),
      });
      $q.notify({ type: 'positive', message: 'Provedor cadastrado!' });
    }
    showDialog.value = false;
    await loadData();
  } catch (error: any) {
    const msg = error?.response?.data?.message || 'Erro ao salvar';
    $q.notify({ type: 'negative', message: msg });
  } finally {
    saving.value = false;
  }
}

async function activateProvider(provider: LlmProviderData) {
  $q.dialog({
    title: 'Ativar Provedor',
    message: `Deseja ativar "${provider.name}"? Os demais provedores serão desativados.`,
    cancel: true,
    persistent: true,
    dark: true,
  }).onOk(async () => {
    try {
      await llmService.activateProvider(provider.id);
      $q.notify({
        type: 'positive',
        message: `${provider.name} ativado com sucesso!`,
      });
      await loadData();
    } catch (error) {
      console.error(error);
      $q.notify({ type: 'negative', message: 'Erro ao ativar provedor' });
    }
  });
}

async function deleteProvider(provider: LlmProviderData) {
  $q.dialog({
    title: 'Excluir Provedor',
    message: `Tem certeza que deseja excluir "${provider.name}"? Esta ação não pode ser desfeita.`,
    cancel: true,
    persistent: true,
    dark: true,
  }).onOk(async () => {
    try {
      await llmService.deleteProvider(provider.id);
      $q.notify({ type: 'info', message: 'Provedor excluído' });
      await loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Erro ao excluir';
      $q.notify({ type: 'negative', message: msg });
    }
  });
}

async function testProvider(provider: LlmProviderData) {
  testingId.value = provider.id;
  try {
    const result = await llmService.testConnection(provider.id);
    $q.notify({
      type: result.success ? 'positive' : 'negative',
      message: result.message,
      icon: result.success ? 'check_circle' : 'error',
    });
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'Falha no teste de conexão',
    });
  } finally {
    testingId.value = null;
  }
}

async function loadModelsForProvider(id: string) {
  loadingModels.value = true;
  try {
    const models = await llmService.listModels(id);
    availableModels.value = models;
    modelOptions.value = models.map((m) => ({
      label: m.name || m.id,
      value: m.id,
    }));
    $q.notify({
      type: 'positive',
      message: `${models.length} modelos encontrados`,
    });
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Erro ao carregar modelos' });
  } finally {
    loadingModels.value = false;
  }
}
</script>

<style lang="scss" scoped>
.llm-config-page {
  max-width: 1200px;
  margin: 0 auto;
}

.orbitron-font {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 1px;
}

.provider-card {
  background: rgba(15, 15, 30, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  &--active {
    border-color: rgba(0, 230, 118, 0.4);
    box-shadow: 0 0 20px rgba(0, 230, 118, 0.1);
  }
}

.dialog-card {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

// ═══════════════ RESPONSIVIDADE MOBILE ═══════════════
@media (max-width: 599px) {
  .llm-config-page {
    padding: 8px !important;
  }

  .llm-config-page > .row.items-center.justify-between {
    flex-direction: column;
    gap: 8px;
    align-items: stretch !important;

    .text-h4 {
      font-size: 1.3rem !important;
    }

    .q-btn {
      width: 100%;
    }
  }

  .dialog-card {
    border-radius: 8px;
  }
}
</style>
