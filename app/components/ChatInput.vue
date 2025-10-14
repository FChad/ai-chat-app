<template>
  <div
    class="p-4 sm:p-6 border-t border-gray-200/30 dark:border-gray-700/30 bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl">
    <!-- Only show input form when there's a conversation -->
    <form v-if="chatStore.currentConversation" @submit.prevent="handleSubmit"
      class="flex flex-col sm:flex-row items-end space-y-3 sm:space-y-0 sm:space-x-4">
      <div class="flex-1 w-full relative">
        <textarea ref="textareaRef" v-model="message"
          placeholder="Schreibe eine Nachricht... (Enter zum Senden, Shift+Enter für neue Zeile)"
          class="w-full px-3 py-3 bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200/60 dark:border-gray-700/60 focus:border-primary-500 dark:focus:border-primary-400 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-gray-800 resize-none min-h-[46px] max-h-32 overflow-y-auto scrollbar-thin text-sm leading-5 font-medium backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-xl transition-all duration-200 mobile-placeholder"
          :disabled="chatStore.isTyping || isCurrentConversationTyping" @keydown="handleKeydown" rows="1" />


      </div>

      <!-- Cancel button when conversation is typing -->
      <button v-if="isCurrentConversationTyping" @click="handleCancel" type="button"
        class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 flex-shrink-0 self-stretch sm:self-start text-sm font-semibold shadow-lg hover:shadow-xl active:scale-[0.98]">
        <Icon name="heroicons:x-mark" class="h-4 w-4" />
        <span>Abbrechen</span>
      </button>

      <!-- Send button -->
      <button v-else type="submit" :disabled="!canSend"
        class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 flex-shrink-0 self-stretch sm:self-start text-sm font-semibold shadow-lg hover:shadow-xl disabled:shadow-sm active:scale-[0.98]">
        <Icon name="heroicons:paper-airplane" class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>Senden</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const chatStore = useChatStore()
const { sendMessage, cancelMessage } = useChat()

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

const isCurrentConversationTyping = computed(() => chatStore.isConversationTyping)

const canSend = computed(() => {
  if (chatStore.isTyping || isCurrentConversationTyping.value || !message.value.trim()) return false
  return chatStore.currentConversation !== null
})

const handleSubmit = async () => {
  if (!canSend.value) return

  const messageToSend = message.value
  message.value = ''

  // Reset textarea height
  nextTick(() => {
    autoResize()
  })

  await sendMessage(messageToSend)
}

const handleCancel = () => {
  if (chatStore.currentConversation) {
    cancelMessage(chatStore.currentConversation.id)
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

// Auto-resize on mount and focus management
onMounted(() => {
  if (textareaRef.value) {
    autoResize()

    // Focus the textarea when component mounts
    const focusTextarea = () => {
      if (textareaRef.value && chatStore.currentConversation && !chatStore.isLoading) {
        textareaRef.value.focus()
      }
    }

    // Immediate focus if conditions are met
    setTimeout(focusTextarea, 100)

    // Also try again after a bit longer delay to handle slow loading
    setTimeout(focusTextarea, 500)
  }
})

// Focus textarea when conversation changes
watch(() => chatStore.currentConversation, (newConversation) => {
  if (newConversation && textareaRef.value) {
    // Add a small delay to ensure the component is fully rendered
    setTimeout(() => {
      textareaRef.value?.focus()
    }, 100)
  }
})

// Focus textarea when chat loading is complete
watch(() => chatStore.isLoading, (isLoading) => {
  if (!isLoading && textareaRef.value && chatStore.currentConversation) {
    // Chat has finished loading and there's an active conversation
    setTimeout(() => {
      textareaRef.value?.focus()
    }, 200)
  }
})

// Focus textarea when AI finishes typing
watch(() => isCurrentConversationTyping.value, (isTyping, wasTyping) => {
  if (wasTyping && !isTyping && textareaRef.value && chatStore.currentConversation) {
    // AI has finished typing, refocus the input field
    setTimeout(() => {
      textareaRef.value?.focus()
    }, 100)
  }
})

// focus state UI removed; keep logic minimal

// Method to focus the textarea from external components
const focusInput = () => {
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

// Expose the focus method for parent components
defineExpose({
  focusInput
})
</script>

<style scoped>
/* Modern Scrollbar for textarea */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 4px;
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

/* Mobile placeholder text optimization */
.mobile-placeholder::placeholder {
  font-size: inherit;
  line-height: inherit;
  opacity: 0.7;
}

/* Responsive placeholder text */
@media (min-width: 640px) {
  .mobile-placeholder::placeholder {
    font-size: inherit;
    line-height: inherit;
    opacity: 0.6;
  }
}

/* Extra small screens - even smaller placeholder */
@media (max-width: 375px) {
  .mobile-placeholder::placeholder {
    font-size: inherit;
    line-height: inherit;
  }
}

/* Ensure placeholder text wraps nicely on mobile */
@media (max-width: 640px) {
  .mobile-placeholder {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
}
</style>