<template>
  <div class="p-3 sm:p-6 border-t border-white/10">
    <!-- Model Selection (only shown when no conversation exists) -->
    <div v-if="!chatStore.currentConversation" class="mb-3 sm:mb-4">
      <label class="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
        Wähle ein KI-Modell für die neue Unterhaltung
      </label>
      <select
        v-model="selectedModel"
        :disabled="chatStore.isTyping"
        class="w-full px-3 sm:px-4 py-2.5 sm:py-2 bg-black/20 backdrop-blur-lg border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer hover:bg-black/30 transition-colors text-sm sm:text-base"
        style="color-scheme: dark;"
      >
        <option value="" disabled class="bg-gray-800 text-white">Modell auswählen...</option>
        <option v-for="model in chatStore.availableModels" :key="model.name" :value="model.name" class="bg-gray-800 text-white">
          {{ model.name }} ({{ model.details.parameter_size }})
        </option>
      </select>
    </div>

    <!-- Current Model Display (shown when conversation exists) -->
    <div v-else class="mb-3 sm:mb-4 p-2 sm:p-2 bg-black/10 rounded-lg border border-white/10">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Icon name="heroicons:cpu-chip" class="h-4 w-4 text-blue-400" />
          <span class="text-xs sm:text-sm text-gray-300">Aktuelles Modell:</span>
          <span class="text-xs sm:text-sm font-medium text-white">{{ chatStore.currentModel }}</span>
        </div>
        <div class="text-xs text-gray-400 hidden sm:block">
          Modell kann nicht während der Unterhaltung gewechselt werden
        </div>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="flex flex-col sm:flex-row items-end space-y-3 sm:space-y-0 sm:space-x-4">
      <div class="flex-1 w-full">
        <textarea
          ref="textareaRef"
          v-model="message"
          placeholder="Schreibe eine Nachricht... (Enter zum Senden, Shift+Enter für neue Zeile)"
          class="w-full px-3 sm:px-4 py-3 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[3rem] sm:min-h-[3rem] max-h-32 overflow-y-auto scrollbar-thin text-sm sm:text-base"
          :disabled="chatStore.isTyping"
          @keydown="handleKeydown"
          rows="1"
        />
      </div>
      <button
        type="submit"
        :disabled="!canSend"
        class="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center space-x-2 flex-shrink-0 self-stretch sm:self-start text-sm sm:text-base font-medium touch-manipulation"
      >
        <Icon name="heroicons:paper-airplane" class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>Senden</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const chatStore = useChatStore()
const { sendMessage } = useChat()

const message = ref('')
const selectedModel = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

const canSend = computed(() => {
  if (chatStore.isTyping || !message.value.trim()) return false
  
  // If no conversation exists, we need a model selected
  if (!chatStore.currentConversation) {
    return selectedModel.value !== ''
  }
  
  return true
})

const handleSubmit = async () => {
  if (!canSend.value) return
  
  const messageToSend = message.value
  message.value = ''
  
  // Reset textarea height
  nextTick(() => {
    autoResize()
  })
  
  // Send message with model if no conversation exists
  if (!chatStore.currentConversation) {
    await sendMessage(messageToSend, selectedModel.value)
  } else {
    await sendMessage(messageToSend)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}

const autoResize = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

// Watch for changes in message to auto-resize
watch(message, () => {
  nextTick(() => {
    autoResize()
  })
})

// Auto-resize on mount
onMounted(() => {
  if (textareaRef.value) {
    autoResize()
  }
})

// Set default model when models are loaded
watch(() => chatStore.availableModels, (models) => {
  if (models.length > 0 && !selectedModel.value) {
    // Try to find gemma3:4b first, otherwise use first available model
    const preferredModel = models.find(model => model.name === 'gemma3:4b')
    selectedModel.value = preferredModel ? preferredModel.name : models[0].name
  }
}, { immediate: true })
</script> 