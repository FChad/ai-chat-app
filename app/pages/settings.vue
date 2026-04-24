<template>
  <UDashboardPanel id="settings">
    <template #header>
      <Navbar>
        <span class="font-medium">Settings</span>
      </Navbar>
    </template>

    <template #body>
      <UContainer class="py-6 flex flex-col gap-6 max-w-2xl">
        <!-- Preferences -->
        <section class="ring ring-default rounded-lg bg-default p-6 flex flex-col gap-4">
          <header>
            <h2 class="text-base font-semibold text-highlighted">Preferences</h2>
            <p class="text-sm text-muted">Customize the app to your liking.</p>
          </header>

          <USeparator />

          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-highlighted">Theme</p>
              <p class="text-xs text-muted">Light, dark, or match your system.</p>
            </div>
            <USelectMenu
              :model-value="colorMode.preference"
              :items="themeItems"
              value-key="value"
              size="sm"
              class="w-40"
              @update:model-value="colorMode.preference = $event"
            />
          </div>

          <USeparator />

          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-highlighted">Time Format</p>
              <p class="text-xs text-muted">Display of timestamps across the app.</p>
            </div>
            <USelectMenu
              :model-value="chatStore.settings.timeFormat"
              :items="timeFormatItems"
              value-key="value"
              size="sm"
              class="w-40"
              @update:model-value="chatStore.updateSettings({ timeFormat: $event as '12h' | '24h' })"
            />
          </div>
        </section>

        <!-- Conversations -->
        <section class="ring ring-default rounded-lg bg-default p-6 flex flex-col gap-4">
          <header>
            <h2 class="text-base font-semibold text-highlighted">Conversations</h2>
            <p class="text-sm text-muted">Export or delete your saved conversations.</p>
          </header>

          <USeparator />

          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{{ chatStore.conversations.length }}</div>
              <div class="text-xs text-muted font-medium">Saved Conversations</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{{ totalMessages }}</div>
              <div class="text-xs text-muted font-medium">Total Messages</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-download"
              label="Export"
              block
              @click="exportConversations"
            />
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              label="Delete All"
              :disabled="chatStore.conversations.length === 0"
              block
              @click="confirmDeleteAll"
            />
          </div>
        </section>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import ModalConfirm from '~/components/ModalConfirm.vue'

useHead({ title: 'AskChadAI - Settings' })

const chatStore = useChatStore()
const colorMode = useColorMode()
const toast = useToast()
const overlay = useOverlay()

const themeItems = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' }
]

const timeFormatItems = [
  { label: '24-hour (14:30)', value: '24h' },
  { label: '12-hour (2:30 PM)', value: '12h' }
]

const totalMessages = computed(() =>
  chatStore.conversations.reduce((total, c) => total + c.messages.length, 0)
)

const confirmDeleteAll = async () => {
  const modal = overlay.create(ModalConfirm, {
    props: {
      title: 'Delete all conversations?',
      description: 'This action cannot be undone. All saved conversations will be permanently removed.',
      confirmLabel: 'Delete all',
      destructive: true
    }
  })
  const instance = modal.open()
  const confirmed = await instance.result
  if (confirmed) {
    chatStore.clearAllConversations()
    toast.add({ color: 'success', title: 'All conversations deleted' })
  }
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
    toast.add({ color: 'success', title: 'Export complete' })
  } catch (error: any) {
    toast.add({ color: 'error', title: 'Export failed', description: error?.message })
  }
}
</script>
