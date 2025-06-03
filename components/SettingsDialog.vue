<template>
  <!-- Backdrop -->
  <div 
    v-if="isOpen"
    @click="closeDialog"
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
  >
    <!-- Dialog -->
    <div 
      @click.stop
      class="bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md transform transition-all"
      :class="isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
        <div class="flex items-center space-x-3">
          <Icon name="heroicons:cog-6-tooth" class="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
          <h2 class="text-base sm:text-lg font-semibold text-white">Einstellungen</h2>
        </div>
        <button
          @click="closeDialog"
          class="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
        <!-- App Settings Section -->
        <div>
          <h3 class="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
            <Icon name="heroicons:adjustments-horizontal" class="h-4 w-4" />
            <span>App-Einstellungen</span>
          </h3>
          
          <div class="space-y-3">
            <!-- Stream Mode Toggle -->
            <div class="p-3 bg-black/30 rounded-lg border border-white/10">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <Icon name="heroicons:play" class="h-4 w-4 text-blue-400" />
                    <span class="text-sm font-medium text-white">Streaming-Modus</span>
                  </div>
                  <p class="text-xs text-gray-400 leading-relaxed">
                    Antworten werden in Echtzeit gestreamt. Deaktivieren Sie diese Option, 
                    um komplette Antworten auf einmal zu erhalten.
                  </p>
                </div>
                <div class="ml-4">
                  <button
                    @click="toggleStreamMode"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black touch-manipulation"
                    :class="chatStore.isStreamModeEnabled ? 'bg-purple-600' : 'bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="chatStore.isStreamModeEnabled ? 'translate-x-6' : 'translate-x-1'"
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Conversations Section -->
        <div>
          <h3 class="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
            <Icon name="heroicons:chat-bubble-left-right" class="h-4 w-4" />
            <span>Unterhaltungen</span>
          </h3>
          
          <div class="space-y-3">
            <!-- Conversation Stats -->
            <div class="p-3 bg-black/30 rounded-lg border border-white/10">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-400">Gespeicherte Unterhaltungen:</span>
                <span class="text-white font-medium">{{ chatStore.conversations.length }}</span>
              </div>
              <div class="flex items-center justify-between text-sm mt-1">
                <span class="text-gray-400">Gesamte Nachrichten:</span>
                <span class="text-white font-medium">{{ totalMessages }}</span>
              </div>
            </div>

            <!-- Export Conversations -->
            <button
              @click="exportConversations"
              class="w-full px-3 sm:px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm touch-manipulation"
            >
              <Icon name="heroicons:arrow-down-tray" class="h-4 w-4" />
              <span>Unterhaltungen exportieren</span>
            </button>

            <!-- Clear All Conversations -->
            <button
              @click="confirmClearAll"
              :disabled="chatStore.conversations.length === 0"
              class="w-full px-3 sm:px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <Icon name="heroicons:trash" class="h-4 w-4" />
              <span>Alle Unterhaltungen löschen</span>
            </button>
          </div>
        </div>

        <!-- App Information -->
        <div>
          <h3 class="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
            <Icon name="heroicons:information-circle" class="h-4 w-4" />
            <span>App-Information</span>
          </h3>
          
          <div class="space-y-3">
            <!-- App Info -->
            <div class="p-3 bg-black/30 rounded-lg border border-white/10 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-400">App Name:</span>
                <span class="text-white font-medium">{{ appInfo.name }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-400">Version:</span>
                <span class="text-white font-medium">{{ appInfo.version }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-400">Build:</span>
                <span class="text-white font-medium">{{ appInfo.build }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-white/10">
        <button
          @click="closeDialog"
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors touch-manipulation"
        >
          Schließen
        </button>
      </div>
    </div>
  </div>

  <!-- Confirmation Dialog -->
  <div 
    v-if="showConfirmDialog"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-3 sm:p-4"
  >
    <div class="bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-sm">
      <div class="p-4 sm:p-6">
        <div class="flex items-center space-x-3 mb-4">
          <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
          <h3 class="text-base sm:text-lg font-semibold text-white">Bestätigung</h3>
        </div>
        
        <p class="text-sm sm:text-base text-gray-300 mb-6">
          Möchtest du wirklich alle Unterhaltungen löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            @click="showConfirmDialog = false"
            class="w-full sm:w-auto px-4 py-2 text-gray-400 hover:text-white transition-colors touch-manipulation"
          >
            Abbrechen
          </button>
          <button
            @click="clearAllConversations"
            class="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors touch-manipulation"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const chatStore = useChatStore()
const { getBuildInfo } = useAppInfo()
const showConfirmDialog = ref(false)

const appInfo = getBuildInfo()

const totalMessages = computed(() => {
  return chatStore.conversations.reduce((total, conv) => total + conv.messages.length, 0)
})

const closeDialog = () => {
  emit('close')
}

const confirmClearAll = () => {
  showConfirmDialog.value = true
}

const clearAllConversations = () => {
  chatStore.clearAllConversations()
  showConfirmDialog.value = false
  closeDialog()
}

const toggleStreamMode = () => {
  chatStore.updateStreamMode(!chatStore.isStreamModeEnabled)
}

const exportConversations = () => {
  try {
    const data = {
      exportDate: new Date().toISOString(),
      version: appInfo.version,
      app: appInfo.name,
      conversations: chatStore.conversations,
      settings: chatStore.settings
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${appInfo.name.toLowerCase()}-conversations-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    alert('Export fehlgeschlagen. Bitte versuche es erneut.')
  }
}

// Close dialog on Escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      closeDialog()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script> 