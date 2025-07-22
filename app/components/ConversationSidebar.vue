<template>
  <div>
    <!-- Main Sidebar -->
    <div 
      v-bind="$attrs"
      class="mobile-sidebar sm:w-80 lg:w-80 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border-r border-gray-200/30 dark:border-gray-700/30 flex flex-col h-full fixed lg:relative left-0 top-0 mobile-transition shadow-xl lg:shadow-none" 
      :class="{ 'open': isMobileOpen }"
    >
      <!-- Mobile Close Button -->
      <div class="lg:hidden flex justify-end p-4 border-b border-gray-200/30 dark:border-gray-700/30">
        <button
          @click="$emit('closeMobile')"
          class="w-10 h-10 flex items-center justify-center hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-xl transition-all duration-200 backdrop-blur-sm"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <!-- Header with New Conversation Button -->
      <div class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-700/30 p-4 sm:px-6 flex items-center">
        <button
          @click="startNewConversationHandler"
          class="w-full h-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl active:scale-[0.98] py-3"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          <span>Neue Unterhaltung</span>
        </button>
      </div>

      <!-- Conversations List -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin mobile-scroll">
        <!-- Loading State -->
        <div v-if="chatStore.isLoading" class="text-center text-gray-500 dark:text-gray-400 mt-12">
          <div class="p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-sm mx-4">
            <div class="w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Icon name="heroicons:arrow-path" class="h-8 w-8 opacity-60 text-gray-400 dark:text-gray-500 animate-spin" />
            </div>
            <p class="text-sm font-medium">Lade Unterhaltungen...</p>
            <p class="text-xs mt-1 opacity-75">Einen Moment bitte</p>
          </div>
        </div>

        <!-- Empty State - only shown when loading is complete and no conversations exist -->
        <div v-else-if="chatStore.conversations.length === 0" class="text-center text-gray-500 dark:text-gray-400 mt-12">
          <div class="p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-sm mx-4">
            <div class="w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Icon name="heroicons:chat-bubble-left-right" class="h-12 w-12 opacity-60 text-gray-400 dark:text-gray-500" />
            </div>
            <p class="text-sm font-medium">Keine Unterhaltungen</p>
            <p class="text-xs mt-1 opacity-75">Starte eine neue Unterhaltung</p>
          </div>
        </div>
        
        <!-- Conversations List - only shown when loading is complete -->
        <div
          v-for="conversation in chatStore.conversations"
          :key="conversation.id"
          @click="selectConversation(conversation.id)"
          class="group relative p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          :class="conversation.id === chatStore.currentConversationId 
            ? 'bg-primary-50/80 dark:bg-primary-900/30 border border-primary-200/50 dark:border-primary-700/50 shadow-md' 
            : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/60 backdrop-blur-sm'"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex-1">
                  {{ conversation.title }}
                </h3>
              </div>
              
              <div class="flex items-center space-x-2 mt-2">
                <div class="w-5 h-5 flex items-center justify-center bg-primary-100/60 dark:bg-primary-900/40 rounded-xl">
                  <Icon name="heroicons:cpu-chip" class="h-3 w-3 text-primary-600 dark:text-primary-400" />
                </div>
                <span class="text-xs text-gray-600 dark:text-gray-400 truncate font-medium">{{ conversation.model.split(':')[0] }}</span>
              </div>
              
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center space-x-2">
                  <Icon name="heroicons:chat-bubble-left" class="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ conversation.messages.length }} Nachrichten</span>
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
                    <span class="text-xs text-primary-600 dark:text-primary-400 font-medium typing-indicator">antwortet</span>
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
            <button
              @click.stop="confirmDeleteConversation(conversation.id, conversation.title)"
              class="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center hover:bg-red-50/80 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 ml-2 flex-shrink-0"
              :title="`Unterhaltung '${conversation.title}' löschen`"
              :disabled="isConversationTyping(conversation)"
              :class="{ 'opacity-30 cursor-not-allowed': isConversationTyping(conversation) }"
            >
              <Icon name="heroicons:trash" class="h-4 w-4 text-red-500 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer with Settings -->
      <div class="p-4 sm:p-6 border-t border-gray-200/30 dark:border-gray-700/30">
        <button
          @click="$emit('openSettings')"
          class="w-full px-4 py-3 bg-gradient-to-r from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-700/80 hover:from-gray-200/90 hover:to-gray-300/90 dark:hover:from-gray-700/90 dark:hover:to-gray-600/90 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium backdrop-blur-sm shadow-lg hover:shadow-xl border border-gray-200/40 dark:border-gray-600/40 active:scale-[0.98] hover:scale-[1.02]"
        >
          <Icon name="heroicons:cog-6-tooth" class="h-4 w-4" />
          <span>Einstellungen</span>
        </button>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div 
      v-if="showConfirmDialog"
      class="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
    >
      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
        <div class="p-6">
          <div class="flex items-center space-x-3 mb-4">
            <div class="p-2 bg-red-100/60 dark:bg-red-900/40 rounded-xl">
              <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Bestätigung</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Unwiderrufliche Aktion</p>
            </div>
          </div>
          
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            Möchtest du die Unterhaltung <strong>"{{ conversationToDelete?.title }}"</strong> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          
          <div class="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              @click="showConfirmDialog = false"
              class="w-full sm:w-auto px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors font-medium"
            >
              Abbrechen
            </button>
            <button
              @click="deleteConversation"
              class="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Löschen
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
    return 'Gerade eben'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `vor ${minutes} Min`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `vor ${hours} Std`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `vor ${days} Tag${days > 1 ? 'en' : ''}`
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
  background-color: rgb(59 130 246); /* primary-500 */
  border-radius: 50%;
  animation: typing 1.5s infinite ease-in-out;
}

@keyframes typing {
  0%, 60%, 100% {
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

/* Modern Scrollbar Styling */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 6px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.6);
}

/* Dark mode scrollbar */
.dark .scrollbar-thin {
  scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.4);
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(75, 85, 99, 0.6);
}
</style> 