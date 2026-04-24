<template>
  <UModal
    :title="title"
    :description="description"
    :close="false"
    :dismissible="false"
    :ui="{ footer: 'flex-row-reverse justify-start' }"
  >
    <template #footer>
      <UButton :color="destructive ? 'error' : 'primary'" :label="confirmLabel" @click="emit('close', true)" />
      <UButton color="neutral" variant="ghost" :label="cancelLabel" @click="emit('close', false)" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    destructive?: boolean
  }>(),
  {
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    destructive: true
  }
)

const emit = defineEmits<{ close: [confirmed: boolean] }>()
</script>
