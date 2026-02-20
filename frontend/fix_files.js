
const fs = require('fs');
const path = require('path');

const files = {
'src/layouts/MainLayout.vue': `<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>InsightHub</q-toolbar-title>
        <div>v1.0</div>
        <q-btn flat round dense icon="logout" class="q-ml-md" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>Menu</q-item-label>
        <q-item clickable tag="a" to="/">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section><q-item-label>Dashboard</q-item-label></q-item-section>
        </q-item>
        <q-item clickable tag="a" to="/systems">
          <q-item-section avatar><q-icon name="dns" /></q-item-section>
          <q-item-section><q-item-label>Sistemas</q-item-label></q-item-section>
        </q-item>
        <q-item clickable tag="a" to="/endpoints">
          <q-item-section avatar><q-icon name="http" /></q-item-section>
          <q-item-section><q-item-label>Endpoints</q-item-label></q-item-section>
        </q-item>
        <q-item clickable tag="a" to="/insights">
          <q-item-section avatar><q-icon name="lightbulb" /></q-item-section>
          <q-item-section><q-item-label>Insights</q-item-label></q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth.store';
import { useRouter } from 'vue-router';

const leftDrawerOpen = ref(false);
const authStore = useAuthStore();
const router = useRouter();

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function logout() {
  authStore.logout();
  router.push('/auth/login');
}
</script>`,

'src/layouts/AuthLayout.vue': `<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// Auth Layout
</script>`,

'src/pages/LoginPage.vue': `<template>
  <q-page class="flex flex-center">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Login</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input filled v-model="email" label="Email" type="email" lazy-rules :rules="[val => !!val || 'Obrigatório']" />
          <q-input filled v-model="password" label="Senha" type="password" lazy-rules :rules="[val => !!val || 'Obrigatório']" />

          <div>
            <q-btn label="Entrar" type="submit" color="primary" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth.store';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const loading = ref(false);
const authStore = useAuthStore();
const $q = useQuasar();
const router = useRouter();

async function onSubmit() {
  loading.value = true;
  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push('/');
    $q.notify({ type: 'positive', message: 'Login realizado com sucesso!' });
  } catch {
    // Error handled
  } finally {
    loading.value = false;
  }
}
</script>`,

'src/pages/DashboardPage.vue': `<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Dashboard</div>
    
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="bg-primary text-white">
          <q-card-section>
            <div class="text-h6">Sistemas</div>
            <div class="text-h3">{{ systemsStore.systems.length }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSystemsStore } from 'src/stores/systems.store';

const systemsStore = useSystemsStore();

onMounted(() => {
  systemsStore.fetchSystems();
});
</script>`,

'src/pages/SystemsPage.vue': `<template>
  <q-page padding>
    <div class="row q-mb-md justify-between items-center">
      <div class="text-h5">Sistemas Integrados</div>
      <q-btn color="primary" icon="add" label="Novo Sistema" @click="openDialog" />
    </div>

    <q-table :rows="systemsStore.systems" :columns="columns" row-key="id" :loading="systemsStore.loading">
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat round icon="edit" size="sm" color="primary" @click="editSystem(props.row)" />
          <q-btn flat round icon="delete" size="sm" color="negative" @click="confirmDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogOpen">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ isEdit ? 'Editar' : 'Novo' }} Sistema</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleSave" class="q-gutter-md">
            <q-input v-model="form.name" label="Nome" filled :rules="[val => !!val || 'Obrigatório']" />
            <q-input v-model="form.slug" label="Slug" filled :rules="[val => !!val || 'Obrigatório']" />
            <q-input v-model="form.base_url" label="URL Base" filled />
            <div class="row justify-end q-mt-md">
              <q-btn label="Cancelar" flat v-close-popup />
              <q-btn label="Salvar" color="primary" type="submit" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useSystemsStore } from 'src/stores/systems.store';
import { useQuasar, type QTableColumn } from 'quasar';
import type { System } from 'src/types';

const systemsStore = useSystemsStore();
const $q = useQuasar();

const columns: QTableColumn[] = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  { name: 'slug', label: 'Slug', field: 'slug', align: 'left' },
  { name: 'base_url', label: 'URL Base', field: 'base_url', align: 'left' },
  { name: 'actions', label: 'Ações', field: 'actions', align: 'center' },
];

const dialogOpen = ref(false);
const isEdit = ref(false);
const form = reactive({ id: '', name: '', slug: '', base_url: '' });

onMounted(() => {
  systemsStore.fetchSystems();
});

function openDialog() {
  isEdit.value = false;
  form.id = '';
  form.name = '';
  form.slug = '';
  form.base_url = '';
  dialogOpen.value = true;
}

function editSystem(system: System) {
  isEdit.value = true;
  form.id = system.id;
  form.name = system.name;
  form.slug = system.slug;
  form.base_url = system.base_url || '';
  dialogOpen.value = true;
}

async function handleSave() {
  try {
    if (isEdit.value) {
      await systemsStore.updateSystem(form.id, { ...form });
    } else {
      await systemsStore.createSystem({ ...form });
    }
    dialogOpen.value = false;
    // $q.notify ... skipped strict typing issues
  } catch {
      // error
  }
}

function confirmDelete(system: System) {
  $q.dialog({
    title: 'Confirmar',
    message: \`Deseja excluir o sistema \${system.name}?\`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await systemsStore.deleteSystem(system.id);
    } catch {
       // error
    }
  });
}
</script>`,

'src/pages/EndpointsPage.vue': `<template>
  <q-page padding>
    <div class="row q-mb-md justify-between items-center">
      <div class="text-h5">Endpoints Monitorados</div>
      <q-btn color="primary" icon="add" label="Novo Endpoint" @click="openDialog" />
    </div>

    <q-table :rows="endpointsStore.systemEndpoints" :columns="columns" row-key="id" :loading="endpointsStore.loading">
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
           <q-btn flat round icon="play_arrow" size="sm" color="positive" @click="testEndpoint(props.row)" />
           <q-btn flat round icon="edit" size="sm" color="primary" @click="editEndpoint(props.row)" />
           <q-btn flat round icon="delete" size="sm" color="negative" @click="confirmDelete(props.row)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEndpointsStore } from 'src/stores/endpoints.store';
import { useQuasar, type QTableColumn } from 'quasar';
import type { Endpoint } from 'src/types';

const endpointsStore = useEndpointsStore();
const $q = useQuasar();

const columns: QTableColumn[] = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  { name: 'method', label: 'Método', field: 'method', align: 'left' },
  { name: 'url_template', label: 'URL', field: 'url_template', align: 'left' },
  { name: 'actions', label: 'Ações', field: 'actions', align: 'center' },
];

const dialogOpen = ref(false);

onMounted(() => {
    endpointsStore.fetchAll();
});

function openDialog() {
    dialogOpen.value = true;
}

function testEndpoint(endpoint: Endpoint) {
    // test
}

function editEndpoint(endpoint: Endpoint) {
    dialogOpen.value = true;
}

function confirmDelete(endpoint: Endpoint) {
    // delete
}
</script>`,

  'src/pages/InsightsPage.vue': `<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Insights</div>
    
    <q-list bordered separator>
        <q-item v-for="insight in insightsStore.insights" :key="insight.id">
            <q-item-section>
                <q-item-label>{{ insight.title }}</q-item-label>
                <q-item-label caption lines="3">{{ insight.content }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-badge :color="getSeverityColor(insight.severity)">{{ insight.severity }}</q-badge>
            </q-item-section>
        </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useInsightsStore } from 'src/stores/insights.store';
import type { Insight } from 'src/types';

const insightsStore = useInsightsStore();

onMounted(() => {
    insightsStore.fetchAll();
});

function getSeverityColor(sev: string) {
    if (sev === 'critical') return 'negative';
    if (sev === 'warning') return 'warning';
    return 'info';
}
</script>`,

'src/pages/SystemDetailPage.vue': `<template> <q-page padding> <div class="text-h5">Detalhes do Sistema</div> </q-page> </template> <script setup lang="ts"> </script>`,
'src/pages/InsightDetailPage.vue': `<template> <q-page padding> <div class="text-h5">Detalhes do Insight</div> </q-page> </template> <script setup lang="ts"> </script>`,
'src/pages/ChatInsightPage.vue': `<template> <q-page padding> <div class="text-h5">Chat</div> </q-page> </template> <script setup lang="ts"> </script>`,
'src/pages/SettingsPage.vue': `<template> <q-page padding> <div class="text-h5">Config</div> </q-page> </template> <script setup lang="ts"> </script>`,
'src/pages/ErrorNotFound.vue': `<template> <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center"> <div>404</div> </div> </template> <script setup lang="ts"> </script>`
};

for (const [key, value] of Object.entries(files)) {
  const filePath = path.resolve(__dirname, key);
  fs.writeFileSync(filePath, value, { encoding: 'utf8' });
  console.log('Updated ' + key);
}
