<template>
  <div
    class="severity-indicator"
    :class="`severity--${severity}`"
  >
    <div
      v-if="showBar"
      class="severity-bar"
    />
    <div
      v-if="showIcon"
      class="severity-icon"
    >
      <q-icon
        :name="icon"
        :size="iconSize"
      />
    </div>
    <span
      v-if="showLabel"
      class="severity-label"
    >{{ label }}</span>
    <q-badge
      v-if="showBadge"
      :color="badgeColor"
      class="severity-badge"
    >
      {{ badgeLabel }}
    </q-badge>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  severity: 'critical' | 'warning' | 'info' | 'success';
  showBar?: boolean;
  showIcon?: boolean;
  showLabel?: boolean;
  showBadge?: boolean;
  iconSize?: string;
}>(), {
  showBar: false,
  showIcon: true,
  showLabel: false,
  showBadge: false,
  iconSize: '20px',
});

const icon = computed(() => {
  const icons: Record<string, string> = {
    critical: 'error',
    warning: 'warning',
    info: 'info',
    success: 'check_circle',
  };
  return icons[props.severity];
});

const label = computed(() => {
  const labels: Record<string, string> = {
    critical: 'Critico',
    warning: 'Alerta',
    info: 'Informacao',
    success: 'Sucesso',
  };
  return labels[props.severity];
});

const badgeColor = computed(() => {
  const colors: Record<string, string> = {
    critical: 'negative',
    warning: 'warning',
    info: 'info',
    success: 'positive',
  };
  return colors[props.severity];
});

const badgeLabel = computed(() => {
  const labels: Record<string, string> = {
    critical: 'CRITICO',
    warning: 'ALERTA',
    info: 'INFO',
    success: 'OK',
  };
  return labels[props.severity];
});
</script>

<style lang="scss" scoped>
.severity-indicator {
  display: flex;
  align-items: center;
  gap: 10px;

  &.severity--critical {
    .severity-bar { background: #f43f5e; }
    .severity-icon { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
    .severity-label { color: #f43f5e; }
  }

  &.severity--warning {
    .severity-bar { background: #fbbf24; }
    .severity-icon { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .severity-label { color: #fbbf24; }
  }

  &.severity--info {
    .severity-bar { background: #3b82f6; }
    .severity-icon { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .severity-label { color: #3b82f6; }
  }

  &.severity--success {
    .severity-bar { background: #10b981; }
    .severity-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .severity-label { color: #10b981; }
  }
}

.severity-bar {
  width: 4px;
  height: 40px;
  border-radius: 2px;
}

.severity-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.severity-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.severity-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 4px 10px;
}
</style>
