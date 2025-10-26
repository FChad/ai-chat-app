<template>
  <div>
    <!-- Main Sidebar -->
    <div v-bind="$attrs"
      class="mobile-sidebar sm:w-80 lg:w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full fixed lg:relative left-0 top-0 transition-transform duration-300 lg:shadow-none"
      :class="{ 'open': isMobileOpen }">
      <!-- Mobile Close Button -->
      <div class="lg:hidden flex justify-end p-4 border-b border-gray-200 dark:border-gray-700">
        <button @click="$emit('closeMobile')"
          class="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
          <Icon name="heroicons:x-mark" class="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <!-- Header with New Conversation Button -->
      <div
        class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 sm:px-6 flex items-center">
        <button @click="startNewConversationHandler"
          class="w-full h-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium py-3">
          <Icon name="heroicons:plus" class="h-4 w-4" />
          <span>New Conversation</span>
        </button>
      </div>

      <!-- Conversations List -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin mobile-scroll">
        <!-- Loading State -->
        <div v-if="chatStore.isLoading" class="text-center text-gray-500 dark:text-gray-400 mt-12">
          <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mx-4">
            <div class="w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Icon name="heroicons:arrow-path"
                class="h-8 w-8 opacity-60 text-gray-400 dark:text-gray-500 animate-spin" />
            </div>
            <p class="text-sm font-medium">Loading conversations...</p>
            <p class="text-xs mt-1 opacity-75">One moment please</p>
          </div>
        </div>

        <!-- Empty State - only shown when loading is complete and no conversations exist -->
        <div v-else-if="chatStore.conversations.length === 0"
          class="text-center text-gray-500 dark:text-gray-400 mt-12">
          <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mx-4">
            <div class="w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Icon name="heroicons:chat-bubble-left-right"
                class="h-12 w-12 opacity-60 text-gray-400 dark:text-gray-500" />
            </div>
            <p class="text-sm font-medium">No conversations</p>
            <p class="text-xs mt-1 opacity-75">Start a new conversation</p>
          </div>
        </div>

        <!-- Conversations List - only shown when loading is complete -->
        <div v-for="conversation in chatStore.conversations" :key="conversation.id"
          @click="selectConversation(conversation.id)"
          class="group relative p-3 sm:p-4 rounded-lg cursor-pointer transition-colors duration-200 border"
          :class="conversation.id === chatStore.currentConversationId
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex-1">
                  {{ conversation.title }}
                </h3>
              </div>

              <div class="flex items-center space-x-2 mt-2">
                <div class="w-5 h-5 flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                  <Icon name="heroicons:cpu-chip" class="h-3 w-3 text-primary-600 dark:text-primary-400" />
                </div>
                <span class="text-xs text-gray-600 dark:text-gray-400 truncate font-medium">{{
                  conversation.model.split(':')[0] }}</span>
              </div>

              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center space-x-2">
                  <Icon name="heroicons:chat-bubble-left" class="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ conversation.messages.length }}
                    Messages</span>
                </div>

                <!-- Timestamp or Typing Indicator -->
                <div class="flex items-center space-x-1">
                  <template v-if="isConversationTyping(conversation)">
                    <!-- AI Typing Indicator -->
                    <div class="flex space-x-0.5">
                      <div class="typing-dot"></div>
                      <div class="typing-dot" style="animation-delay: 0.2s"></div>
                      <div class="typing-dot" style="animation-delay: 0.4s"></div>
                    </div>
                    <span
                      class="text-xs text-primary-600 dark:text-primary-400 font-medium typing-indicator">responding</span>
                  </template>
                  <template v-else>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {{ formatRelativeTime(conversation.updatedAt) }}
                    </p>
                  </template>
                </div>
              </div>
            </div>

            <!-- Delete Button -->
            <button @click.stop="confirmDeleteConversation(conversation.id, conversation.title)"
              class="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 ml-2 flex-shrink-0"
              :title="`Delete conversation '${conversation.title}'`" :disabled="isConversationTyping(conversation)"
              :class="{ 'opacity-30 cursor-not-allowed': isConversationTyping(conversation) }">
              <Icon name="heroicons:trash" class="h-4 w-4 text-red-500 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer with Settings -->
      <div class="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
        <button @click="$emit('openSettings')"
          class="w-full px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm font-medium border border-gray-200 dark:border-gray-700">
          <Icon name="heroicons:cog-6-tooth" class="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog"
      class="fixed inset-0 bg-black/30 dark:bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg w-full max-w-sm">
        <div class="p-6">
          <div class="flex items-center space-x-3 mb-4">
            <div
              class="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/40 rounded-lg flex-shrink-0">
              <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirmation</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Irreversible action</p>
            </div>
          </div>

          <p class="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            Do you really want to delete the conversation <strong>"{{ conversationToDelete?.title }}"</strong>? This
            action
            cannot be undone.
          </p>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button @click="deleteConversation"
              class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium">
              Delete
            </button>
            <button @click="showConfirmDialog = false"
              class="px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 font-medium border border-gray-200 dark:border-gray-700">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
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