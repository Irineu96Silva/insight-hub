<template>
  <div
    class="glass-card"
    :class="[
      `glass-card--${variant}`,
      { 'glass-card--hoverable': hoverable, 'glass-card--clickable': clickable }
    ]"
    @click="handleClick"
  >
    <div
      v-if="$slots.header || title"
      class="glass-card__header"
    >
      <slot name="header">
        <div class="header-content">
          <div
            v-if="icon"
            class="header-icon"
            :class="`icon--${iconColor}`"
          >
            <q-icon
              :name="icon"
              :size="iconSize"
            />
          </div>
          <div class="header-text">
            <h3 class="header-title">
              {{ title }}
            </h3>
            <p
              v-if="subtitle"
              class="header-subtitle"
            >
              {{ subtitle }}
            </p>
          </div>
        </div>
        <slot name="header-actions" />
      </slot>
    </div>
    <div
      class="glass-card__body"
      :class="{ 'glass-card__body--no-padding': noPadding }"
    >
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="glass-card__footer"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string;
  subtitle?: string;
  icon?: string;
  iconSize?: string;
  iconColor?: 'cyan' | 'purple' | 'green' | 'yellow' | 'pink' | 'blue';
  variant?: 'default' | 'elevated' | 'outlined';
  hoverable?: boolean;
  clickable?: boolean;
  noPadding?: boolean;
}>(), {
  iconSize: '24px',
  iconColor: 'cyan',
  variant: 'default',
  hoverable: true,
  clickable: false,
  noPadding: false,
});

const emit = defineEmits<{
  (e: 'click'): void;
}>();

function handleClick() {
  if (props.clickable) {
    emit('click');
  }
}
</script>

<style lang="scss" scoped>
.glass-card {
  background: linear-gradient(135deg, rgba(15, 15, 30, 0.9) 0%, rgba(10, 10, 20, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;

  &--hoverable:hover {
    border-color: rgba(0, 245, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
    }
  }

  &--elevated {
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  &--outlined {
    background: transparent;
    border: 2px solid rgba(0, 245, 255, 0.2);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  &__body {
    padding: 24px;

    &--no-padding {
      padding: 0;
    }
  }

  &__footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.2);
  }
}

.header-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.icon--cyan {
    background: rgba(0, 245, 255, 0.15);
    color: #00f5ff;
  }

  &.icon--purple {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
  }

  &.icon--green {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  &.icon--yellow {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
  }

  &.icon--pink {
    background: rgba(236, 72, 153, 0.15);
    color: #ec4899;
  }

  &.icon--blue {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.header-subtitle {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}
</style>
