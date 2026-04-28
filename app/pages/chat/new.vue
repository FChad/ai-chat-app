<template>
  <UDashboardPanel id="chat-new">
    <template #header>
      <Navbar />
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
        <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
          {{ greeting }}
        </h1>

        <UChatPrompt
          v-model="input"
          :status="status"
          variant="subtle"
          class="[view-transition-name:chat-prompt]"
          :ui="{ base: 'px-1.5' }"
          placeholder="Ask anything..."
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
              <UChatPromptSubmit color="neutral" size="sm" />
            </div>
          </template>
        </UChatPrompt>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="q in quickChats"
            :key="q.label"
            size="sm"
            color="neutral"
            variant="outline"
            class="rounded-full"
            :icon="q.icon"
            :label="q.label"
            @click="runSuggestion(q.prompt)"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
useHead({ title: 'AskChadAI - New Chat' })

const router = useRouter()
const chatStore = useChatStore()
const { loadModels } = useChat()
const {
  input,
  images,
  status,
  supportsImages,
  removeImage,
  addFiles,
  handlePaste,
  submit
} = useChatInput()

// Clear any previously selected conversation so submitting from this page
// always creates a new chat instead of appending to the last-viewed one.
chatStore.selectConversation('')

const fileInput = ref<HTMLInputElement>()

const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await addFiles(target.files)
  }
  if (target) target.value = ''
}

const handleSubmit = async () => {
  await submit({
    onNewConversation: (id) => {
      router.replace(`/chat/${id}`)
    }
  })
}

const runSuggestion = async (prompt: string) => {
  input.value = prompt
  await nextTick()
  await handleSubmit()
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const quickChats = [
  { icon: 'i-lucide-sparkles', label: 'Explain a concept', prompt: 'Explain quantum entanglement in simple terms.' },
  { icon: 'i-lucide-code-2', label: 'Write TypeScript', prompt: 'Write a TypeScript utility type that makes all properties optional and nullable.' },
  { icon: 'i-lucide-component', label: 'Vue tip', prompt: 'Share a useful Vue 3 Composition API tip.' },
  { icon: 'i-lucide-line-chart', label: 'Analyze data', prompt: 'How would you approach analyzing a CSV dataset of 1M rows in Python?' },
  { icon: 'i-lucide-sun', label: 'Creative idea', prompt: 'Give me a creative weekend project idea.' }
]

onMounted(async () => {
  await loadModels()
})
</script>
