<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Page toolbar -->
    <div class="flex items-center justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
      <p class="text-sm text-muted-foreground">
        {{ chatStore.conversations.length }} conversation{{ chatStore.conversations.length !== 1 ? 's' : '' }}
      </p>
      <UButton size="sm" @click="startNewChat">
        <Icon name="heroicons:plus" class="h-4 w-4 mr-2" />
        New Chat
      </UButton>
    </div>

    <!-- Scrollable list -->
    <div class="flex-1 overflow-y-auto p-4 scrollbar-thin">
      <!-- Loading State -->
      <div v-if="chatStore.isLoading" class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <USkeleton v-for="i in 8" :key="i" class="h-28 rounded-xl" />
      </div>

      <!-- Empty State -->
      <div v-else-if="chatStore.conversations.length === 0"
        class="flex items-center justify-center h-full min-h-[60vh]">
        <div class="text-center max-w-xs">
          <h3 class="text-base font-semibold mb-1">No conversations yet</h3>
          <p class="text-sm text-muted-foreground mb-4">Start a new chat to get going</p>
          <UButton @click="startNewChat">
            <Icon name="heroicons:plus" class="h-4 w-4 mr-2" />
            New Chat
          </UButton>
        </div>
      </div>

      <!-- Conversation Grid -->
      <div v-else class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <UCard v-for="conversation in chatStore.conversations" :key="conversation.id"
          @click="navigateTo(`/chat/${conversation.id}`)"
          class="group cursor-pointer transition-colors hover:bg-accent">
          <UCardContent class="p-4 pt-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-sm font-semibold line-clamp-2 flex-1 leading-snug">{{ conversation.title }}</h3>
              <UTooltip side="left">
                <template #trigger>
                  <button
                    class="opacity-0 group-hover:opacity-100 shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-all"
                    @click.stop="confirmDeleteConversation(conversation.id, conversation.title)"
                    :disabled="isConversationTyping(conversation.id)">
                    <Icon name="heroicons:trash" class="h-3.5 w-3.5" />
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
              <template v-if="isConversationTyping(conversation.id)">
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
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <UDialog :open="showConfirmDialog" @update:open="showConfirmDialog = $event" class="max-w-sm">
      <div class="flex flex-col gap-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 flex items-center justify-center bg-destructive/10 rounded-lg shrink-0">
            <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 class="text-lg font-semibold">Delete conversation</h3>
            <p class="text-sm text-muted-foreground">Irreversible action</p>
          </div>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Do you really want to delete <strong class="text-foreground">"{{ conversationToDelete?.title }}"</strong>?
          This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="showConfirmDialog = false">Cancel</UButton>
          <UButton variant="destructive" @click="deleteConversation">Delete</UButton>
        </div>
      </div>
    </UDialog>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'AskChadAI - Chats' })

const chatStore = useChatStore()
const router = useRouter()

const showConfirmDialog = ref(false)
const conversationToDelete = ref<{ id: string; title: string } | null>(null)

const startNewChat = () => {
  navigateTo('/chat/new')
}

const isConversationTyping = (id: string) => {
  const conversation = chatStore.conversations.find(c => c.id === id)
  if (!conversation?.sessionId) return false
  return chatStore.isSessionActive(conversation.sessionId)
}

const confirmDeleteConversation = (id: string, title: string) => {
  conversationToDelete.value = { id, title }
  showConfirmDialog.value = true
}

const deleteConversation = () => {
  if (conversationToDelete.value) {
    chatStore.deleteConversation(conversationToDelete.value.id)
    showConfirmDialog.value = false
    conversationToDelete.value = null
  }
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(() => {
  // Data is already loaded by app.vue on startup
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
