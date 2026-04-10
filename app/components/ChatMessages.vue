<template>
  <ScrollArea ref="scrollAreaRef" class="flex-1 min-h-0">
    <div ref="messagesContainer" @scroll="handleScrollEvent"
      class="flex-1 p-4 overflow-y-auto min-h-0">
      <!-- Loading State -->
      <div v-if="chatStore.isLoading" class="flex items-center justify-center min-h-[50vh]">
        <Card class="max-w-md w-full mx-4 text-center">
          <CardContent class="p-8">
            <div class="w-20 h-20 flex items-center justify-center bg-muted rounded-lg mx-auto mb-6">
              <Icon name="heroicons:arrow-path" class="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground animate-spin" />
            </div>
            <h3 class="text-lg sm:text-xl font-semibold mb-2">Loading Data...</h3>
            <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Loading conversations
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Welcome Modal -->
      <div v-else-if="!chatStore.currentConversation" class="flex items-center justify-center min-h-[50vh]">
        <Card class="max-w-md w-full mx-4 text-center">
          <CardContent class="p-8">
            <div
              class="w-20 h-20 flex items-center justify-center bg-primary text-primary-foreground rounded-lg mx-auto mb-6">
              <Icon name="heroicons:chat-bubble-left-right" class="h-12 w-12 sm:h-16 sm:w-16" />
            </div>
            <h3 class="text-lg sm:text-xl font-semibold mb-2">Welcome to AskChadAI</h3>
            <p class="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
              Select an AI model and start an intelligent conversation!
            </p>

            <!-- Model Selection -->
            <div class="text-left mb-6">
              <label class="block text-sm font-semibold mb-3">
                Select AI Model
              </label>
              <ModelSelectionDialog v-model="selectedModel" :models="props.availableModels"
                :disabled="chatStore.isTyping" />
            </div>

            <!-- Start Chat Button -->
            <Button @click="startNewConversation" :disabled="!selectedModel" class="w-full">
              <Icon name="heroicons:chat-bubble-left-right" class="h-5 w-5 mr-2" />
              Start Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Ready for Chat -->
      <div v-else-if="chatStore.currentMessages.length === 0" class="flex items-center justify-center min-h-[50vh]">
        <Card class="mx-4 max-w-md w-full text-center">
          <CardContent class="p-8">
            <div class="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-lg mx-auto mb-4">
              <Icon name="heroicons:sparkles" class="h-8 w-8 text-primary" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Ready to Chat</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              Ask a question or start a conversation!
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Chat Messages -->
      <template v-else v-for="(message, idx) in chatStore.currentMessages" :key="message.id">
        <!-- Date separator between different days -->
        <div v-if="showDateSeparator(idx)" class="flex px-2 items-center gap-2 my-3">
          <Separator class="flex-1" />
          <time class="text-xs text-muted-foreground font-medium min-w-max px-1">
            {{ getMessageDate(message.timestamp) }}
          </time>
          <Separator class="flex-1" />
        </div>
        <ChatMessage
          :message="typeof message.content === 'string' ? message.content : (Array.isArray(message.content) ? (message.content.find(c => c.type === 'text')?.text || '') : '')"
          :is-user="message.role === 'user'" :is-ai="message.role === 'assistant'"
          :is-streaming="chatStore.isConversationTyping && idx === chatStore.currentMessages.length - 1 && message.role === 'assistant'"
          :is-typing="chatStore.isConversationTyping && idx === chatStore.currentMessages.length - 1 && message.role === 'assistant'"
          :is-grouped="isMessageGrouped(idx)"
          :timestamp="message.timestamp"
          :images="Array.isArray(message.content) ? message.content.filter(c => c.type === 'image_url').map(c => ({ url: c.image_url?.url || '', name: undefined })) : []" />
      </template>
    </div>
  </ScrollArea>
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

// Grouping logic: a message is grouped if same role as previous AND same calendar day
const isMessageGrouped = (index: number): boolean => {
  if (index === 0) return false
  const curr = chatStore.currentMessages[index]
  const prev = chatStore.currentMessages[index - 1]
  if (curr.role !== prev.role) return false
  return new Date(curr.timestamp).toDateString() === new Date(prev.timestamp).toDateString()
}

// Date separator: show when the day changes between consecutive messages
const showDateSeparator = (index: number): boolean => {
  if (index === 0) return false
  const curr = new Date(chatStore.currentMessages[index].timestamp)
  const prev = new Date(chatStore.currentMessages[index - 1].timestamp)
  return curr.toDateString() !== prev.toDateString()
}

const getMessageDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

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
