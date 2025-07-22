<template>
  <div class="flex h-full relative font-system">
    <!-- Mobile Overlay -->
    <div 
      v-if="isMobileSidebarOpen" 
      @click="closeMobileSidebar"
      class="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
    ></div>

    <!-- Sidebar -->
    <ConversationSidebar 
      :class="[
        'transition-all duration-300 ease-out z-50',
        'lg:relative lg:translate-x-0',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
      :is-mobile-open="isMobileSidebarOpen"
      @open-settings="showSettingsDialog = true" 
      @close-mobile="closeMobileSidebar"
    />
    
    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border-l border-white/20 dark:border-gray-700/30">
      <!-- Header -->
      <div class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-700/30 p-4 sm:px-6 flex items-center">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-3 sm:space-x-4">
            <!-- Mobile Menu Button -->
            <button
              @click="toggleMobileSidebar"
              class="lg:hidden w-10 h-10 flex items-center justify-center hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-xl transition-all duration-200 backdrop-blur-sm"
            >
              <Icon name="heroicons:bars-3" class="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <!-- App Icon & Title -->
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Icon name="heroicons:chat-bubble-left-right" class="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">AskChadAI</h1>
                <p class="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Intelligent Assistant</p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            <!-- Current Model Info -->
            <div v-if="chatStore.currentConversation" class="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-100/60 dark:bg-gray-700/60 rounded-full backdrop-blur-sm">
              <Icon name="heroicons:cpu-chip" class="h-4 w-4 text-primary-500" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ chatStore.currentConversation.model.split(':')[0] }}
              </span>
            </div>
            
            <!-- Theme Toggle -->
            <ThemeToggle />
          </div>
        </div>
      </div>

      <!-- Chat container -->
      <div class="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-transparent to-gray-50/20 dark:to-gray-900/20">
        <!-- Messages -->
        <ChatMessages ref="chatMessagesRef" @focus-input="focusInput" />

        <!-- Input area -->
        <ChatInput ref="chatInputRef" />
      </div>
    </div>

    <!-- Settings Dialog -->
    <SettingsDialog 
      :is-open="showSettingsDialog" 
      @close="showSettingsDialog = false" 
    />
  </div>
</template>

<script setup lang="ts">
// Set page title
useHead({
  title: 'AskChadAI - Intelligent Chat Assistant'
})

const chatStore = useChatStore()
const { loadModels } = useChat()
const { scrollToBottom } = useScrolling()

const chatMessagesRef = ref()
const chatInputRef = ref()
const showSettingsDialog = ref(false)
const isMobileSidebarOpen = ref(false)

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

// Close mobile sidebar when conversation changes
watch(() => chatStore.currentConversationId, () => {
  closeMobileSidebar()
})

// Load models and conversations on mount
onMounted(async () => {
  try {
    // Load conversations from localStorage first (this sets loading state)
    chatStore.loadFromLocalStorage()
    
    // Then load models from API
    await loadModels()
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