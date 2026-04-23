<template>
  <div
    :class="classes"
    role="alert"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'default' | 'destructive'
}>(), {
  variant: 'default',
})

const variantClasses: Record<string, string> = {
  default: 'bg-background text-foreground border-border [&>svg]:text-foreground [&>.iconify]:text-foreground',
  destructive: 'bg-card text-destructive border-destructive [&>svg]:text-destructive [&>.iconify]:text-destructive dark:bg-destructive/10',
}

// `has-[>.iconify]` covers Nuxt Icon (renders as <span class="iconify">),
// `has-[>svg]` covers raw SVG children. Both trigger the icon-column layout.
const classes = computed(() => [
  'relative w-full rounded-lg border px-4 py-3 text-sm grid grid-cols-[0_1fr] has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>.iconify]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 has-[>.iconify]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>.iconify]:size-4 [&>.iconify]:translate-y-0.5',
  variantClasses[props.variant],
])
</script>
