<template>
  <div class="flex h-full flex-col min-w-0">
    <!-- Chat sub-header: model info -->
    <div class="flex items-center gap-2 border-b border-border px-4 py-2 bg-background shrink-0">
      <div class="ml-auto flex items-center gap-2">
        <UTooltip v-if="chatStore.currentConversation">
          <template #trigger>
            <UButton variant="secondary" size="sm" class="flex items-center gap-2 rounded-full"
              @click="showModelInfo">
              <Icon name="heroicons:cpu-chip" class="h-4 w-4 text-primary" />
              <span class="text-sm font-medium">
                {{ chatStore.currentConversation.model.split(':')[0] }}
              </span>
              <Icon name="heroicons:information-circle" class="h-4 w-4 text-muted-foreground" />
            </UButton>
          </template>
          View model information
        </UTooltip>
      </div>
    </div>

    <!-- Messages + Input -->
    <div class="flex flex-1 flex-col min-h-0">
      <ChatMessages ref="chatMessagesRef" :available-models="availableModels" @focus-input="focusInput" />
      <ChatInput ref="chatInputRef" :current-model="currentModelDetails" />
    </div>
  </div>

  <!-- Model Info Dialog -->
  <ModelInfoDialog :is-open="showModelInfoDialog" :model="currentModelDetails" @close="showModelInfoDialog = false" />
</template>

<script setup lang="ts">
import type { AIModel } from '../../../types/chat'

const route = useRoute()
const chatStore = useChatStore()
const { scrollToBottom } = useScrolling()
const { loadModels } = useChat()

const chatMessagesRef = ref()
const chatInputRef = ref()
const showModelInfoDialog = ref(false)
const availableModels = ref<AIModel[]>([])

useHead({
  title: computed(() => {
    const title = chatStore.currentConversation?.title
    return title ? `AskChadAI - ${title}` : 'AskChadAI - Chat'
  })
})

const loadAvailableModels = async () => {
  availableModels.value = await loadModels()
}

const focusInput = () => {
  if (chatInputRef.value && chatInputRef.value.focusInput) {
    chatInputRef.value.focusInput()
  }
}

const currentModelDetails = computed(() => {
  if (!chatStore.currentConversation) return null
  const modelId = chatStore.currentConversation.model
  return availableModels.value.find((m: AIModel) => m.model === modelId) || null
})

const showModelInfo = () => {
  if (currentModelDetails.value) {
    showModelInfoDialog.value = true
  }
}

// Sync URL param → store selection
const syncConversation = () => {
  const id = route.params.id as string
  if (id === 'new') {
    chatStore.selectConversation('')
  } else {
    const exists = chatStore.conversations.find(c => c.id === id)
    if (exists) {
      chatStore.selectConversation(id)
    } else if (!chatStore.isLoading) {
      navigateTo('/chat')
    }
  }
}

// As soon as localStorage is loaded, sync the conversation so the welcome screen never flashes
watch(() => chatStore.isLoading, (loading) => {
  if (!loading) {
    syncConversation()
  }
})

// After a new conversation is created on /chat/new, navigate to its URL
watch(() => chatStore.currentConversationId, (newId) => {
  if (newId && route.params.id === 'new') {
    navigateTo(`/chat/${newId}`, { replace: true })
  }
})

// Redirect if conversation is deleted while viewing it
watch(() => chatStore.conversations, (conversations) => {
  const id = route.params.id as string
  if (id !== 'new' && !conversations.find(c => c.id === id)) {
    navigateTo('/chat')
  }
}, { deep: true })

watch([() => chatStore.currentMessages, () => chatStore.isTyping], () => {
  if (chatStore.isAtBottom && chatMessagesRef.value?.messagesContainer) {
    scrollToBottom(chatMessagesRef.value.messagesContainer)
  }
}, { deep: true })

onMounted(async () => {
  // Sync immediately if store is already loaded (e.g. navigating from within the app)
  if (!chatStore.isLoading) {
    syncConversation()
  }
  try {
    await loadAvailableModels()
    chatStore.setLoadingComplete()
    syncConversation()
  } catch (error) {
    console.error('Error during initialization:', error)
    chatStore.setLoadingComplete()
  }
})
</script>
