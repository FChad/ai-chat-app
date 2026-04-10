<template>
  <div class="flex h-full relative font-sans">
    <!-- Mobile Overlay -->
    <div v-if="isMobileSidebarOpen" @click="closeMobileSidebar"
      class="fixed inset-0 bg-black/40 z-40 lg:hidden transition-all duration-200">
    </div>

    <!-- Sidebar -->
    <ConversationSidebar :class="[
      'transition-all duration-300 ease-out z-50',
      'lg:relative lg:translate-x-0',
      isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]" :is-mobile-open="isMobileSidebarOpen" @open-settings="showSettingsDialog = true"
      @close-mobile="closeMobileSidebar" />

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col min-w-0 bg-card border-l border-border">
      <!-- Header -->
      <div class="bg-card border-b border-border p-4 sm:px-6 flex items-center">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-3 sm:space-x-4">
            <!-- Mobile Menu Button -->
            <Button variant="ghost" size="icon" class="lg:hidden" @click="toggleMobileSidebar">
              <Icon name="heroicons:bars-3" class="h-5 w-5" />
            </Button>

            <!-- App Icon & Title -->
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-lg">
                <Icon name="heroicons:chat-bubble-left-right" class="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 class="text-lg sm:text-xl font-semibold">AskChadAI</h1>
                <p class="text-xs text-muted-foreground hidden sm:block">Intelligent Assistant</p>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <!-- Current Model Info -->
            <Button v-if="chatStore.currentConversation" variant="secondary" size="sm"
              class="hidden sm:flex items-center space-x-2 rounded-full" @click="showModelInfo">
              <Icon name="heroicons:cpu-chip" class="h-4 w-4 text-primary" />
              <span class="text-sm font-medium">
                {{ chatStore.currentConversation.model.split(':')[0] }}
              </span>
              <Icon name="heroicons:information-circle" class="h-4 w-4 text-muted-foreground" />
            </Button>

            <!-- Theme Toggle -->
            <ThemeToggle />
          </div>
        </div>
      </div>

      <!-- Chat container -->
      <div class="flex-1 flex flex-col min-h-0 bg-transparent">
        <!-- Messages -->
        <ChatMessages ref="chatMessagesRef" :available-models="availableModels" @focus-input="focusInput" />

        <!-- Input area -->
        <ChatInput ref="chatInputRef" :current-model="currentModelDetails" />
      </div>
    </div>

    <!-- Settings Dialog -->
    <SettingsDialog :is-open="showSettingsDialog" @close="showSettingsDialog = false" />

    <!-- Model Info Dialog -->
    <ModelInfoDialog :is-open="showModelInfoDialog" :model="currentModelDetails" @close="showModelInfoDialog = false" />
  </div>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'

// Set page title
useHead({
  title: 'AskChadAI - Intelligent Chat Assistant'
})

const chatStore = useChatStore()
const { scrollToBottom } = useScrolling()
const { loadModels } = useChat()

const chatMessagesRef = ref()
const chatInputRef = ref()
const showSettingsDialog = ref(false)
const showModelInfoDialog = ref(false)
const isMobileSidebarOpen = ref(false)
const availableModels = ref<AIModel[]>([])

// Load models
const loadAvailableModels = async () => {
  availableModels.value = await loadModels()
}

// Method to focus the input from ChatMessages component
const focusInput = () => {
  if (chatInputRef.value && chatInputRef.value.focusInput) {
    chatInputRef.value.focusInput()
  }
}

// Mobile sidebar controls
const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false
}

// Get current model details
const currentModelDetails = computed(() => {
  if (!chatStore.currentConversation) return null
  const modelId = chatStore.currentConversation.model
  return availableModels.value.find((m: AIModel) => m.model === modelId) || null
})

// Show model info
const showModelInfo = () => {
  if (currentModelDetails.value) {
    showModelInfoDialog.value = true
  }
}

// Close mobile sidebar when conversation changes
watch(() => chatStore.currentConversationId, () => {
  closeMobileSidebar()
})

// Load conversations on mount
onMounted(async () => {
  try {
    // Load available models
    await loadAvailableModels()

    // Load conversations from localStorage (this sets loading state)
    chatStore.loadFromLocalStorage()
  } catch (error) {
    console.error('Error during initialization:', error)
    // Ensure loading is complete even if there's an error
    chatStore.setLoadingComplete()
  }
})

// Auto-scroll when new messages are added or typing state changes
watch([() => chatStore.currentMessages, () => chatStore.isTyping], () => {
  if (chatStore.isAtBottom && chatMessagesRef.value?.messagesContainer) {
    scrollToBottom(chatMessagesRef.value.messagesContainer)
  }
}, { deep: true })

// Close mobile sidebar on window resize to desktop
onMounted(() => {
  const handleResize = () => {
    if (window.innerWidth >= 1024) { // lg breakpoint
      isMobileSidebarOpen.value = false
    }
  }

  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})
</script>