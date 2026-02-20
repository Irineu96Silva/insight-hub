<template>
  <span
    class="method-badge"
    :class="`method--${method.toLowerCase()}`"
  >
    {{ method.toUpperCase() }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  method: string;
}>();
</script>

<style lang="scss" scoped>
.method-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: monospace;
  min-width: 60px;
  text-align: center;
  display: inline-block;

  &.method--get {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  &.method--post {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  &.method--put {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  &.method--patch {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
  }

  &.method--delete {
    background: rgba(244, 63, 94, 0.2);
    color: #f43f5e;
  }

  &.method--head,
  &.method--options {
    background: rgba(100, 116, 139, 0.2);
    color: #94a3b8;
  }
}
</style>
