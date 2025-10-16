<template>
  <div :class="[
    'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    borderRadius,
    padding,
    classes
  ]">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  borderRadius?: string
  padding?: string
  classes?: string
}

const props = withDefaults(defineProps<Props>(), {
  borderRadius: 'rounded-lg',
  padding: 'p-4',
  classes: ''
})
</script>