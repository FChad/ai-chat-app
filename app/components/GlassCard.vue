<template>
  <div 
    :class="[
      'bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg',
      borderRadius,
      padding,
      classes
    ]"
  >
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
  borderRadius: 'rounded-xl',
  padding: 'p-4',
  classes: ''
})
</script> 