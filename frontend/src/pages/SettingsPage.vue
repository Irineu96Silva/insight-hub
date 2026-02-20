<template>
  <q-page class="q-pa-md settings-page">
    <div class="page-header q-mb-lg">
      <h1 class="text-h4 orbitron-font">
        Configurações
      </h1>
      <div class="text-subtitle2 text-grey-5">
        Gerencie suas preferências e o sistema
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Sidebar Navigation -->
      <div class="col-12 col-md-3">
        <q-list
          bordered
          class="settings-nav rounded-borders"
        >
          <q-item-label
            header
            class="text-uppercase text-weight-bold q-py-md q-px-md text-grey-6"
          >
            Geral
          </q-item-label>

          <q-item
            v-ripple
            clickable
            :active="activeTab === 'profile'"
            active-class="active-item text-cyan"
            @click="activeTab = 'profile'"
          >
            <q-item-section avatar>
              <q-icon name="person" />
            </q-item-section>
            <q-item-section>Meu Perfil</q-item-section>
          </q-item>

          <q-item
            v-ripple
            clickable
            :active="activeTab === 'appearance'"
            active-class="active-item text-purple"
            @click="activeTab = 'appearance'"
          >
            <q-item-section avatar>
              <q-icon name="palette" />
            </q-item-section>
            <q-item-section>Aparência</q-item-section>
          </q-item>

          <q-item
            v-ripple
            clickable
            :active="activeTab === 'notifications'"
            active-class="active-item text-orange"
            @click="activeTab = 'notifications'"
          >
            <q-item-section avatar>
              <q-icon name="notifications" />
            </q-item-section>
            <q-item-section>Notificações</q-item-section>
          </q-item>

          <q-separator class="q-my-md bg-grey-8" />

          <q-item-label
            header
            class="text-uppercase text-weight-bold q-py-md q-px-md text-grey-6"
          >
            Sistema
          </q-item-label>

          <q-item
            v-ripple
            clickable
            @click="router.push('/settings/llm')"
          >
            <q-item-section avatar>
              <q-icon name="smart_toy" />
            </q-item-section>
            <q-item-section>Provedores IA</q-item-section>
            <q-item-section side>
              <q-icon
                name="open_in_new"
                size="xs"
              />
            </q-item-section>
          </q-item>

          <q-item
            v-ripple
            clickable
            :active="activeTab === 'system'"
            active-class="active-item text-green"
            @click="activeTab = 'system'"
          >
            <q-item-section avatar>
              <q-icon name="dns" />
            </q-item-section>
            <q-item-section>Status & Coleta</q-item-section>
          </q-item>

          <q-item
            v-ripple
            clickable
            :active="activeTab === 'users'"
            active-class="active-item text-pink"
            @click="activeTab = 'users'"
          >
            <q-item-section avatar>
              <q-icon name="group" />
            </q-item-section>
            <q-item-section>Usuários</q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Content Area -->
      <div class="col-12 col-md-9">
        <q-tab-panels
          v-model="activeTab"
          animated
          class="bg-transparent panels-container"
          transition-prev="fade"
          transition-next="fade"
        >
          <!-- Profile Panel -->
          <q-tab-panel
            name="profile"
            class="q-pa-none"
          >
            <q-card class="futuristic-card">
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  Informações Pessoais
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="profile.name"
                      label="Nome Completo"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="profile.email"
                      label="Email"
                      outlined
                      dense
                      readonly
                    />
                  </div>
                </div>

                <q-separator class="q-my-lg" />

                <div class="text-h6 q-mb-md">
                  Segurança
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="profile.currentPassword"
                      label="Senha Atual"
                      type="password"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="profile.newPassword"
                      label="Nova Senha"
                      type="password"
                      outlined
                      dense
                    />
                  </div>
                </div>
              </q-card-section>
              <q-card-actions
                align="right"
                class="q-pa-md"
              >
                <q-btn
                  label="Salvar Alterações"
                  color="cyan"
                  unelevated
                  :loading="saving"
                  @click="saveProfile"
                />
              </q-card-actions>
            </q-card>
          </q-tab-panel>

          <!-- Appearance Panel -->
          <q-tab-panel
            name="appearance"
            class="q-pa-none"
          >
            <q-card class="futuristic-card">
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  Tema e Visual
                </div>
                
                <q-list class="q-pa-none">
                  <q-item
                    v-ripple
                    tag="label"
                    class="q-px-none"
                  >
                    <q-item-section avatar>
                      <q-icon
                        :name="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
                        size="md"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Modo Escuro</q-item-label>
                      <q-item-label caption>
                        Alternar entre tema claro e escuro
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle
                        :model-value="$q.dark.isActive"
                        color="cyan"
                        @update:model-value="$q.dark.toggle()"
                      />
                    </q-item-section>
                  </q-item>

                  <q-separator class="q-my-md" />

                  <div class="text-subtitle2 q-mb-sm text-grey-6">
                    Densidade
                  </div>
                  <div class="row q-gutter-md">
                    <q-radio
                      v-model="density"
                      val="comfortable"
                      label="Confortável"
                      color="cyan"
                    />
                    <q-radio
                      v-model="density"
                      val="compact"
                      label="Compacto"
                      color="cyan"
                    />
                  </div>
                </q-list>
              </q-card-section>
            </q-card>
          </q-tab-panel>

          <!-- Notifications Panel -->
          <q-tab-panel
            name="notifications"
            class="q-pa-none"
          >
            <q-card class="futuristic-card">
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  Preferências de Notificação
                </div>
                
                <q-list class="q-pa-none">
                  <q-item
                    v-ripple
                    tag="label"
                    class="q-px-none"
                  >
                    <q-item-section>
                      <q-item-label>Notificações no Navegador</q-item-label>
                      <q-item-label caption>
                        Receber alertas pop-up enquanto usa o sistema
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle
                        v-model="settings.notificationsEnabled"
                        color="orange"
                      />
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-ripple
                    tag="label"
                    class="q-px-none"
                  >
                    <q-item-section>
                      <q-item-label>Resumo por Email</q-item-label>
                      <q-item-label caption>
                        Receber resumo diário dos insights
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle
                        v-model="settings.emailNotifications"
                        color="orange"
                      />
                    </q-item-section>
                  </q-item>
                  
                  <q-item
                    v-ripple
                    tag="label"
                    class="q-px-none"
                  >
                    <q-item-section>
                      <q-item-label>Apenas Críticos</q-item-label>
                      <q-item-label caption>
                        Notificar apenas alertas de severidade alta
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle
                        v-model="settings.criticalAlertsOnly"
                        color="red"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
              <q-card-actions
                align="right"
                class="q-pa-md"
              >
                <q-btn
                  label="Salvar Preferências"
                  color="orange"
                  flat
                  @click="saveSettings"
                />
              </q-card-actions>
            </q-card>
          </q-tab-panel>

          <!-- System Status Panel -->
          <q-tab-panel
            name="system"
            class="q-pa-none"
          >
            <div class="row q-col-gutter-md q-mb-lg">
              <!-- Health Cards -->
              <div class="col-12 col-md-4">
                <q-card class="health-card bg-surface">
                  <q-card-section class="row items-center no-wrap">
                    <q-avatar
                      icon="psychology"
                      :color="health.openRouter?.status === 'online' ? 'positive' : 'negative'"
                      text-color="white"
                    />
                    <div class="q-ml-md">
                      <div class="text-subtitle2">
                        IA (OpenRouter)
                      </div>
                      <div class="text-caption text-grey">
                        {{ health.openRouter?.model || 'Desconhecido' }}
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-12 col-md-4">
                <q-card class="health-card bg-surface">
                  <q-card-section class="row items-center no-wrap">
                    <q-avatar
                      icon="database"
                      :color="health.database?.status === 'connected' ? 'positive' : 'negative'"
                      text-color="white"
                    />
                    <div class="q-ml-md">
                      <div class="text-subtitle2">
                        Banco de Dados
                      </div>
                      <div class="text-caption text-grey">
                        {{ health.database?.latency }}ms latência
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-12 col-md-4">
                <q-card class="health-card bg-surface">
                  <q-card-section class="row items-center no-wrap">
                    <q-avatar
                      icon="schedule"
                      color="info"
                      text-color="white"
                    />
                    <div class="q-ml-md">
                      <div class="text-subtitle2">
                        Coletor
                      </div>
                      <div class="text-caption text-grey">
                        Cron: {{ health.collector?.cron }}
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <q-card class="futuristic-card">
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  Controle de Coleta Manual
                </div>
                <div class="bg-surface rounded-borders q-pa-md row items-center">
                  <div class="col">
                    <div class="text-subtitle1">
                      Disparar Coleta Agora
                    </div>
                    <div class="text-caption text-grey">
                      Inicia coleta imediata em todos endpoints ativos
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-btn 
                      push 
                      color="cyan" 
                      icon="play_arrow" 
                      label="Executar" 
                      :loading="collecting"
                      @click="triggerCollection"
                    />
                  </div>
                </div>
                <div class="q-mt-md text-grey-6 text-caption">
                  Última execução: {{ new Date(health.collector?.lastRun || Date.now()).toLocaleString() }}
                </div>
              </q-card-section>
            </q-card>
          </q-tab-panel>

          <!-- Users Panel -->
          <q-tab-panel
            name="users"
            class="q-pa-none"
          >
            <q-card class="futuristic-card">
              <q-card-section class="row items-center justify-between">
                <div class="text-h6">
                  Gerenciar Usuários
                </div>
                <q-btn
                  icon="add"
                  label="Novo Usuário"
                  color="cyan"
                  outline
                  dense
                />
              </q-card-section>
              <q-card-section class="q-pa-none">
                <q-table
                  :rows="users"
                  :columns="userColumns"
                  row-key="id"
                  flat
                  :loading="loadingUsers"
                  class="bg-transparent"
                >
                  <template #body-cell-status="props">
                    <q-td :props="props">
                      <q-toggle
                        v-model="props.row.active"
                        color="positive"
                        @update:model-value="toggleUser(props.row)"
                      />
                    </q-td>
                  </template>
                  <template #body-cell-role="props">
                    <q-td :props="props">
                      <q-badge :color="getRoleColor(props.row.role)">
                        {{ props.row.role.toUpperCase() }}
                      </q-badge>
                    </q-td>
                  </template>
                  <template #body-cell-actions="props">
                    <q-td :props="props">
                      <q-btn
                        flat
                        round
                        icon="edit"
                        size="sm"
                        color="cyan"
                      />
                      <q-btn
                        flat
                        round
                        icon="delete"
                        size="sm"
                        color="negative"
                      />
                    </q-td>
                  </template>
                </q-table>
              </q-card-section>
            </q-card>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import { statsService, type SystemHealth, type User } from 'src/services/stats.service';

