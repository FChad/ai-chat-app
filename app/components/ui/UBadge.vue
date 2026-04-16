<template>
  <span :class="classes" v-bind="$attrs">
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const variantClasses: Record<string, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-white',
  outline: 'border border-border text-foreground',
}

const classes = computed(() => [
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  variantClasses[props.variant],
])
</script>
