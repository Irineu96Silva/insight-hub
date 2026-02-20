<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="loading-overlay"
    >
      <q-spinner-orbit
        :color="color"
        :size="size"
      />
      <p
        v-if="message"
        class="loading-message"
      >
        {{ message }}
      </p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  show: boolean;
  message?: string;
  size?: string;
  color?: string;
}>(), {
  size: '80px',
  color: 'cyan',
});
</script>

<style lang="scss" scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(5, 5, 15, 0.9);
  z-index: 100;
  backdrop-filter: blur(4px);
}

.loading-message {
  margin-top: 20px;
  color: #94a3b8;
  font-size: 0.95rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
