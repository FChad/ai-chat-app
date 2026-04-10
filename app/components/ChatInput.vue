<template>
  <div class="bg-background border-t border-border p-2">
    <!-- Error Alert -->
    <Alert v-if="errorTitle" variant="destructive" class="mb-2 relative">
      <Icon name="heroicons:exclamation-circle" class="h-4 w-4" />
      <AlertTitle>{{ errorTitle }}</AlertTitle>
      <AlertDescription>{{ errorDetail }}</AlertDescription>
      <Button
        type="button" variant="ghost" size="icon"
        class="absolute top-1.5 right-1.5 h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
        @click="clearError">
        <Icon name="heroicons:x-mark" class="h-3.5 w-3.5" />
      </Button>
    </Alert>

    <!-- Only show input form when there's a conversation -->
    <form v-if="chatStore.currentConversation" @submit.prevent="handleSubmit">

      <!-- Image previews (above toolbar) -->
      <div v-if="selectedImages.length > 0" class="flex flex-wrap gap-2 px-1 pb-2">
        <div v-for="(img, index) in selectedImages" :key="index" class="relative group">
          <img :src="img.preview" :alt="img.name" class="h-16 w-16 object-cover rounded-md border border-border" />
          <Button type="button" variant="destructive" size="icon"
            class="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            @click="removeImage(index)">
            <Icon name="heroicons:x-mark" class="h-3 w-3" />
          </Button>
          <div
            class="absolute bottom-0 left-0 right-0 bg-foreground/60 text-background text-[10px] px-1 py-0.5 truncate rounded-b-md">
            {{ img.name }}
          </div>
        </div>
      </div>

      <!-- Toolbar row -->
      <div class="border rounded-lg py-1.5 px-2 flex flex-wrap items-start gap-x-1">
        <!-- Left: attachment / plus -->
        <div class="h-9 flex items-center order-1">
          <label v-if="supportsImages" class="inline-flex">
            <input type="file" ref="fileInputRef" @change="handleFileSelect" accept="image/*" multiple class="hidden" />
            <Button type="button" variant="ghost" size="icon" as="span"
              class="cursor-pointer size-8 text-muted-foreground hover:text-foreground">
              <Icon name="heroicons:paper-clip" class="h-4 w-4" />
            </Button>
          </label>
          <Button v-else type="button" variant="ghost" size="icon"
            class="size-8 text-muted-foreground hover:text-foreground" disabled>
            <Icon name="heroicons:plus" class="h-4 w-4" />
          </Button>
        </div>

        <!-- Center: textarea (borderless) -->
        <div class="flex-1 min-w-0 order-2 grid">
          <textarea ref="textareaRef" v-model="message"
            placeholder="Type your message…"
            class="field-sizing-content w-full bg-transparent py-2 text-sm outline-none border-none shadow-none resize-none min-h-9 max-h-32 px-1 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="chatStore.isTyping || isCurrentConversationTyping"
            @keydown="handleKeydown"
            @paste="handlePaste" />
        </div>

        <!-- Right: cancel / send -->
        <div class="h-9 flex items-center gap-1 order-3">
          <Button v-if="isCurrentConversationTyping" type="button" variant="ghost" size="icon"
            class="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            @click="handleCancel">
            <Icon name="heroicons:stop" class="h-4 w-4" />
          </Button>
          <Button v-else type="submit" variant="ghost" size="icon"
            :disabled="!canSend"
            class="size-8 disabled:opacity-30">
            <Icon name="heroicons:paper-airplane" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>

    <!-- Placeholder when no conversation is selected -->
    <div v-else class="border rounded-lg py-1.5 px-2 flex items-center gap-x-1 opacity-40 pointer-events-none">
      <div class="h-9 flex items-center order-1">
        <Button type="button" variant="ghost" size="icon" class="size-8" disabled>
          <Icon name="heroicons:plus" class="h-4 w-4" />
        </Button>
      </div>
      <div class="flex-1 order-2 py-2 px-1 text-sm text-muted-foreground">
        Select a conversation to start chatting…
      </div>
      <div class="h-9 flex items-center order-3">
        <Button type="button" variant="ghost" size="icon" class="size-8" disabled>
          <Icon name="heroicons:paper-airplane" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface Props {
  currentModel?: AIModel | null
}

const props = defineProps<Props>()

const chatStore = useChatStore()
const { sendMessage, cancelMessage } = useChat()

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()

const errorTitle = computed(() => chatStore.apiError?.title ?? null)
const errorDetail = computed(() => chatStore.apiError?.detail ?? null)

const clearError = () => {
  chatStore.clearApiError()
}

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
      const timestamp = new Date().toLocaleTimeString('en-US', {
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

  clearError()

  const messageToSend = message.value
  const imagesToSend = [...selectedImages.value]

  message.value = ''

  // Clean up image previews
  selectedImages.value.forEach(img => URL.revokeObjectURL(img.preview))
  selectedImages.value = []

  const result = await sendMessage(messageToSend, imagesToSend)
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

// Focus management
onMounted(() => {
  if (textareaRef.value) {
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
