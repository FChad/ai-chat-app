<template>
  <div>
    <!-- Main Sidebar -->
    <div v-bind="$attrs"
      class="mobile-sidebar sm:w-80 lg:w-80 bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border flex flex-col h-full fixed lg:relative left-0 top-0 transition-transform duration-300 lg:shadow-none"
      :class="{ 'open': isMobileOpen }">
      <!-- Mobile Close Button -->
      <div class="lg:hidden flex justify-end p-4 border-b border-sidebar-border">
        <Button variant="ghost" size="icon" @click="$emit('closeMobile')">
          <Icon name="heroicons:x-mark" class="h-5 w-5" />
        </Button>
      </div>

      <!-- Header with New Conversation Button -->
      <div class="border-b border-sidebar-border p-4 sm:px-6 flex items-center">
        <Button @click="startNewConversationHandler" class="w-full">
          <Icon name="heroicons:plus" class="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <!-- Conversations List -->
      <ScrollArea class="flex-1 p-3">
        <div class="space-y-2">
          <!-- Loading State -->
          <div v-if="chatStore.isLoading" class="text-center text-muted-foreground mt-12">
            <Card class="mx-4">
              <CardContent class="p-4 text-center">
                <div class="w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Icon name="heroicons:arrow-path" class="h-8 w-8 opacity-60 text-muted-foreground animate-spin" />
                </div>
                <p class="text-sm font-medium">Loading conversations...</p>
                <p class="text-xs mt-1 text-muted-foreground">One moment please</p>
              </CardContent>
            </Card>
          </div>

          <!-- Empty State -->
          <div v-else-if="chatStore.conversations.length === 0" class="text-center text-muted-foreground mt-12">
            <Card class="mx-4">
              <CardContent class="p-4 text-center">
                <div class="w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Icon name="heroicons:chat-bubble-left-right" class="h-12 w-12 opacity-60 text-muted-foreground" />
                </div>
                <p class="text-sm font-medium">No conversations</p>
                <p class="text-xs mt-1 text-muted-foreground">Start a new conversation</p>
              </CardContent>
            </Card>
          </div>

          <!-- Conversations List -->
          <Card v-for="conversation in chatStore.conversations" :key="conversation.id"
            @click="selectConversation(conversation.id)" class="group cursor-pointer transition-colors duration-200"
            :class="conversation.id === chatStore.currentConversationId
              ? 'border-primary bg-primary/5'
              : 'hover:bg-accent'">
            <CardContent class="p-3 sm:p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <h3 class="text-sm font-semibold truncate flex-1">
                      {{ conversation.title }}
                    </h3>
                  </div>

                  <div class="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" class="text-xs">
                      <Icon name="heroicons:cpu-chip" class="h-3 w-3 mr-1" />
                      {{ conversation.model.split(':')[0] }}
                    </Badge>
                  </div>

                  <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center space-x-2 text-muted-foreground">
                      <Icon name="heroicons:chat-bubble-left" class="h-3 w-3" />
                      <span class="text-xs font-medium">{{ conversation.messages.length }} Messages</span>
                    </div>

                    <div class="flex items-center space-x-1">
                      <template v-if="isConversationTyping(conversation)">
                        <div class="flex space-x-0.5">
                          <div class="typing-dot"></div>
                          <div class="typing-dot" style="animation-delay: 0.2s"></div>
                          <div class="typing-dot" style="animation-delay: 0.4s"></div>
                        </div>
                        <span class="text-xs text-primary font-medium typing-indicator">responding</span>
                      </template>
                      <template v-else>
                        <p class="text-xs text-muted-foreground font-medium">
                          {{ formatRelativeTime(conversation.updatedAt) }}
                        </p>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- Delete Button -->
                <Button variant="ghost" size="icon"
                  class="opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  @click.stop="confirmDeleteConversation(conversation.id, conversation.title)"
                  :title="`Delete conversation '${conversation.title}'`" :disabled="isConversationTyping(conversation)">
                  <Icon name="heroicons:trash" class="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <!-- Footer with Settings -->
      <div class="p-4 sm:p-6 border-t border-sidebar-border">
        <Button variant="outline" class="w-full" @click="$emit('openSettings')">
          <Icon name="heroicons:cog-6-tooth" class="h-5 w-5 mr-2" />
          Settings
        </Button>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <Dialog :open="showConfirmDialog" @update:open="showConfirmDialog = $event">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 flex items-center justify-center bg-destructive/10 rounded-lg flex-shrink-0">
              <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Confirmation</DialogTitle>
              <DialogDescription>Irreversible action</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p class="text-sm text-muted-foreground leading-relaxed">
          Do you really want to delete the conversation <strong class="text-foreground">"{{ conversationToDelete?.title
            }}"</strong>? This action cannot be undone.
        </p>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="outline" @click="showConfirmDialog = false">Cancel</Button>
          <Button variant="destructive" @click="deleteConversation">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isMobileOpen?: boolean
}

defineOptions({
  inheritAttrs: false
})

const props = withDefaults(defineProps<Props>(), {
  isMobileOpen: false
})

const chatStore = useChatStore()

defineEmits<{
  openSettings: []
  closeMobile: []
}>()

const showConfirmDialog = ref(false)
const conversationToDelete = ref<{ id: string; title: string } | null>(null)

const selectConversation = (id: string) => {
  chatStore.selectConversation(id)
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

const startNewConversationHandler = () => {
  // Clear current conversation to show model selection
  chatStore.selectConversation('')
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} min ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hr ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

const isConversationTyping = (conversation: any): boolean => {
  // Check if this conversation has an active session (AI is responding)
  return conversation.sessionId && chatStore.isSessionActive(conversation.sessionId)
}
</script>

<style scoped>
.typing-dot {
  width: 4px;
  height: 4px;
  background-color: rgb(90 115 150);
  /* primary-500 */
  border-radius: 50%;
  animation: typing 1.5s infinite ease-in-out;
}

@keyframes typing {

  0%,
  60%,
  100% {
    transform: scale(0.8);
    opacity: 0.6;
  }

  30% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.typing-indicator {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Mobile Sidebar Transitions */
@media (max-width: 1024px) {
  .mobile-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 50;
  }

  .mobile-sidebar.open {
    transform: translateX(0);
  }
}

.mobile-transition {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-scroll {
  -webkit-overflow-scrolling: touch;
}
</style>