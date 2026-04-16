<template>
  <div class="relative inline-flex group/tooltip" v-bind="$attrs">
    <slot name="trigger" />
    <div
      class="absolute z-50 hidden group-hover/tooltip:block w-max max-w-xs rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md"
      :class="positionClasses"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  side?: 'top' | 'bottom' | 'left' | 'right'
}>(), {
  side: 'top',
})

const positionClasses = computed(() => {
  switch (props.side) {
    case 'top': return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2'
    case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2'
    case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2'
  }
})
</script>
