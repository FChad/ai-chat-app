<template>
  <span class="relative flex size-8 shrink-0 overflow-hidden rounded-full" v-bind="$attrs">
    <img v-if="src && !imgError" :src="src" :alt="alt" class="aspect-square h-full w-full object-cover" @error="imgError = true" />
    <span v-else class="flex size-full items-center justify-center rounded-full bg-muted">
      <slot />
    </span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  src?: string
  alt?: string
}>()

const imgError = ref(false)
</script>
