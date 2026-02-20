<template>
  <div
    class="stat-card"
    :class="[`stat-card--${color}`, { 'stat-card--clickable': clickable }]"
    @click="handleClick"
  >
    <div class="stat-icon">
      <q-icon
        :name="icon"
        :size="iconSize"
      />
    </div>
    <div class="stat-content">
      <span class="stat-value">{{ formattedValue }}</span>
      <span class="stat-label">{{ label }}</span>
      <span
        v-if="subtitle"
        class="stat-subtitle"
      >{{ subtitle }}</span>
    </div>
    <div
      v-if="trend"
      class="stat-trend"
      :class="`trend--${trend.direction}`"
    >
      <q-icon
        :name="trend.direction === 'up' ? 'trending_up' : 'trending_down'"
        size="14px"
      />
      <span>{{ trend.value }}%</span>
    </div>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Trend {
  direction: 'up' | 'down';
  value: number;
}

const props = withDefaults(defineProps<{
  icon: string;
  value: string | number;
  label: string;
  subtitle?: string;
  color?: 'cyan' | 'purple' | 'green' | 'yellow' | 'pink' | 'blue';
  iconSize?: string;
  trend?: Trend;
  clickable?: boolean;
}>(), {
  color: 'cyan',
  iconSize: '28px',
  clickable: false,
});

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    if (props.value >= 1000000) {
      return `${(props.value / 1000000).toFixed(1)}M`;
    }
    if (props.value >= 1000) {
      return `${(props.value / 1000).toFixed(1)}k`;
    }
    return props.value.toString();
  }
  return props.value;
});

function handleClick() {
  if (props.clickable) {
    emit('click');
  }
}
</script>

<style lang="scss" scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(15, 15, 30, 0.9) 0%, rgba(10, 10, 20, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &--clickable {
    cursor: pointer;
  }

  // Color variants
  &--cyan {
    .stat-icon { background: rgba(0, 245, 255, 0.15); color: #00f5ff; }
    .stat-value { color: #00f5ff; }
  }

  &--purple {
    .stat-icon { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
    .stat-value { color: #a855f7; }
  }

  &--green {
    .stat-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .stat-value { color: #10b981; }
  }

  &--yellow {
    .stat-icon { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .stat-value { color: #fbbf24; }
  }

  &--pink {
    .stat-icon { background: rgba(236, 72, 153, 0.15); color: #ec4899; }
    .stat-value { color: #ec4899; }
  }

  &--blue {
    .stat-icon { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .stat-value { color: #3b82f6; }
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.stat-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
}

.stat-subtitle {
  font-size: 0.7rem;
  color: #475569;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;

  &.trend--up {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  &.trend--down {
    background: rgba(244, 63, 94, 0.15);
    color: #f43f5e;
  }
}
</style>
