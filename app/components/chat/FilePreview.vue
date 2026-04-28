<template>
  <div class="group relative shrink-0">
    <UAvatar
      :src="isImage ? src : undefined"
      :icon="isImage ? undefined : 'i-lucide-image'"
      :size="size"
      class="rounded-lg"
      :class="isImage ? 'cursor-zoom-in' : ''"
      @click="isImage && (showZoom = true)"
    />
    <UButton
      v-if="removable"
      icon="i-lucide-x"
      size="xs"
      color="neutral"
      class="absolute -top-1 -right-1 rounded-full ring ring-bg opacity-0 group-hover:opacity-100 transition-opacity"
      :aria-label="`Remove ${name || 'file'}`"
      @click="emit('remove')"
    />
  </div>

  <Teleport to="body">
    <div
      v-if="showZoom && isImage"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-default/75 backdrop-blur-sm p-4 cursor-zoom-out"
      @click="showZoom = false"
    >
      <img :src="src" :alt="name || 'Image'" class="max-w-full max-h-full object-contain rounded-lg" @click.stop />
      <UButton
        icon="i-lucide-x"
        color="neutral"
        class="absolute top-4 right-4"
        @click="showZoom = false"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src: string
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    removable?: boolean
  }>(),
  {
    size: '2xl',
    removable: false
  }
)

const emit = defineEmits<{ remove: [] }>()

const showZoom = ref(false)

const isImage = computed(() =>
  /^data:image\/|\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(props.src)
)

onUnmounted(() => {
  showZoom.value = false
})

// ESC to close zoom
onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showZoom.value) showZoom.value = false
  }
  window.addEventListener('keydown', handler)
  onUnmounted(() => window.removeEventListener('keydown', handler))
})
</script>
