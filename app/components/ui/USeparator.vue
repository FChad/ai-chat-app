<template>
  <hr
    v-if="orientation === 'horizontal'"
    class="shrink-0 border-none bg-border h-px w-full"
    v-bind="$attrs"
  />
  <div
    v-else
    class="shrink-0 bg-border w-px"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
}>(), {
  orientation: 'horizontal',
})
</script>
