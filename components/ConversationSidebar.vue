<template>
  <div class="mobile-sidebar sm:w-80 lg:w-80 bg-black/30 backdrop-blur-lg border-r border-white/10 flex flex-col h-full fixed lg:relative left-0 top-0 mobile-transition" :class="{ 'open': isMobileOpen }">
    <!-- Mobile Close Button -->
    <div class="lg:hidden flex justify-end p-2 border-b border-white/10">
      <button
        @click="$emit('closeMobile')"
        class="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
      >
        <Icon name="heroicons:x-mark" class="h-5 w-5 text-white" />
      </button>
    </div>

    <!-- Header -->
    <div class="p-3 sm:p-4 border-b border-white/10">
      <button
        @click="startNewConversationHandler"
        class="w-full px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm font-medium touch-manipulation"
      >
        <Icon name="heroicons:plus" class="h-4 w-4" />
        <span>Neue Unterhaltung</span>
      </button>
    </div>

    <!-- Conversations List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin mobile-scroll">
      <div v-if="chatStore.conversations.length === 0" class="text-center text-gray-400 mt-8">
        <Icon name="heroicons:chat-bubble-left-right" class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">Keine Unterhaltungen</p>
      </div>
      
      <div
        v-for="conversation in chatStore.conversations"
        :key="conversation.id"
        @click="selectConversation(conversation.id)"
        class="group relative p-2 sm:p-3 rounded-lg cursor-pointer transition-colors touch-manipulation"
        :class="conversation.id === chatStore.currentConversationId 
          ? 'bg-purple-600/20 border border-purple-500/30' 
          : 'hover:bg-white/5'"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <h3 class="text-sm font-medium text-white truncate flex-1">
                {{ conversation.title }}
              </h3>
            </div>
            
            <div class="flex items-center space-x-2 mt-1">
              <Icon name="heroicons:cpu-chip" class="h-3 w-3 text-blue-400 flex-shrink-0" />
              <span class="text-xs text-gray-400 truncate">{{ conversation.model }}</span>
            </div>
            <div class="flex items-center justify-between mt-1">
              <div class="flex items-center space-x-2">
                <Icon name="heroicons:chat-bubble-left" class="h-3 w-3 text-gray-500 flex-shrink-0" />
                <span class="text-xs text-gray-500">{{ conversation.messages.length }}</span>
              </div>
              
              <!-- Timestamp or Typing Indicator -->
              <div class="flex items-center space-x-1">
                <template v-if="isConversationTyping(conversation)">
                  <!-- AI Typing Indicator replaces timestamp -->
                  <div class="flex space-x-0.5">
                    <div class="typing-dot"></div>
                    <div class="typing-dot" style="animation-delay: 0.2s"></div>
                    <div class="typing-dot" style="animation-delay: 0.4s"></div>
                  </div>
                  <span class="text-xs text-purple-300 font-medium typing-indicator">antwortet</span>
                </template>
                <template v-else>
                  <!-- Normal timestamp -->
                  <p class="text-xs text-gray-500">
                    {{ formatRelativeTime(conversation.updatedAt) }}
                  </p>
                </template>
              </div>
            </div>
          </div>
          
          <!-- Delete Button -->
          <button
            @click.stop="deleteConversation(conversation.id)"
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded transition-all ml-2 flex-shrink-0 touch-manipulation"
            :title="`Unterhaltung '${conversation.title}' löschen`"
            :disabled="isConversationTyping(conversation)"
            :class="{ 'opacity-30 cursor-not-allowed': isConversationTyping(conversation) }"
          >
            <Icon name="heroicons:trash" class="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>

    <!-- Footer with Settings -->
    <div class="p-3 sm:p-4 border-t border-white/10">
      <button
        @click="$emit('openSettings')"
        class="w-full px-3 sm:px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm touch-manipulation"
      >
        <Icon name="heroicons:cog-6-tooth" class="h-4 w-4" />
        <span>Einstellungen</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isMobileOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isMobileOpen: false
})

const chatStore = useChatStore()

defineEmits<{
  openSettings: []
  closeMobile: []
}>()

const selectConversation = (id: string) => {
  chatStore.selectConversation(id)
}

const deleteConversation = (id: string) => {
  if (confirm('Möchtest du diese Unterhaltung wirklich löschen?')) {
    chatStore.deleteConversation(id)
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
  background-color: rgb(196 181 253); /* purple-400 */
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
    transition: transform 0.3s ease-in-out;
    z-index: 50;
  }

  .mobile-sidebar.open {
    transform: translateX(0);
  }
}

.mobile-transition {
  transition: transform 0.3s ease-in-out;
}

.mobile-scroll {
  -webkit-overflow-scrolling: touch;
}

/* Scrollbar Styling */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(107, 114, 128, 0.5) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(107, 114, 128, 0.5);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.7);
}
</style> 