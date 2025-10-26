<template>
  <!-- Modal Overlay -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" @click="closeDialog"
        class="fixed inset-0 bg-black/20 dark:bg-black/40 z-[60] flex items-center justify-center p-4 sm:p-6 animate-fade-in">

        <!-- Dialog -->
        <div @click.stop
          class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden transform transition-all"
          :class="isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'">

          <!-- Header -->
          <div
            class="flex justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">Customize your chat experience</p>
            </div>
            <button @click="closeDialog"
              class="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 group">
              <Icon name="heroicons:x-mark"
                class="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            <!-- App Settings Section -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-3">
                <div class="w-6 h-6 flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                  <Icon name="heroicons:adjustments-horizontal"
                    class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <span>App Settings</span>
              </h3>

              <div class="space-y-4">
                <!-- Theme Toggle -->
                <div
                  class="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3 mb-2">
                        <div
                          class="w-6 h-6 flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                          <Icon name="heroicons:moon" class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Design Mode</span>
                      </div>
                      <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Choose between light, dark, or automatic mode based on your system settings.
                      </p>
                    </div>
                    <div class="ml-4">
                      <ThemeToggle />
                    </div>
                  </div>
                </div>

                <!-- Stream Mode Toggle -->
                <div
                  class="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3 mb-2">
                        <div
                          class="w-6 h-6 flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                          <Icon name="heroicons:play" class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Streaming Mode</span>
                      </div>
                      <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Responses are streamed in real-time. Disable this option
                        to receive complete responses all at once.
                      </p>
                    </div>
                    <div class="ml-4">
                      <button @click="toggleStreamMode"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                        :class="chatStore.isStreamModeEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'">
                        <span
                          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                          :class="chatStore.isStreamModeEnabled ? 'translate-x-6' : 'translate-x-1'"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Conversations Section -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-3">
                <div class="w-6 h-6 flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                  <Icon name="heroicons:chat-bubble-left-right"
                    class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <span>Conversations</span>
              </h3>

              <div class="space-y-4">
                <!-- Conversation Stats -->
                <div class="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {{ chatStore.conversations.length }}
                      </div>
                      <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        Saved Conversations
                      </div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {{ totalMessages }}
                      </div>
                      <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        Total Messages
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Export Conversations -->
                  <button @click="exportConversations"
                    class="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm font-medium">
                    <Icon name="heroicons:arrow-down-tray" class="h-4 w-4" />
                    <span>Export</span>
                  </button>

                  <!-- Clear All Conversations -->
                  <button @click="confirmClearAll" :disabled="chatStore.conversations.length === 0"
                    class="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm font-medium disabled:cursor-not-allowed">
                    <Icon name="heroicons:trash" class="h-4 w-4" />
                    <span>Delete All</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button @click="closeDialog"
              class="px-6 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 font-medium border border-gray-200 dark:border-gray-700">
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Confirmation Dialog -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showConfirmDialog" @click="showConfirmDialog = false"
        class="fixed inset-0 bg-black/30 dark:bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">

        <div @click.stop
          class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg w-full max-w-sm">
          <div class="p-6">
            <div class="flex items-center space-x-3 mb-4">
              <div
                class="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/40 rounded-lg flex-shrink-0">
                <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirmation</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Irreversible action</p>
              </div>
            </div>

            <p class="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              Do you really want to delete all conversations? This action cannot be undone.
            </p>

            <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button @click="clearAllConversations"
                class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium">
                Delete
              </button>
              <button @click="showConfirmDialog = false"
                class="px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 font-medium border border-gray-200 dark:border-gray-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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

/* Modal Transitions - Schnell */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
  opacity: 0;
}
</style>