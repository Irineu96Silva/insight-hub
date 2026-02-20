<template>
  <div class="page-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="page-title">
          <q-icon
            v-if="icon"
            :name="icon"
            class="title-icon"
          />
          {{ title }}
        </h1>
        <p
          v-if="subtitle"
          class="page-subtitle"
        >
          {{ subtitle }}
        </p>
      </div>
      <div class="header-right">
        <slot name="actions" />
      </div>
    </div>
    <slot name="below" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  icon?: string;
}>();
</script>

<style lang="scss" scoped>
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;

  .title-icon {
    color: #00f5ff;
    filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.5));
  }
}

.page-subtitle {
  color: #64748b;
  margin-top: 6px;
  font-size: 0.9rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
