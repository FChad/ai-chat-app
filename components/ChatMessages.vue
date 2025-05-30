<template>
  <div 
    ref="messagesContainer"
    @scroll="handleScrollEvent"
    class="flex-1 p-3 sm:p-6 overflow-y-auto scrollbar-thin space-y-1 sm:space-y-2 min-h-0"
  >
    <div v-if="!chatStore.currentConversation" class="text-center text-gray-400 mt-10 sm:mt-20">
      <Icon name="heroicons:chat-bubble-left-right" class="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
      <p class="text-sm sm:text-base">Wähle ein Modell und starte eine neue Unterhaltung!</p>
    </div>
    
    <div v-else-if="chatStore.currentMessages.length === 0" class="text-center text-gray-400 mt-10 sm:mt-20">
      <Icon name="heroicons:chat-bubble-left-right" class="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
      <p class="text-sm sm:text-base">Starte eine Unterhaltung!</p>
    </div>
    
    <ChatMessage
      v-for="message in chatStore.currentMessages"
      :key="message.id"
      :message="message.content"
      :is-user="message.role === 'user'"
      :is-ai="message.role === 'assistant'"
      :timestamp="message.timestamp"
    />
    
    <!-- Typing indicator -->
    <ChatMessage
      v-if="chatStore.isTyping"
      message=""
      :is-user="false"
      :is-typing="true"
      timestamp=""
    />
  </div>
</template>

<script setup lang="ts">
const chatStore = useChatStore()
const { handleScroll, autoScrollIfAtBottom } = useScrolling()

const messagesContainer = ref<HTMLElement>()

const handleScrollEvent = () => {
  if (messagesContainer.value) {
    handleScroll(messagesContainer.value)
  }
}

// Auto-scroll when new messages are added
watch(() => chatStore.currentMessages, () => {
  autoScrollIfAtBottom(messagesContainer.value)
}, { deep: true })

// Auto-scroll when typing state changes
watch(() => chatStore.isTyping, () => {
  autoScrollIfAtBottom(messagesContainer.value)
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