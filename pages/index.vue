<template>
  <div class="flex h-full relative">
    <!-- Mobile Overlay -->
    <div 
      v-if="isMobileSidebarOpen" 
      @click="closeMobileSidebar"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
    ></div>

    <!-- Sidebar -->
    <ConversationSidebar 
      :class="[
        'transition-transform duration-300 ease-in-out z-50',
        'lg:relative lg:translate-x-0',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
      :is-mobile-open="isMobileSidebarOpen"
      @open-settings="showSettingsDialog = true" 
      @close-mobile="closeMobileSidebar"
    />
    
    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <div class="bg-black/20 backdrop-blur-lg border-b border-white/10 p-3 sm:p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2 sm:space-x-3">
            <!-- Mobile Menu Button -->
            <button
              @click="toggleMobileSidebar"
              class="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icon name="heroicons:bars-3" class="h-5 w-5 text-white" />
            </button>
            
            <Icon name="heroicons:chat-bubble-left-right" class="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
            <h1 class="text-base sm:text-lg font-bold text-white">AskChadAI</h1>
          </div>
          
          <div v-if="chatStore.currentConversation" class="flex items-center space-x-2 text-xs sm:text-sm text-gray-300">
            <Icon name="heroicons:cpu-chip" class="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
            <span class="hidden sm:inline">{{ chatStore.currentConversation.model }}</span>
            <span class="sm:hidden">{{ chatStore.currentConversation.model.split(':')[0] }}</span>
          </div>
        </div>
      </div>

      <!-- Chat container -->
      <div class="flex-1 bg-black/20 backdrop-blur-lg flex flex-col min-h-0">
        <!-- Messages -->
        <ChatMessages ref="chatMessagesRef" />

        <!-- Input area -->
        <ChatInput />
      </div>
    </div>

    <!-- Settings Dialog (over entire screen) -->
    <SettingsDialog 
      :is-open="showSettingsDialog" 
      @close="showSettingsDialog = false" 
    />
  </div>
</template>

<script setup lang="ts">
// Set page title
useHead({
  title: 'AskChadAI - Chat mit KI'
})

const chatStore = useChatStore()
const { loadModels } = useChat()
const { scrollToBottom } = useScrolling()

const chatMessagesRef = ref()
const showSettingsDialog = ref(false)
const isMobileSidebarOpen = ref(false)

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
  await loadModels()
  chatStore.loadFromLocalStorage()
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