const $q = useQuasar();
const router = useRouter();

const activeTab = ref('profile');
const density = ref('comfortable');

// Profile State
const profile = ref({
  name: 'Administrador',
  email: 'admin@insighthub.com',
  currentPassword: '',
  newPassword: ''
});
const saving = ref(false);

// Settings State (mapped from store)
const settings = ref({
  notificationsEnabled: true,
  emailNotifications: false,
  criticalAlertsOnly: false
});

// Health State
const checkingHealth = ref(false);
const health = ref<Partial<SystemHealth>>({});

// Collection State
const collecting = ref(false);

// Users State
const loadingUsers = ref(false);
const users = ref<User[]>([]);

const userColumns: QTableColumn[] = [
  { name: 'name', label: 'Nome', align: 'left', field: 'name', sortable: true },
  { name: 'email', label: 'Email', align: 'left', field: 'email', sortable: true },
  { name: 'role', label: 'Função', align: 'center', field: 'role', sortable: true },
  { name: 'status', label: 'Ativo', align: 'center', field: 'active' },
  { name: 'actions', label: 'Ações', align: 'right', field: 'id' }
];

async function saveProfile() {
  saving.value = true;
  setTimeout(() => {
    saving.value = false;
    $q.notify({ type: 'positive', message: 'Perfil atualizado com sucesso!' });
    profile.value.currentPassword = '';
    profile.value.newPassword = '';
  }, 1000);
}

