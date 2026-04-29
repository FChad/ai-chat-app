<template>
  <UDashboardPanel
    id="chat-view"
    class="relative min-h-0"
    :ui="{ body: 'p-0 sm:p-0 overscroll-none' }"
  >
    <template #header>
      <Navbar>
        <template v-if="currentConv" #title>
          <ChatTitle
            :conversation-id="currentConv.id"
            :title="currentConv.title"
          />
        </template>

        <UButton
          v-if="currentModelDetails"
          color="neutral"
          variant="ghost"
          size="sm"
          trailing-icon="i-lucide-info"
          @click="showInfo = true"
        >
          <span class="truncate max-w-50">{{ currentModelDetails.name }}</span>
        </UButton>
      </Navbar>
    </template>

    <template #body>
      <div ref="dropzoneRef" class="relative flex flex-1">
        <DragDropOverlay :show="dragging" />
        <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6">
          <div
            ref="messagesEl"
            class="flex-1 pt-(--ui-header-height) pb-4 sm:pb-6"
          >
            <div v-if="!currentConv && !chatStore.isLoading" class="flex-1 flex items-center justify-center h-full">
              <UEmpty
                icon="i-lucide-message-circle-off"
                title="Chat not found"
                description="This conversation no longer exists."
              >
                <template #actions>
                  <UButton to="/chat/new" label="Start a new chat" />
                </template>
              </UEmpty>
            </div>

            <div v-else-if="currentMessages.length === 0" class="h-full flex items-center justify-center">
              <div class="text-center">
                <UIcon name="i-lucide-sparkles" class="size-10 text-primary mx-auto mb-3" />
                <p class="text-sm text-muted">Ask anything to get started.</p>
              </div>
            </div>

            <div v-else class="flex flex-col gap-6">
              <UChatMessage
                v-for="(msg, i) in currentMessages"
                :id="msg.id || String(i)"
                :key="msg.id"
                :role="msg.role"
                :parts="[]"
                :side="msg.role === 'user' ? 'right' : 'left'"
                :variant="msg.role === 'user' ? 'soft' : 'naked'"
                :avatar="msg.role === 'user' ? { icon: 'i-lucide-user' } : undefined"
              >
                <template #content>
                  <ChatMessageContent
                    :message="msg"
                    :streaming="isStreamingMessage(i)"
                  />
                </template>

                <template v-if="msg.role === 'assistant' && !isStreamingMessage(i) && msg.content" #actions>
                  <ChatMessageActions
                    :message="msg"
                    :can-regenerate="i === currentMessages.length - 1"
                    @regenerate="handleRegenerate"
                  />
                </template>
              </UChatMessage>

              <div v-if="showThinking" class="flex items-center gap-2 text-muted pl-2">
                <ChatIndicator />
                <UChatShimmer text="Thinking..." class="text-sm" />
              </div>
            </div>
          </div>

          <UChatPrompt
            v-model="input"
            :status="status"
            variant="subtle"
            class="sticky bottom-0 rounded-b-none z-10 [view-transition-name:chat-prompt]"
            :ui="{ base: 'px-1.5' }"
            placeholder="Send a message..."
            @submit="handleSubmit"
            @paste.capture="handlePaste"
          >
            <template v-if="images.length" #header>
              <div class="flex flex-wrap gap-2">
                <ChatFilePreview
                  v-for="(img, i) in images"
                  :key="i"
                  :src="img.preview"
                  :name="img.name"
                  removable
                  @remove="removeImage(i)"
                />
              </div>
            </template>

            <template #footer>
              <div class="flex items-center gap-1.5">
                <UButton
                  icon="i-lucide-paperclip"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :disabled="!supportsImages"
                  @click="fileInput?.click()"
                />
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="onFileChange"
                />
                <ModelSelect />
              </div>

              <div class="ml-auto flex items-center gap-1.5">
                <UChatPromptSubmit
                  color="neutral"
                  size="sm"
                  @stop="cancel"
                />
              </div>
            </template>
          </UChatPrompt>
        </UContainer>
      </div>
    </template>
  </UDashboardPanel>

  <ModelInfoDialog
    v-if="currentModelDetails"
    :is-open="showInfo"
    :model="currentModelDetails"
    @close="showInfo = false"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const { loadModels, sendMessage } = useChat()

