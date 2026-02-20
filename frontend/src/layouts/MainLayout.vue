<template>
  <q-layout
    view="lHh Lpr lFf"
    class="bg-gradient-radial"
  >
    <!-- HEADER -->
    <q-header class="futuristic-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="text-cyan"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="flex items-center gap-3">
          <div class="logo-icon">
            <q-icon
              name="insights"
              size="28px"
            />
          </div>
          <span>INSIGHTHUB</span>
        </q-toolbar-title>

        <q-space />

        <!-- Status indicator -->
        <div class="status-indicator q-mr-lg">
          <div class="status-dot" />
          <span class="text-caption text-grey-5">Sistema Online</span>
        </div>

        <!-- Version badge -->
        <q-chip
          dense
          color="transparent"
          text-color="cyan"
          class="version-chip q-mr-md"
        >
          <q-icon
            name="code"
            size="xs"
            class="q-mr-xs"
          />
          v1.0
        </q-chip>

        <!-- Dark Mode Toggle -->
        <q-btn
          flat
          round
          dense
          :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
          class="q-mr-sm text-cyan"
          @click="toggleDarkMode"
        />

        <!-- User menu -->
        <q-btn
          flat
          round
          dense
          class="user-btn"
        >
          <q-avatar
            size="36px"
            class="user-avatar"
          >
            <q-icon
              name="person"
              size="20px"
            />
          </q-avatar>
          <q-menu class="futuristic-menu">
            <q-list style="min-width: 180px">
              <q-item
                v-close-popup
                clickable
                @click="router.push('/settings')"
              >
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section>
                <q-item-section>Configurações</q-item-section>
              </q-item>
              <q-separator class="bg-grey-9" />
              <q-item
                v-close-popup
                clickable
                @click="logout"
              >
                <q-item-section avatar>
                  <q-icon
                    name="logout"
                    color="negative"
                  />
                </q-item-section>
                <q-item-section class="text-negative">
                  Sair
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- SIDEBAR -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="280"
      class="futuristic-drawer"
    >
      <!-- Logo area -->
      <div class="drawer-header">
        <div class="brand-container">
          <div class="brand-icon animate-pulse-glow">
            <q-icon
              name="hub"
              size="32px"
            />
          </div>
          <div class="brand-text">
            <div class="brand-name">
              INSIGHT
            </div>
            <div class="brand-subtitle">
              HUB
            </div>
          </div>
        </div>
      </div>

      <q-separator class="bg-grey-9 q-mx-md" />

      <!-- Navigation -->
      <q-list class="q-pa-sm">
        <q-item-label
          header
          class="nav-header"
        >
          <q-icon
            name="apps"
            size="xs"
            class="q-mr-sm"
          />
          NAVEGAÇÃO
        </q-item-label>

        <q-item
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          clickable
          class="nav-item"
          active-class="nav-item--active"
        >
          <q-item-section avatar>
            <div class="nav-icon-wrapper">
              <q-icon
                :name="link.icon"
                size="22px"
              />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="nav-label">
              {{ link.label }}
            </q-item-label>
            <q-item-label
              caption
              class="nav-caption"
            >
              {{ link.caption }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon
              name="chevron_right"
              size="xs"
              class="nav-arrow"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <q-space />

      <!-- Bottom section -->
      <div class="drawer-footer">
        <div class="system-status">
          <div class="status-row">
            <span class="status-label">API Status</span>
            <q-badge
              color="positive"
              class="status-badge"
            >
              <q-icon
                name="check_circle"
                size="10px"
                class="q-mr-xs"
              />
              Ativo
            </q-badge>
          </div>
          <div class="status-row">
            <span class="status-label">Última Sync</span>
            <span class="status-value">há 2 min</span>
          </div>
        </div>
      </div>
    </q-drawer>

    <!-- MAIN CONTENT -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition
          name="fade-slide"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from 'src/stores/auth.store';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const leftDrawerOpen = ref(false);
const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

const navLinks = [
  {
    to: '/',
    icon: 'dashboard',
    label: 'Dashboard',
    caption: 'Visão geral do sistema'
  },
  {
    to: '/insights',
    icon: 'auto_awesome',
    label: 'Insights',
    caption: 'Relatórios inteligentes'
  },
  {
    to: '/network-tests',
    icon: 'lan',
    label: 'Testes de Rede',
    caption: 'Monitoramento proativo'
  },
  {
    to: '/chat',
    icon: 'smart_toy',
    label: 'Chat AI',
    caption: 'Assistente inteligente'
  },
  {
    to: '/systems',
    icon: 'dns',
    label: 'Sistemas',
    caption: 'Gerenciar integrações'
  },
];

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleDarkMode() {
  $q.dark.toggle();
}

function logout() {
  authStore.logout();
  router.push('/auth/login');
}

// Global Theme Watcher
watch(() => $q.dark.isActive, (isDark) => {
  if (isDark) {
    document.body.classList.remove('body--light');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.add('body--light');
    localStorage.setItem('theme', 'light');
  }
});

onMounted(() => {
  // Initialize Theme from LocalStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    $q.dark.set(false);
  } else {
    $q.dark.set(true); // Default to dark
  }
});
</script>

