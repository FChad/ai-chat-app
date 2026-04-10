<template>
  <div class="flex h-full overflow-hidden">
    <!-- Conversations Panel (desktop) -->
    <div class="hidden lg:flex w-72 flex-col border-r border-border bg-background shrink-0">
      <ConversationSidebar />
    </div>

    <!-- Mobile conversations drawer -->
    <Sheet :open="isMobileConversationsOpen" @update:open="isMobileConversationsOpen = $event">
      <SheetContent side="left" class="w-72 p-0 flex flex-col">
        <ConversationSidebar />
      </SheetContent>
    </Sheet>

    <!-- Main Chat Area -->
    <div class="flex flex-1 flex-col min-w-0">
      <!-- Chat sub-header: mobile conversations toggle + model info -->
      <div class="flex items-center gap-2 border-b border-border px-4 py-2 bg-background">
        <Button variant="ghost" size="icon" class="lg:hidden h-8 w-8" @click="isMobileConversationsOpen = true">
          <Icon name="heroicons:bars-3" class="h-5 w-5" />
        </Button>
        <div class="ml-auto flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button v-if="chatStore.currentConversation" variant="secondary" size="sm"
                  class="flex items-center gap-2 rounded-full" @click="showModelInfo">
                  <Icon name="heroicons:cpu-chip" class="h-4 w-4 text-primary" />
                  <span class="text-sm font-medium">
                    {{ chatStore.currentConversation.model.split(':')[0] }}
                  </span>
                  <Icon name="heroicons:information-circle" class="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View model information</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
  </div>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'
import { Sheet, SheetContent } from '@/components/ui/sheet'

useHead({ title: 'AskChadAI - Chat' })

const chatStore = useChatStore()
const { scrollToBottom } = useScrolling()
const { loadModels } = useChat()

const chatMessagesRef = ref()
const chatInputRef = ref()
const showModelInfoDialog = ref(false)
const isMobileConversationsOpen = ref(false)
const availableModels = ref<AIModel[]>([])

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

// Close mobile conversations panel when switching conversations
watch(() => chatStore.currentConversationId, () => {
  isMobileConversationsOpen.value = false
})

onMounted(async () => {
  try {
    await loadAvailableModels()
    chatStore.setLoadingComplete()
  } catch (error) {
    console.error('Error during initialization:', error)
    chatStore.setLoadingComplete()
  }
})

watch([() => chatStore.currentMessages, () => chatStore.isTyping], () => {
  if (chatStore.isAtBottom && chatMessagesRef.value?.messagesContainer) {
    scrollToBottom(chatMessagesRef.value.messagesContainer)
  }
}, { deep: true })
</script>
