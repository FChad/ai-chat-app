<template>
  <div class="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
    <!-- Only show input form when there's a conversation -->
    <form v-if="chatStore.currentConversation" @submit.prevent="handleSubmit" class="flex flex-col space-y-3">

      <!-- Image preview area -->
      <div v-if="selectedImages.length > 0" class="flex flex-wrap gap-2 pb-2">
        <div v-for="(img, index) in selectedImages" :key="index" class="relative group">
          <img :src="img.preview" :alt="img.name"
            class="h-20 w-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600" />
          <button type="button" @click="removeImage(index)"
            class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Icon name="heroicons:x-mark" class="h-3 w-3" />
          </button>
          <div
            class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 truncate rounded-b-lg">
            {{ img.name }}
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <textarea ref="textareaRef" v-model="message"
          placeholder="Schreibe eine Nachricht... (Enter zum Senden, Shift+Enter für neue Zeile)"
          class="flex-1 w-full px-3 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none min-h-[46px] max-h-32 overflow-y-auto scrollbar-thin text-sm leading-5 transition-colors duration-200"
          :disabled="chatStore.isTyping || isCurrentConversationTyping" @keydown="handleKeydown" @paste="handlePaste" rows="1" />

        <div class="flex space-x-2 w-full sm:w-auto">
          <!-- Image upload button - only show if model supports images -->
          <label v-if="supportsImages"
            class="px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer flex-shrink-0"
            title="Bild hochladen">
            <input type="file" ref="fileInputRef" @change="handleFileSelect" accept="image/*" multiple class="hidden" />
            <Icon name="heroicons:photo" class="h-5 w-5" />
          </label>

          <!-- Cancel button when conversation is typing -->
          <button v-if="isCurrentConversationTyping" @click="handleCancel" type="button"
            class="flex-1 sm:flex-initial px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 flex-shrink-0 text-sm font-semibold">
            <Icon name="heroicons:x-mark" class="h-4 w-4" />
            <span>Abbrechen</span>
          </button>

          <!-- Send button -->
          <button v-else type="submit" :disabled="!canSend"
            class="flex-1 sm:flex-initial px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 flex-shrink-0 text-sm font-semibold">
            <Icon name="heroicons:paper-airplane" class="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Senden</span>
          </button>
        </div>
      </div>
    </form>

    <!-- Placeholder when no conversation is selected -->
    <div v-else class="invisible flex flex-col sm:flex-row items-end space-y-3 sm:space-y-0 sm:space-x-4">
      <div
        class="flex-1 w-full px-3 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-500 text-sm leading-5 min-h-[46px] flex items-center cursor-not-allowed">
        Wähle eine Unterhaltung aus, um eine Nachricht zu senden...
      </div>
      <button type="button" disabled
        class="w-full sm:w-auto px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center justify-center space-x-2 flex-shrink-0 self-stretch sm:self-start text-sm font-semibold">
        <Icon name="heroicons:paper-airplane" class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>Senden</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'

interface Props {
  currentModel?: AIModel | null
}

const props = defineProps<Props>()

const chatStore = useChatStore()
const { sendMessage, cancelMessage } = useChat()

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()

interface ImageFile {
  file: File
  preview: string
  name: string
  base64: string
}

const selectedImages = ref<ImageFile[]>([])

const isCurrentConversationTyping = computed(() => chatStore.isConversationTyping)

// Check if current model supports image input
const supportsImages = computed(() => {
  if (!props.currentModel?.details?.architecture?.input_modalities) return false
  return props.currentModel.details.architecture.input_modalities.includes('image')
})

// Clear selected images when switching to a model that doesn't support images
watch(supportsImages, (newValue) => {
  if (!newValue && selectedImages.value.length > 0) {
    // Clean up image previews
    selectedImages.value.forEach(img => {
      if (img?.preview) {
        URL.revokeObjectURL(img.preview)
      }
    })
    selectedImages.value = []
  }
})

const canSend = computed(() => {
  if (chatStore.isTyping || isCurrentConversationTyping.value) return false
  if (!message.value.trim() && selectedImages.value.length === 0) return false
  return chatStore.currentConversation !== null
})

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  for (const file of Array.from(files)) {
    // Check file type
    if (!file.type.startsWith('image/')) {
      console.warn('Only images are supported')
      continue
    }

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      console.warn('Image too large (max 20MB)')
      continue
    }

    // Create preview and base64
    const preview = URL.createObjectURL(file)
    const base64 = await fileToBase64(file)

    selectedImages.value.push({
      file,
      preview,
      name: file.name,
      base64
    })
  }

  // Reset input
  if (target) target.value = ''
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const removeImage = (index: number) => {
  // Revoke object URL to free memory
  const img = selectedImages.value[index]
  if (img?.preview) {
    URL.revokeObjectURL(img.preview)
  }
  selectedImages.value.splice(index, 1)
}

