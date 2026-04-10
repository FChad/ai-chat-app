<template>
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-lg mx-auto space-y-6">

      <!-- Preferences Card -->
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your account settings and notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col divide-y divide-border">
            <!-- Theme -->
            <div class="py-4 first:pt-0 last:pb-0">
              <label class="text-sm font-medium mb-1.5 block" for="theme-select">Theme</label>
              <Select :model-value="colorMode.preference" @update:model-value="colorMode.preference = $event">
                <SelectTrigger id="theme-select" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Default (System)</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Time Format -->
            <div class="py-4 first:pt-0 last:pb-0">
              <label class="text-sm font-medium mb-1.5 block" for="time-format-select">Time Format</label>
              <Select :model-value="chatStore.settings.timeFormat" @update:model-value="chatStore.updateSettings({ timeFormat: $event as '12h' | '24h' })">
                <SelectTrigger id="time-format-select" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24-hour (14:30)</SelectItem>
                  <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Streaming Mode -->
            <div class="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="text-sm font-medium">Streaming Mode</p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Responses are streamed in real-time. Disable to receive complete responses all at once.
                </p>
              </div>
              <Switch :model-value="chatStore.isStreamModeEnabled" @update:model-value="chatStore.updateStreamMode($event)" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Conversations Card -->
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>Export or delete your saved conversations.</CardDescription>
        </CardHeader>
        <CardContent>
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
            <Button variant="outline" @click="exportConversations">
              <Icon name="heroicons:arrow-down-tray" class="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="destructive" @click="showConfirmDialog = true" :disabled="chatStore.conversations.length === 0">
              <Icon name="heroicons:trash" class="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>

    <!-- Confirmation Dialog -->
    <Dialog :open="showConfirmDialog" @update:open="showConfirmDialog = $event">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 flex items-center justify-center bg-destructive/10 rounded-lg shrink-0">
              <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Confirmation</DialogTitle>
              <DialogDescription>Irreversible action</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Do you really want to delete all conversations? This action cannot be undone.
        </p>
        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="outline" @click="showConfirmDialog = false">Cancel</Button>
          <Button variant="destructive" @click="clearAllConversations">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
