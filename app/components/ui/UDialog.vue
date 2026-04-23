<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center" @mousedown.self="handleBackdrop">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/80" />
        <!-- Content -->
        <div
          class="relative z-50 w-full max-w-lg mx-4 rounded-xl border border-border bg-background p-6 shadow-lg"
          v-bind="$attrs"
        >
          <slot />
          <!-- Close button -->
          <button
            class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            @click="$emit('update:open', false)"
          >
            <Icon name="heroicons:x-mark" class="h-4 w-4" />
            <span class="sr-only">Close</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const handleBackdrop = () => {
  emit('update:open', false)
}

// Lock body scroll when dialog is open
watch(() => props.open, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

// Cleanup on unmount
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
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