async function saveSettings() {
  // Here you would call settingsStore.updateSettings(settings.value)
  $q.notify({ type: 'positive', message: 'Preferências salvas com sucesso!' });
}

async function checkHealth() {
  checkingHealth.value = true;
  try {
    health.value = await statsService.getHealth();
  } catch (error) {
    console.error(error);
  } finally {
    checkingHealth.value = false;
  }
}

async function triggerCollection() {
  collecting.value = true;
  try {
    await statsService.triggerCollection();
    $q.notify({ type: 'positive', message: 'Coleta manual iniciada! Verifique os logs.' });
    health.value = await statsService.getHealth();
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao iniciar coleta' });
  } finally {
    collecting.value = false;
  }
}

async function loadUsers() {
  loadingUsers.value = true;
  try {
    users.value = await statsService.getUsers();
  } catch (error) {
    console.error(error);
  } finally {
    loadingUsers.value = false;
  }
}

async function toggleUser(user: User) {
  try {
    await statsService.toggleUserStatus(user.id, user.active);
    $q.notify({ 
      type: user.active ? 'positive' : 'warning', 
      message: `Usuário ${user.active ? 'ativado' : 'desativado'}` 
    });
  } catch {
    user.active = !user.active; // Revert
    $q.notify({ type: 'negative', message: 'Erro ao alterar status' });
  }
}

