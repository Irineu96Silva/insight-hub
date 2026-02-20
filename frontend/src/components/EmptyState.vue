<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <q-icon
        :name="icon"
        :size="iconSize"
      />
    </div>
    <h3 class="empty-state__title">
      {{ title }}
    </h3>
    <p class="empty-state__text">
      {{ description }}
    </p>
    <div
      v-if="$slots.action || actionLabel"
      class="empty-state__action"
    >
      <slot name="action">
        <q-btn
          v-if="actionLabel"
          color="cyan"
          :icon="actionIcon"
          :label="actionLabel"
          @click="$emit('action')"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string;
  iconSize?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: string;
}>(), {
  icon: 'inbox',
  iconSize: '64px',
});

defineEmits<{
  (e: 'action'): void;
}>();
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  &__icon {
    width: 100px;
    height: 100px;
    background: rgba(15, 15, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.05);
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
    max-width: 400px;
  }

  &__action {
    margin-top: 8px;
  }
}
</style>
