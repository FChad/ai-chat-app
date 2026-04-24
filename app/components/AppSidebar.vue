<template>
  <div class="flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto -mx-2 px-2 scrollbar-thin">
    <div v-if="chatStore.conversations.length === 0" class="px-2 py-8 text-center text-xs text-muted">
      No conversations yet.
    </div>

    <NuxtLink
      v-for="conv in sortedConversations"
      :key="conv.id"
      :to="`/chat/${conv.id}`"
      class="group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted hover:text-default hover:bg-elevated/50 data-[active=true]:bg-elevated data-[active=true]:text-highlighted transition-colors min-w-0"
      :data-active="conv.id === currentId"
    >
      <UIcon
        v-if="isSessionTyping(conv)"
        name="i-lucide-loader-2"
        class="size-3.5 shrink-0 animate-spin text-primary"
      />
      <UIcon
        v-else
        name="i-lucide-message-circle"
        class="size-3.5 shrink-0"
      />
      <span class="truncate flex-1">{{ conv.title || 'New Conversation' }}</span>
      <UButton
        icon="i-lucide-x"
        size="xs"
        color="neutral"
        variant="ghost"
        class="opacity-0 group-hover:opacity-100 -mr-1"
        aria-label="Delete conversation"
        @click.stop.prevent="confirmDelete(conv)"
      />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '../../types/chat'
import ModalConfirm from './ModalConfirm.vue'

const chatStore = useChatStore()
const route = useRoute()
const overlay = useOverlay()

const currentId = computed(() => route.params.id as string | undefined)

const sortedConversations = computed(() =>
  [...chatStore.conversations].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
)

const isSessionTyping = (conv: Conversation) =>
  !!conv.sessionId && chatStore.isSessionActive(conv.sessionId)

const modal = overlay.create(ModalConfirm, {
  props: {
    title: 'Delete conversation',
    description: '',
    confirmLabel: 'Delete',
    destructive: true
  }
})

const confirmDelete = async (conv: Conversation) => {
  const instance = modal.open({
    title: 'Delete conversation',
    description: `Are you sure you want to delete "${conv.title || 'this conversation'}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    destructive: true
  })
  const confirmed = await instance.result
  if (confirmed) {
    chatStore.deleteConversation(conv.id)
    if (currentId.value === conv.id) {
      await navigateTo('/chat/new')
    }
  }
}
</script>
