<template>
  <!-- Backdrop -->
  <div v-if="isOpen" @click="closeDialog"
    class="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
    <!-- Dialog -->
    <div @click.stop
      class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-scale-in"
      :class="isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200/30 dark:border-gray-700/30">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
            <Icon name="heroicons:cog-6-tooth" class="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Einstellungen</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">Personalisiere deine Chat-Erfahrung</p>
          </div>
        </div>
        <button @click="closeDialog"
          class="w-10 h-10 flex items-center justify-center hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-xl transition-all duration-200 backdrop-blur-sm group">
          <Icon name="heroicons:x-mark"
            class="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
        <!-- App Settings Section -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-3">
            <div class="w-6 h-6 flex items-center justify-center bg-blue-100/60 dark:bg-blue-900/40 rounded-xl">
              <Icon name="heroicons:adjustments-horizontal" class="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span>App-Einstellungen</span>
          </h3>

          <div class="space-y-4">
            <!-- Theme Toggle -->
            <GlassCard padding="p-4" classes="transition-all duration-200 hover:shadow-lg">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <div
                      class="w-6 h-6 flex items-center justify-center bg-purple-100/60 dark:bg-purple-900/40 rounded-xl">
                      <Icon name="heroicons:moon" class="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Design-Modus</span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Wähle zwischen hellem, dunklem oder automatischem Modus basierend auf deinen Systemeinstellungen.
                  </p>
                </div>
                <div class="ml-4">
                  <ThemeToggle />
                </div>
              </div>
            </GlassCard>

            <!-- Stream Mode Toggle -->
            <GlassCard padding="p-4" classes="transition-all duration-200 hover:shadow-lg">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <div
                      class="w-6 h-6 flex items-center justify-center bg-green-100/60 dark:bg-green-900/40 rounded-xl">
                      <Icon name="heroicons:play" class="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Streaming-Modus</span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Antworten werden in Echtzeit gestreamt. Deaktivieren Sie diese Option,
                    um komplette Antworten auf einmal zu erhalten.
                  </p>
                </div>
                <div class="ml-4">
                  <button @click="toggleStreamMode"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 active:scale-95"
                    :class="chatStore.isStreamModeEnabled ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg' : 'bg-gray-300 dark:bg-gray-600'">
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-all duration-200"
                      :class="chatStore.isStreamModeEnabled ? 'translate-x-6' : 'translate-x-1'"></span>
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        <!-- Conversations Section -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-3">
            <div class="w-6 h-6 flex items-center justify-center bg-orange-100/60 dark:bg-orange-900/40 rounded-xl">
              <Icon name="heroicons:chat-bubble-left-right" class="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span>Unterhaltungen</span>
          </h3>

          <div class="space-y-4">
            <!-- Conversation Stats -->
            <GlassCard padding="p-4" classes="transition-all duration-200 hover:shadow-lg">
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {{ chatStore.conversations.length }}
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Gespeicherte Unterhaltungen
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ totalMessages }}
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Gesamte Nachrichten
                  </div>
                </div>
              </div>
            </GlassCard>

            <!-- Action Buttons -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Export Conversations -->
              <button @click="exportConversations"
                class="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium shadow-lg hover:shadow-xl active:scale-[0.98]">
                <Icon name="heroicons:arrow-down-tray" class="h-4 w-4" />
                <span>Exportieren</span>
              </button>

              <!-- Clear All Conversations -->
              <button @click="confirmClearAll" :disabled="chatStore.conversations.length === 0"
                class="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium shadow-lg hover:shadow-xl disabled:shadow-sm disabled:cursor-not-allowed active:scale-[0.98]">
                <Icon name="heroicons:trash" class="h-4 w-4" />
                <span>Alle löschen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200/30 dark:border-gray-700/30">
        <button @click="closeDialog"
          class="px-6 py-2.5 bg-gradient-to-r from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-700/80 hover:from-gray-200/90 hover:to-gray-300/90 dark:hover:from-gray-700/90 dark:hover:to-gray-600/90 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-xl transition-all duration-200 font-medium backdrop-blur-sm shadow-lg hover:shadow-xl border border-gray-200/40 dark:border-gray-600/40 active:scale-[0.98] hover:scale-[1.02]">
          Schließen
        </button>
      </div>
    </div>
  </div>

  <!-- Confirmation Dialog -->
  <div v-if="showConfirmDialog"
    class="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
    <div
      class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
      <div class="p-6">
        <div class="flex items-center space-x-3 mb-4">
          <div class="p-2 bg-red-100/60 dark:bg-red-900/40 rounded-xl">
            <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Bestätigung</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Unwiderrufliche Aktion</p>
          </div>
        </div>

        <p class="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
          Möchtest du wirklich alle Unterhaltungen löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button @click="showConfirmDialog = false"
            class="w-full sm:w-auto px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors font-medium">
            Abbrechen
          </button>
          <button @click="clearAllConversations"
            class="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl active:scale-[0.98]">
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
const showConfirmDialog = ref(false)

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
      conversations: chatStore.conversations,
      settings: chatStore.settings
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `askchadai-conversations-${new Date().toISOString().split('T')[0]}.json`
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

<style scoped>
/* Modern Scrollbar */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 6px;
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
</style>