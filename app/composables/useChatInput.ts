import { MAX_IMAGE_SIZE } from '~/config/constants'
import type { AIModel } from '../../types/chat'

export interface UploadedImage {
    file: File
    preview: string
    name: string
    base64: string
}

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result)
            else reject(new Error('Failed to read file'))
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })

/**
 * Centralized composer state + logic: text input, image attachments (paste/upload),
 * vision-model gating, and a submit/cancel helper that bridges into useChat.
 */
export const useChatInput = () => {
    const chatStore = useChatStore()
    const selectedModel = useSelectedModel()
    const { sendMessage, cancelMessage } = useChat()
    const toast = useToast()

    const input = ref('')
    const images = ref<UploadedImage[]>([])

    const currentModelDetails = computed<AIModel | null>(() => {
        const modelId = chatStore.currentConversation?.model || selectedModel.value
        return chatStore.availableModels.find(m => m.model === modelId) || null
    })

    const supportsImages = computed(() =>
        !!currentModelDetails.value?.details?.architecture?.input_modalities?.includes('image')
    )

    // Streaming status for UChatPrompt (ready | submitted | streaming | error)
    const status = computed<'ready' | 'submitted' | 'streaming' | 'error'>(() => {
        if (chatStore.isConversationTyping) return 'streaming'
        if (chatStore.isTyping) return 'submitted'
        return 'ready'
    })

    // Clean up images if the user switches to a non-vision model
    watch(supportsImages, (vision) => {
        if (!vision && images.value.length > 0) {
            clearImages()
        }
    })

    const addFiles = async (files: FileList | File[]) => {
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) {
                toast.add({ color: 'warning', title: 'Only images are supported' })
                continue
            }
            if (file.size > MAX_IMAGE_SIZE) {
                toast.add({ color: 'warning', title: 'Image too large', description: 'Max 20 MB per image.' })
                continue
            }
            const preview = URL.createObjectURL(file)
            const base64 = await fileToBase64(file)
            images.value.push({ file, preview, name: file.name, base64 })
        }
    }

    const removeImage = (index: number) => {
        const img = images.value[index]
        if (img?.preview) URL.revokeObjectURL(img.preview)
        images.value.splice(index, 1)
    }

    const clearImages = () => {
        images.value.forEach(img => URL.revokeObjectURL(img.preview))
        images.value = []
    }

    const handlePaste = async (event: ClipboardEvent) => {
        if (!supportsImages.value) return
        const items = event.clipboardData?.items
        if (!items) return
        const imageFiles: File[] = []
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) imageFiles.push(file)
            }
        }
        if (imageFiles.length > 0) {
            event.preventDefault()
            await addFiles(imageFiles)
        }
    }

    const submit = async (opts?: { onNewConversation?: (id: string) => void }) => {
        const text = input.value.trim()
        if (!text && images.value.length === 0) return
        if (chatStore.isConversationTyping) return

        const imgs = [...images.value]
        input.value = ''
        images.value = []
        // Note: we don't revoke previews here — they are attached to the user message and still displayed.

        if (!chatStore.currentConversation) {
            const id = chatStore.createNewConversation(selectedModel.value, text)
            opts?.onNewConversation?.(id)
        }
        await sendMessage(text, imgs, selectedModel.value)
    }

    const cancel = () => {
        if (chatStore.currentConversation) cancelMessage(chatStore.currentConversation.id)
    }

    return {
        input,
        images,
        status,
        supportsImages,
        currentModelDetails,
        addFiles,
        removeImage,
        clearImages,
        handlePaste,
        submit,
        cancel
    }
}