<style lang="scss" scoped>
.futuristic-header {
  background: var(--bg-header) !important;
  border-bottom: 1px solid var(--border-color) !important;
  backdrop-filter: blur(20px);
  color: var(--text-primary);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--accent-soft);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
}

.text-cyan {
  color: var(--accent-color) !important;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);

  .status-dot {
    width: 8px;
    height: 8px;
    background: var(--accent-color);
    border-radius: 50%;
    animation: pulse-glow 2s ease-in-out infinite;
  }
}

.version-chip {
  border: 1px solid var(--border-glow);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.7rem;
  color: var(--accent-color);
}

.user-avatar {
  background: var(--accent-soft);
  border: 1px solid var(--border-glow);
  color: var(--accent-color);
}

.futuristic-menu {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px;
  backdrop-filter: blur(20px);
}

.futuristic-drawer {
  background: var(--bg-drawer) !important;
  border-right: 1px solid var(--border-color) !important;
}

.drawer-header {
  padding: 24px 20px;
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-icon {
  width: 52px;
  height: 52px;
  background: var(--accent-soft);
  border: 1px solid var(--border-glow);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
}

.brand-text {
  .brand-name {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 3px;
    background: linear-gradient(90deg, #00f5ff, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .brand-subtitle {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.65rem;
    letter-spacing: 6px;
    color: #64748b;
    margin-top: 2px;
  }
}

.nav-header {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 2px;
  color: var(--text-muted);
  padding: 20px 16px 12px;
  display: flex;
  align-items: center;
}

.nav-item {
  border-radius: 14px;
  margin: 4px 8px;
  padding: 12px 14px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--accent-soft);

    .nav-icon-wrapper {
      background: var(--accent-soft);
      border-color: var(--border-glow);
    }

    .nav-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &--active {
    background: var(--accent-soft) !important;

    .nav-icon-wrapper {
      background: var(--accent-soft);
      border-color: var(--border-glow);
      color: var(--accent-color);
      box-shadow: 0 0 12px rgba(0, 245, 255, 0.2);
    }

    .nav-label {
      color: var(--text-primary);
    }

    .nav-arrow {
      opacity: 1;
      color: var(--accent-color);
    }
  }
}

.nav-icon-wrapper {
  width: 42px;
  height: 42px;
  background: var(--badge-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-icon);
  transition: all 0.3s ease;
}

.nav-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.nav-caption {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.nav-arrow {
  color: var(--text-muted);
  opacity: 0;
  transform: translateX(-5px);
  transition: all 0.3s ease;
}

.drawer-footer {
  padding: 16px;
  margin: 8px;
  background: var(--badge-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
}

.system-status {
  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;

    &:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 6px;
    }
  }

  .status-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .status-value {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .status-badge {
    font-size: 0.65rem;
    padding: 2px 8px;
  }
}

// Page transitions
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 4px rgba(34, 211, 238, 0.5);
  }
  50% {
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.8);
  }
}

// ═══════════════ RESPONSIVIDADE MOBILE ═══════════════
@media (max-width: 599px) {
  .status-indicator {
    display: none !important;
  }

  .version-chip {
    display: none !important;
  }

  .drawer-header {
    padding: 16px 14px;
  }

  .brand-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .brand-text .brand-name {
    font-size: 0.9rem;
    letter-spacing: 2px;
  }

  .nav-item {
    margin: 2px 4px;
    padding: 10px 10px;
  }

  .nav-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .drawer-footer {
    padding: 12px;
    margin: 4px;
  }
}
</style>