function getRoleColor(role: string) {
  if (role === 'admin') return 'purple';
  if (role === 'dev') return 'cyan';
  return 'grey';
}

onMounted(() => {
  checkHealth();
  loadUsers();
});
</script>

<style lang="scss" scoped>
.orbitron-font {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 1px;
}

.settings-nav {
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  
  .q-item {
    border-radius: 8px;
    margin: 4px 8px;
    
    &.active-item {
      background: rgba(0, 245, 255, 0.1);
      font-weight: 600;
    }
  }
}

.futuristic-card {
  border-radius: 16px;
  // Background and borders handled by app.scss overrides for .q-card
}

.health-card {
  height: 100%;
  display: flex;
  align-items: center;
}

.bg-surface {
  background: rgba(255, 255, 255, 0.03);
}

.panels-container {
  min-height: 500px;
}

// ═══════════════ RESPONSIVIDADE MOBILE ═══════════════
@media (max-width: 599px) {
  .settings-page {
    padding: 8px !important;
  }

  .settings-page .text-h4 {
    font-size: 1.3rem !important;
  }

  // Settings nav becomes scrollable horizontal
  .settings-nav {
    overflow-x: auto;
    white-space: nowrap;
    display: flex;
    flex-direction: row;
    gap: 4px;
    padding: 8px !important;

    .q-item-label--header {
      display: none;
    }

    .q-item {
      display: inline-flex;
      min-width: auto;
      margin: 0 2px;
      padding: 8px 12px;

      .q-item__section--side {
        min-width: 0;
        padding-right: 4px;
      }

      .q-item__section--main {
        flex: 0 0 auto;
      }
    }
  }

  .panels-container {
    min-height: 300px;
  }

  .health-card {
    flex-direction: column;
  }
}
</style>
