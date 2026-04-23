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
        <ConversationCard v-for="conversation in chatStore.conversations" :key="conversation.id"
          :conversation="conversation" @delete="confirmDeleteConversation" />
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

const showConfirmDialog = ref(false)
const conversationToDelete = ref<{ id: string; title: string } | null>(null)

const startNewChat = () => {
  navigateTo('/chat/new')
}

const confirmDeleteConversation = (payload: { id: string; title: string }) => {
  conversationToDelete.value = payload
  showConfirmDialog.value = true
}

const deleteConversation = () => {
  if (conversationToDelete.value) {
    chatStore.deleteConversation(conversationToDelete.value.id)
    showConfirmDialog.value = false
    conversationToDelete.value = null
  }
}

onMounted(() => {
  // Data is already loaded by app.vue on startup
})
</script>
