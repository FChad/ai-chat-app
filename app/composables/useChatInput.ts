import { useDropZone } from '@vueuse/core'
import { MAX_IMAGE_SIZE } from '~/config/constants'
import type { AIModel } from '../../types/chat'

/**
 * Pending image attachment in the composer.
 * - `file` is set for fresh uploads (new Blob → persisted on submit).
 * - `existingUrl` is set when regenerating: an existing idb-blob:{uuid} marker
 *   that should be reused without re-uploading the bytes.
 * Exactly one of `file` / `existingUrl` is set per item.
 */
export interface UploadedImage {
    file?: File
    existingUrl?: string
    preview: string
    name: string
}

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
    const dropzoneRef = ref<HTMLElement | null>(null)
    const dragging = ref(false)

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
            // Keep the File in memory and only persist on submit. No base64 read here —
            // that doubled the work and the result was thrown away anyway.
            const preview = URL.createObjectURL(file)
            images.value.push({ file, preview, name: file.name })
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
        // The composer's preview URLs are object URLs we created in addFiles.
        // We don't revoke them here: the persisted message references the image
        // via an idb-blob:{uuid} marker (resolved separately by useResolvedImageUrl),
        // so the previews are no longer needed but leaking them is bounded to the
        // tab's lifetime.

        if (!chatStore.currentConversation) {
            const id = chatStore.createNewConversation(selectedModel.value, text)
            opts?.onNewConversation?.(id)
        }
        await sendMessage(text, imgs, selectedModel.value)
    }

    const cancel = () => {
        if (chatStore.currentConversation) cancelMessage(chatStore.currentConversation.id)
    }

    // Drag & drop: only image files are accepted; gated by vision support.
    useDropZone(dropzoneRef, {
        dataTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
        onDrop(files) {
            dragging.value = false
            if (!files || files.length === 0) return
            if (!supportsImages.value) {
                toast.add({ color: 'warning', title: 'Selected model does not support images' })
                return
            }
            void addFiles(files)
        },
        onEnter() {
            if (supportsImages.value) dragging.value = true
        },
        onLeave() {
            dragging.value = false
        }
    })

    return {
        input,
        images,
        status,
        supportsImages,
        currentModelDetails,
        dropzoneRef,
        dragging,
        addFiles,
        removeImage,
        handlePaste,
        submit,
        cancel
    }
}
