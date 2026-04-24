<template>
  <UTooltip text="Copy">
    <UButton
      :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
      :color="copied ? 'primary' : 'neutral'"
      variant="ghost"
      size="sm"
      @click="doCopy"
    />
  </UTooltip>
  <UTooltip v-if="canRegenerate" text="Regenerate">
    <UButton
      icon="i-lucide-rotate-cw"
      color="neutral"
      variant="ghost"
      size="sm"
      @click="emit('regenerate')"
    />
  </UTooltip>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { Message } from '../../../types/chat'

const props = defineProps<{
  message: Message
  canRegenerate?: boolean
}>()

const emit = defineEmits<{ regenerate: [] }>()

const textToCopy = computed(() => {
  const c = props.message.content
  if (typeof c === 'string') return c
  return c.find(p => p.type === 'text')?.text || ''
})

const { copy, copied } = useClipboard({ source: textToCopy, copiedDuring: 2000 })
const doCopy = () => copy(textToCopy.value)
</script>
