<template>
  <Teleport to="body">
    <!-- Backdrop (separate from panel, just fades) -->
    <Transition name="sheet-backdrop">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/80"
        @click="$emit('update:open', false)"
      />
    </Transition>

    <!-- Panel (slides in/out independently) -->
    <Transition :name="transitionName">
      <div v-if="open" :class="panelClasses" @mousedown.stop>
        <slot />
        <!-- Close button -->
        <button
          class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring z-10"
          @click="$emit('update:open', false)"
        >
          <Icon name="heroicons:x-mark" class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  open: boolean
  side?: 'left' | 'right' | 'top' | 'bottom'
  panelClass?: string
}>(), {
  side: 'right',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const sideClasses: Record<string, string> = {
  left:   'fixed inset-y-0 left-0   z-50 h-full border-r border-border bg-background shadow-lg',
  right:  'fixed inset-y-0 right-0  z-50 h-full border-l border-border bg-background shadow-lg',
  top:    'fixed inset-x-0 top-0    z-50 w-full border-b border-border bg-background shadow-lg',
  bottom: 'fixed inset-x-0 bottom-0 z-50 w-full border-t border-border bg-background shadow-lg',
}

const panelClasses = computed(() => [
  'flex flex-col overflow-hidden',
  sideClasses[props.side],
  props.panelClass,
])

const transitionName = computed(() => `sheet-${props.side}`)

// Lock body scroll
watch(() => props.open, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

// Close on Escape
onMounted(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.open) {
      emit('update:open', false)
    }
  }
  window.addEventListener('keydown', handleEsc)
  onUnmounted(() => window.removeEventListener('keydown', handleEsc))
})
</script>

<style scoped>
/* Backdrop */
.sheet-backdrop-enter-active,
.sheet-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.sheet-backdrop-enter-from,
.sheet-backdrop-leave-to {
  opacity: 0;
}

/* Panels */
.sheet-right-enter-active,
.sheet-right-leave-active,
.sheet-left-enter-active,
.sheet-left-leave-active,
.sheet-top-enter-active,
.sheet-top-leave-active,
.sheet-bottom-enter-active,
.sheet-bottom-leave-active {
  transition: transform 0.3s ease;
}

.sheet-right-enter-from,
.sheet-right-leave-to {
  transform: translateX(100%);
}

.sheet-left-enter-from,
.sheet-left-leave-to {
  transform: translateX(-100%);
}

.sheet-top-enter-from,
.sheet-top-leave-to {
  transform: translateY(-100%);
}

.sheet-bottom-enter-from,
.sheet-bottom-leave-to {
  transform: translateY(100%);
}
</style>