const handlePaste = async (event: ClipboardEvent) => {
  // Only process images if model supports them
  if (!supportsImages.value) return

  const items = event.clipboardData?.items
  if (!items) return

  // Check if there are any image items
  let hasImages = false
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      hasImages = true
      event.preventDefault() // Prevent default paste behavior for images
      
      const file = item.getAsFile()
      if (!file) continue

      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        console.warn('Image too large (max 20MB)')
        continue
      }

      // Create preview and base64
      const preview = URL.createObjectURL(file)
      const base64 = await fileToBase64(file)

      // Generate a name for pasted images
      const timestamp = new Date().toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }).replace(/:/g, '-')
      const name = `pasted-image-${timestamp}.png`

      selectedImages.value.push({
        file,
        preview,
        name,
        base64
      })
    }
  }

  // If images were pasted, we've already prevented default
  // If only text was pasted, let the default behavior happen
}

const handleSubmit = async () => {
  if (!canSend.value) return

  const messageToSend = message.value
  const imagesToSend = [...selectedImages.value]

  message.value = ''

  // Clean up image previews
  selectedImages.value.forEach(img => URL.revokeObjectURL(img.preview))
  selectedImages.value = []

  // Reset textarea height
  nextTick(() => {
    autoResize()
  })

  await sendMessage(messageToSend, imagesToSend)
}

const handleCancel = () => {
  if (chatStore.currentConversation) {
    cancelMessage(chatStore.currentConversation.id)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}

const autoResize = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

// Watch for changes in message to auto-resize
watch(message, () => {
  nextTick(() => {
    autoResize()
  })
})

// Auto-resize on mount and focus management
onMounted(() => {
  if (textareaRef.value) {
    autoResize()

    // Focus the textarea when component mounts
    const focusTextarea = () => {
      if (textareaRef.value && chatStore.currentConversation && !chatStore.isLoading) {
        textareaRef.value.focus()
      }
    }

    // Immediate focus if conditions are met
    setTimeout(focusTextarea, 100)

    // Also try again after a bit longer delay to handle slow loading
    setTimeout(focusTextarea, 500)
  }
})

// Focus textarea when conversation changes
watch(() => chatStore.currentConversation, (newConversation) => {
  if (newConversation && textareaRef.value) {
    // Add a small delay to ensure the component is fully rendered
    setTimeout(() => {
      textareaRef.value?.focus()
    }, 100)
  }
})

// Focus textarea when chat loading is complete
watch(() => chatStore.isLoading, (isLoading) => {
  if (!isLoading && textareaRef.value && chatStore.currentConversation) {
    // Chat has finished loading and there's an active conversation
    setTimeout(() => {
      textareaRef.value?.focus()
    }, 200)
  }
})

// Focus textarea when AI finishes typing
watch(() => isCurrentConversationTyping.value, (isTyping, wasTyping) => {
  if (wasTyping && !isTyping && textareaRef.value && chatStore.currentConversation) {
    // AI has finished typing, refocus the input field
    setTimeout(() => {
      textareaRef.value?.focus()
    }, 100)
  }
})

// focus state UI removed; keep logic minimal

// Method to focus the textarea from external components
const focusInput = () => {
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

// Expose the focus method for parent components
defineExpose({
  focusInput
})
</script>

<style scoped>
/* Modern Scrollbar for textarea */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 4px;
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

/* Mobile placeholder text optimization */
.mobile-placeholder::placeholder {
  font-size: inherit;
  line-height: inherit;
  opacity: 0.7;
}

/* Responsive placeholder text */
@media (min-width: 640px) {
  .mobile-placeholder::placeholder {
    font-size: inherit;
    line-height: inherit;
    opacity: 0.6;
  }
}

/* Extra small screens - even smaller placeholder */
@media (max-width: 375px) {
  .mobile-placeholder::placeholder {
    font-size: inherit;
    line-height: inherit;
  }
}

/* Ensure placeholder text wraps nicely on mobile */
@media (max-width: 640px) {
  .mobile-placeholder {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
}
</style>