const {
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
} = useChatInput()

const messagesEl = ref<HTMLElement>()
const scrollEl = shallowRef<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement>()
const showInfo = ref(false)
const isAtBottom = ref(true)

function findScrollParent(el: HTMLElement | null | undefined): HTMLElement | null {
  let node: HTMLElement | null = el?.parentElement ?? null
  while (node) {
    const overflowY = getComputedStyle(node).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return null
}

const currentConv = computed(() => chatStore.currentConversation)
const currentMessages = computed(() => chatStore.currentMessages)
const isTyping = computed(() => chatStore.isConversationTyping)

const showThinking = computed(() => {
  if (!isTyping.value) return false
  const last = currentMessages.value[currentMessages.value.length - 1]
  return !last || last.role !== 'assistant' || !last.content
})

const isStreamingMessage = (i: number) =>
  isTyping.value
  && i === currentMessages.value.length - 1
  && currentMessages.value[i]?.role === 'assistant'

useHead({
  title: computed(() => {
    const title = currentConv.value?.title
    return title ? `AskChadAI - ${title}` : 'AskChadAI - Chat'
  })
})

const syncConversation = () => {
  const id = route.params.id as string
  const exists = chatStore.conversations.find(c => c.id === id)
  if (exists) {
    chatStore.selectConversation(id)
  } else if (!chatStore.isLoading) {
    router.replace('/chat/new')
  }
}

watch(() => chatStore.isLoading, (loading) => {
  if (!loading) syncConversation()
})

watch(() => route.params.id, () => {
  if (!chatStore.isLoading) syncConversation()
})

watch(() => chatStore.conversations, (list) => {
  const id = route.params.id as string
  if (!list.find(c => c.id === id) && !chatStore.isLoading) {
    router.replace('/chat/new')
  }
}, { deep: true })

const scrollToBottom = (smooth = false) => {
  nextTick(() => {
    const el = scrollEl.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    isAtBottom.value = true
  })
}

const onScroll = () => {
  const el = scrollEl.value
  if (!el) return
  isAtBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 40
}

watch(() => currentMessages.value.length, () => {
  if (isAtBottom.value) scrollToBottom()
})

watch(
  () => currentMessages.value[currentMessages.value.length - 1]?.content,
  () => {
    if (isAtBottom.value) scrollToBottom()
  }
)

watch(() => route.params.id, () => {
  isAtBottom.value = true
  scrollToBottom()
})

const handleSubmit = async () => {
  await submit()
  scrollToBottom(true)
}

const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await addFiles(target.files)
  }
  if (target) target.value = ''
}

const handleRegenerate = async () => {
  if (!currentConv.value) return
  const messages = currentConv.value.messages
  if (messages.length < 2) return
  const last = messages[messages.length - 1]
  if (last?.role !== 'assistant') return
  const userMsg = messages[messages.length - 2]
  if (userMsg?.role !== 'user') return

  messages.pop()
  messages.pop()

  const text = typeof userMsg.content === 'string'
    ? userMsg.content
    : userMsg.content.find(p => p.type === 'text')?.text || ''
  // For regenerate we don't re-upload; we hand the existing idb-blob: markers
  // straight through. The composer's preview field is set to the same value —
  // FilePreview resolves markers via useResolvedImageUrl.
  const imgs = typeof userMsg.content === 'string'
    ? []
    : userMsg.content
      .filter(p => p.type === 'image_url')
      .map(p => ({
        existingUrl: p.image_url!.url,
        preview: p.image_url!.url,
        name: 'image'
      }))

  await sendMessage(text, imgs)
  scrollToBottom(true)
}

onMounted(async () => {
  scrollEl.value = findScrollParent(messagesEl.value)
  scrollEl.value?.addEventListener('scroll', onScroll, { passive: true })
  await loadModels()
  if (!chatStore.isLoading) syncConversation()
  scrollToBottom()
})

onBeforeUnmount(() => {
  scrollEl.value?.removeEventListener('scroll', onScroll)
})
</script>
