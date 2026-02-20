<template>
  <div
    class="status-badge"
    :class="[`status-badge--${status}`, { 'status-badge--pulse': pulse }]"
  >
    <span class="status-dot" />
    <span class="status-text">{{ label || defaultLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  status: 'online' | 'offline' | 'warning' | 'pending' | 'error';
  label?: string;
  pulse?: boolean;
}>(), {
  pulse: true,
});

const defaultLabel = computed(() => {
  const labels: Record<string, string> = {
    online: 'Online',
    offline: 'Offline',
    warning: 'Alerta',
    pending: 'Pendente',
    error: 'Erro',
  };
  return labels[props.status] || props.status;
});
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;

  &--online {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;

    .status-dot {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }
  }

  &--offline {
    background: rgba(100, 116, 139, 0.15);
    color: #64748b;

    .status-dot {
      background: #64748b;
    }
  }

  &--warning {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;

    .status-dot {
      background: #fbbf24;
      box-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
    }
  }

  &--pending {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;

    .status-dot {
      background: #3b82f6;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
    }
  }

  &--error {
    background: rgba(244, 63, 94, 0.15);
    color: #f43f5e;

    .status-dot {
      background: #f43f5e;
      box-shadow: 0 0 8px rgba(244, 63, 94, 0.6);
    }
  }

  &--pulse .status-dot {
    animation: pulse-glow 2s infinite;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-text {
  text-transform: capitalize;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
