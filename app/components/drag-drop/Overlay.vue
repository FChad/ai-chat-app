<script setup lang="ts">
defineProps<{
  show: boolean
}>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="show"
      class="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-lg rounded-lg pointer-events-none"
    >
      <div class="text-center">
        <div class="flex items-center justify-center gap-2">
          <UIcon name="i-lucide-image" class="size-12 -rotate-12" />
          <UIcon name="i-lucide-file-image" class="size-14" />
          <UIcon name="i-lucide-images" class="size-12 rotate-12" />
        </div>
        <p class="text-lg/7 font-medium mt-4">
          Drop your images here
        </p>
        <p class="text-sm/6 text-muted">
          Supported formats: PNG, JPG, GIF, WebP
        </p>
      </div>
    </div>
  </Transition>
</template>
