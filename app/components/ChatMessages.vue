<template>
  <div ref="messagesContainer" @scroll="handleScrollEvent"
    class="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin space-y-3 sm:space-y-4 min-h-0">
    <!-- Loading State -->
    <div v-if="chatStore.isLoading" class="flex items-center justify-center min-h-[50vh]">
      <div
        class="p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 text-center">
        <div class="w-20 h-20 flex items-center justify-center bg-gray-400 dark:bg-gray-600 rounded-lg mx-auto mb-6">
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
        class="p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 text-center">
        <div
          class="w-20 h-20 flex items-center justify-center bg-primary-600 dark:bg-primary-500 rounded-lg mx-auto mb-6">
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
          <ModelSelectionDialog v-model="selectedModel" :models="props.availableModels"
            :disabled="chatStore.isTyping" />
        </div>

        <!-- Start Chat Button -->
        <button @click="startNewConversation" :disabled="!selectedModel"
          class="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm font-semibold">
          <Icon name="heroicons:chat-bubble-left-right" class="h-5 w-5" />
          <span>Chat starten</span>
        </button>
      </div>
    </div>

    <!-- Ready for Chat - only shown when conversation exists but no messages -->
    <div v-else-if="chatStore.currentMessages.length === 0" class="flex items-center justify-center min-h-[50vh]">
      <div
        class="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg mx-4 max-w-md w-full border border-gray-200 dark:border-gray-700 text-center">
        <div
          class="w-16 h-16 flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 rounded-lg mx-auto mb-4">
          <Icon name="heroicons:sparkles" class="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Bereit für den Chat</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Stelle eine Frage oder beginne eine Unterhaltung!
        </p>
      </div>
    </div>

    <!-- Chat Messages -->
    <ChatMessage v-for="(message, idx) in chatStore.currentMessages" :key="message.id"
      :message="typeof message.content === 'string' ? message.content : (Array.isArray(message.content) ? (message.content.find(c => c.type === 'text')?.text || '') : '')"
      :is-user="message.role === 'user'" :is-ai="message.role === 'assistant'"
      :is-streaming="chatStore.isConversationTyping && idx === chatStore.currentMessages.length - 1 && message.role === 'assistant'"
      :is-typing="chatStore.isConversationTyping && idx === chatStore.currentMessages.length - 1 && message.role === 'assistant'"
      :timestamp="message.timestamp"
      :images="Array.isArray(message.content) ? message.content.filter(c => c.type === 'image_url').map(c => ({ url: c.image_url?.url || '', name: undefined })) : []" />
  </div>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'

// Define props
interface Props {
  availableModels: AIModel[]
}

const props = defineProps<Props>()

const chatStore = useChatStore()
const { handleScroll, scrollToBottom } = useScrolling()
const { startNewConversation: createConversation } = useChat()

const messagesContainer = ref<HTMLElement>()
const selectedModel = ref('')

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