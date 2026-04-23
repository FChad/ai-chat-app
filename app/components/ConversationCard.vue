<template>
  <UCard @click="navigateTo(`/chat/${conversation.id}`)"
    class="group cursor-pointer transition-colors hover:bg-accent">
    <UCardContent class="p-4 pt-4">
      <div class="flex items-center justify-between gap-2 mb-2">
        <h3 class="text-sm font-semibold line-clamp-2 flex-1 leading-snug">{{ conversation.title }}</h3>
        <UTooltip side="left">
          <template #trigger>
            <button
              class="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              @click.stop="$emit('delete', { id: conversation.id, title: conversation.title })"
              :disabled="isTyping">
              <Icon name="heroicons:trash" class="h-4 w-4" />
            </button>
          </template>
          Delete conversation
        </UTooltip>
      </div>
      <UBadge variant="secondary" class="text-xs mb-3 max-w-full overflow-hidden">
        <Icon name="heroicons:cpu-chip" class="h-3 w-3 mr-1 shrink-0" />
        <span class="truncate">{{ conversation.model.split(':')[0] }}</span>
      </UBadge>
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span class="flex items-center gap-1">
          <Icon name="heroicons:chat-bubble-left" class="h-3 w-3" />
          {{ conversation.messages.length }} messages
        </span>
        <template v-if="isTyping">
          <div class="flex space-x-0.5">
            <div class="typing-dot"></div>
            <div class="typing-dot" style="animation-delay: 0.2s"></div>
            <div class="typing-dot" style="animation-delay: 0.4s"></div>
          </div>
        </template>
        <span v-else>{{ formatRelativeTime(conversation.updatedAt) }}</span>
      </div>
    </UCardContent>
  </UCard>
</template>

<script setup lang="ts">
import type { Conversation } from '../../types/chat'

const props = defineProps<{
  conversation: Conversation
}>()

defineEmits<{
  delete: [payload: { id: string; title: string }]
}>()

const chatStore = useChatStore()
const { formatRelativeTime } = useTimeFormat()

const isTyping = computed(() => {
  const sessionId = props.conversation.sessionId
  return sessionId ? chatStore.isSessionActive(sessionId) : false
})
</script>

<style scoped>
.typing-dot {
  width: 4px;
  height: 4px;
  background-color: currentColor;
  border-radius: 50%;
  animation: typing-bounce 1s infinite;
}

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
</style>
