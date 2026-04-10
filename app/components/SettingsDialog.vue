<template>
  <!-- Settings Sheet -->
  <Sheet :open="isOpen" @update:open="(val: boolean) => { if (!val) closeDialog() }">
    <SheetContent side="right" class="sm:max-w-lg w-full flex flex-col p-0 gap-0">
      <!-- Fixed Header -->
      <div class="p-6 border-b border-border flex-shrink-0">
        <h2 class="text-xl font-semibold">Settings</h2>
        <p class="text-sm text-muted-foreground mt-0.5">Customize your chat experience</p>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-6">
          <!-- App Settings Section -->
          <div>
            <h3 class="text-lg font-semibold mb-4 flex items-center space-x-3">
              <div class="w-6 h-6 flex items-center justify-center bg-primary/10 rounded-lg">
                <Icon name="heroicons:adjustments-horizontal" class="h-4 w-4 text-primary" />
              </div>
              <span>App Settings</span>
            </h3>

            <div class="space-y-4">
              <!-- Theme Toggle -->
              <Card>
                <CardContent class="p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3 mb-2">
                        <div class="w-6 h-6 flex items-center justify-center bg-primary/10 rounded-lg">
                          <Icon name="heroicons:moon" class="h-4 w-4 text-primary" />
                        </div>
                        <span class="text-sm font-semibold">Design Mode</span>
                      </div>
                      <p class="text-xs text-muted-foreground leading-relaxed">
                        Choose between light, dark, or automatic mode based on your system settings.
                      </p>
                    </div>
                    <div class="ml-4">
                      <ThemeToggle />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <!-- Stream Mode Toggle -->
              <Card>
                <CardContent class="p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3 mb-2">
                        <div class="w-6 h-6 flex items-center justify-center bg-primary/10 rounded-lg">
                          <Icon name="heroicons:play" class="h-4 w-4 text-primary" />
                        </div>
                        <span class="text-sm font-semibold">Streaming Mode</span>
                      </div>
                      <p class="text-xs text-muted-foreground leading-relaxed">
                        Responses are streamed in real-time. Disable this option
                        to receive complete responses all at once.
                      </p>
                    </div>
                    <div class="ml-4">
                      <Switch :checked="chatStore.isStreamModeEnabled" @update:checked="toggleStreamMode" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <!-- Conversations Section -->
          <div>
            <h3 class="text-lg font-semibold mb-4 flex items-center space-x-3">
              <div class="w-6 h-6 flex items-center justify-center bg-primary/10 rounded-lg">
                <Icon name="heroicons:chat-bubble-left-right" class="h-4 w-4 text-primary" />
              </div>
              <span>Conversations</span>
            </h3>

            <div class="space-y-4">
              <!-- Conversation Stats -->
              <Card>
                <CardContent class="p-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold text-primary">
                        {{ chatStore.conversations.length }}
                      </div>
                      <div class="text-xs text-muted-foreground font-medium">
                        Saved Conversations
                      </div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold text-primary">
                        {{ totalMessages }}
                      </div>
                      <div class="text-xs text-muted-foreground font-medium">
                        Total Messages
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <!-- Action Buttons -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button @click="exportConversations">
                  <Icon name="heroicons:arrow-down-tray" class="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="destructive" @click="confirmClearAll" :disabled="chatStore.conversations.length === 0">
                  <Icon name="heroicons:trash" class="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed Footer -->
      <div class="p-4 border-t border-border flex-shrink-0">
        <Button variant="outline" @click="closeDialog" class="w-full">Close</Button>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Confirmation Dialog (stays as Dialog - small confirm prompt is correct use case) -->
  <Dialog :open="showConfirmDialog" @update:open="showConfirmDialog = $event">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 flex items-center justify-center bg-destructive/10 rounded-lg flex-shrink-0">
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

const toggleStreamMode = (checked: boolean) => {
  chatStore.updateStreamMode(checked)
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
