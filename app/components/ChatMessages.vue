<template>
  <div ref="messagesContainer" @scroll="handleScrollEvent"
    class="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin space-y-3 sm:space-y-4 min-h-0">
    <!-- Loading State -->
    <div v-if="chatStore.isLoading" class="flex items-center justify-center min-h-[50vh]">
      <div
        class="p-8 bg-white/40 dark:bg-gray-800/40 rounded-3xl backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 max-w-md w-full mx-4 text-center text-gray-500 dark:text-gray-400">
        <div class="w-20 h-20 flex items-center justify-center bg-gray-500 dark:bg-gray-400 rounded-2xl mx-auto mb-6">
          <Icon name="heroicons:arrow-path" class="h-12 w-12 sm:h-16 sm:w-16 text-white animate-spin" />
        </div>
        <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Lade Daten...</h3>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Unterhaltungen werden geladen
        </p>
      </div>
    </div>

    <!-- Welcome Modal - only shown when loading is complete and no conversation exists -->
    <div v-else-if="!chatStore.currentConversation" class="flex items-center justify-center min-h-[50vh]">
      <div
        class="p-8 bg-white/40 dark:bg-gray-800/40 rounded-3xl backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 max-w-md w-full mx-4 text-center text-gray-500 dark:text-gray-400">
        <div
          class="w-20 h-20 flex items-center justify-center bg-primary-600 dark:bg-primary-500 rounded-2xl mx-auto mb-6">
          <Icon name="heroicons:chat-bubble-left-right" class="h-12 w-12 sm:h-16 sm:w-16 text-white" />
        </div>
        <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Willkommen bei AskChadAI</h3>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          Wähle ein KI-Modell aus und starte eine intelligente Unterhaltung!
        </p>

        <!-- Model Selection -->
        <div class="text-left mb-6">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            KI-Modell auswählen
          </label>
          <ModelSelectionDialog v-model="selectedModel" :models="availableModels" :disabled="chatStore.isTyping" />
        </div>

        <!-- Start Chat Button -->
        <button @click="startNewConversation" :disabled="!selectedModel"
          class="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-semibold shadow-lg hover:shadow-xl disabled:shadow-sm active:scale-[0.98]">
          <Icon name="heroicons:chat-bubble-left-right" class="h-5 w-5" />
          <span>Chat starten</span>
        </button>
      </div>
    </div>

    <!-- Ready for Chat - only shown when conversation exists but no messages -->
    <div v-else-if="chatStore.currentMessages.length === 0"
      class="text-center text-gray-500 dark:text-gray-400 mt-16 sm:mt-32">
      <div
        class="p-8 bg-white/40 dark:bg-gray-800/40 rounded-3xl backdrop-blur-sm mx-4 sm:mx-8 border border-gray-200/30 dark:border-gray-700/30">
        <div
          class="w-20 h-20 flex items-center justify-center bg-primary-600 dark:bg-primary-500 rounded-2xl mx-auto mb-6">
          <Icon name="heroicons:sparkles" class="h-12 w-12 sm:h-16 sm:w-16 text-white" />
        </div>
        <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Bereit für den Chat</h3>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Stelle eine Frage oder beginne eine Unterhaltung!
        </p>
      </div>
    </div>

    <!-- Chat Messages -->
    <ChatMessage v-for="(message, idx) in chatStore.currentMessages" :key="message.id" :message="message.content"
      :is-user="message.role === 'user'" :is-ai="message.role === 'assistant'"
      :is-streaming="chatStore.isConversationTyping && idx === chatStore.currentMessages.length - 1 && message.role === 'assistant'"
      :is-typing="chatStore.isConversationTyping && idx === chatStore.currentMessages.length - 1 && message.role === 'assistant'"
      :timestamp="message.timestamp" />
  </div>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'

const chatStore = useChatStore()
const { handleScroll, scrollToBottom } = useScrolling()
const { startNewConversation: createConversation, loadModels } = useChat()

const messagesContainer = ref<HTMLElement>()
const selectedModel = ref('')
const availableModels = ref<AIModel[]>([])

// Load models when component mounts or when conversation changes to null
const loadAvailableModels = async () => {
  availableModels.value = await loadModels()
}

// Watch for when there's no current conversation to load models
watch(() => chatStore.currentConversation, (conversation) => {
  if (!conversation) {
    loadAvailableModels()
  }
}, { immediate: true })

const handleScrollEvent = () => {
  if (messagesContainer.value) {
    handleScroll(messagesContainer.value)
  }
}

const emit = defineEmits<{
  focusInput: []
}>()

const startNewConversation = () => {
  if (selectedModel.value) {
    // Create a new conversation with the selected model using the useChat composable
    createConversation(selectedModel.value)

    // Emit event to focus the input field
    nextTick(() => {
      emit('focusInput')
    })
  }
}

// Auto-scroll when new messages are added
watch(() => chatStore.currentMessages, () => {
  if (chatStore.isAtBottom && messagesContainer.value) {
    scrollToBottom(messagesContainer.value)
  }
}, { deep: true })

// Auto-scroll when typing state changes (session-based)
watch(() => chatStore.isConversationTyping, () => {
  if (chatStore.isAtBottom && messagesContainer.value) {
    scrollToBottom(messagesContainer.value)
  }
})

// Auto-scroll when conversation changes
watch(() => chatStore.currentConversationId, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      chatStore.setIsAtBottom(true)
    }
  })
})

// Expose the container ref for parent components
defineExpose({
  messagesContainer
})
</script>

<style scoped>
/* Modern Scrollbar */
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