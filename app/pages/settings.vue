<template>
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-lg mx-auto space-y-6">

      <!-- Preferences Card -->
      <UCard>
        <UCardHeader>
          <UCardTitle>Preferences</UCardTitle>
          <UCardDescription>Manage your account settings and notifications.</UCardDescription>
        </UCardHeader>
        <UCardContent class="pt-0">
          <div class="flex flex-col divide-y divide-border">
            <!-- Theme -->
            <div class="py-4 first:pt-0 last:pb-0">
              <label class="text-sm font-medium mb-1.5 block" for="theme-select">Theme</label>
              <select id="theme-select" :value="colorMode.preference"
                @change="colorMode.preference = ($event.target as HTMLSelectElement).value"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="system">Default (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <!-- Time Format -->
            <div class="py-4 first:pt-0 last:pb-0">
              <label class="text-sm font-medium mb-1.5 block" for="time-format-select">Time Format</label>
              <select id="time-format-select" :value="chatStore.settings.timeFormat"
                @change="chatStore.updateSettings({ timeFormat: ($event.target as HTMLSelectElement).value as '12h' | '24h' })"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="24h">24-hour (14:30)</option>
                <option value="12h">12-hour (2:30 PM)</option>
              </select>
            </div>

            <!-- Streaming Mode -->
            <div class="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="text-sm font-medium">Streaming Mode</p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Responses are streamed in real-time. Disable to receive complete responses all at once.
                </p>
              </div>
              <USwitch :model-value="chatStore.isStreamModeEnabled"
                @update:model-value="chatStore.updateStreamMode($event)" />
            </div>
          </div>
        </UCardContent>
      </UCard>

      <!-- Conversations Card -->
      <UCard>
        <UCardHeader>
          <UCardTitle>Conversations</UCardTitle>
          <UCardDescription>Export or delete your saved conversations.</UCardDescription>
        </UCardHeader>
        <UCardContent class="pt-0">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{{ chatStore.conversations.length }}</div>
              <div class="text-xs text-muted-foreground font-medium">Saved Conversations</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{{ totalMessages }}</div>
              <div class="text-xs text-muted-foreground font-medium">Total Messages</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <UButton variant="outline" @click="exportConversations">
              <Icon name="heroicons:arrow-down-tray" class="h-4 w-4 mr-2" />
              Export
            </UButton>
            <UButton variant="destructive" @click="showConfirmDialog = true"
              :disabled="chatStore.conversations.length === 0">
              <Icon name="heroicons:trash" class="h-4 w-4 mr-2" />
              Delete All
            </UButton>
          </div>
        </UCardContent>
      </UCard>

    </div>

    <!-- Confirmation Dialog -->
    <UDialog :open="showConfirmDialog" @update:open="showConfirmDialog = $event" class="max-w-sm">
      <div class="flex flex-col gap-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 flex items-center justify-center bg-destructive/10 rounded-lg shrink-0">
            <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 class="text-lg font-semibold">Confirmation</h3>
            <p class="text-sm text-muted-foreground">Irreversible action</p>
          </div>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Do you really want to delete all conversations? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="showConfirmDialog = false">Cancel</UButton>
          <UButton variant="destructive" @click="clearAllConversations">Delete</UButton>
        </div>
      </div>
    </UDialog>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'AskChadAI - Settings' })

const chatStore = useChatStore()
const colorMode = useColorMode()
const showConfirmDialog = ref(false)

const totalMessages = computed(() =>
  chatStore.conversations.reduce((total, conv) => total + conv.messages.length, 0)
)

const clearAllConversations = () => {
  chatStore.clearAllConversations()
  showConfirmDialog.value = false
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
  }
}
</script>
