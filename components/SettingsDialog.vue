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

        <!-- App Info Section -->
        <div>
          <h3 class="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
            <Icon name="heroicons:information-circle" class="h-4 w-4" />
            <span>App-Informationen</span>
          </h3>
          
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-400">App:</span>
              <span class="text-white">{{ appInfo.name }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Version:</span>
              <span class="text-white">{{ appInfo.version }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Framework:</span>
              <span class="text-white">{{ appInfo.framework }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Verfügbare Modelle:</span>
              <span class="text-white">{{ chatStore.availableModels.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Speicher:</span>
              <span class="text-white">{{ appInfo.storage }}</span>
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

const exportConversations = () => {
  try {
    const data = {
      exportDate: new Date().toISOString(),
      version: appInfo.version,
      app: appInfo.name,
      conversations: chatStore.conversations
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