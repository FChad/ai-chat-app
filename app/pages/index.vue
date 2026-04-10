<template>
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-2xl mx-auto space-y-8">

      <!-- Hero -->
      <div class="text-center space-y-3 pt-4">
        <div class="w-16 h-16 flex items-center justify-center bg-primary text-primary-foreground rounded-2xl mx-auto">
          <Icon name="heroicons:chat-bubble-left-right" class="h-8 w-8" />
        </div>
        <h1 class="text-3xl font-bold tracking-tight">AskChadAI</h1>
        <p class="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
          A free, open-source AI chat assistant powered by OpenRouter. Chat with state-of-the-art language models — no account required.
        </p>
        <div class="flex items-center justify-center gap-3 pt-2">
          <Button as-child size="lg">
            <NuxtLink to="/chat">
              <Icon name="heroicons:chat-bubble-left-right" class="h-4 w-4 mr-2" />
              Start Chatting
            </NuxtLink>
          </Button>
          <Button variant="outline" as-child size="lg">
            <NuxtLink to="/models">
              <Icon name="heroicons:cpu-chip" class="h-4 w-4 mr-2" />
              Browse Models
            </NuxtLink>
          </Button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4">
        <Card>
          <CardContent class="p-5 text-center">
            <div class="text-3xl font-bold text-primary">{{ chatStore.conversations.length }}</div>
            <div class="text-sm text-muted-foreground mt-1 font-medium">Saved Conversations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-5 text-center">
            <div class="text-3xl font-bold text-primary">{{ totalMessages }}</div>
            <div class="text-sm text-muted-foreground mt-1 font-medium">Total Messages</div>
          </CardContent>
        </Card>
      </div>

      <!-- Features -->
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Everything included, nothing to pay.</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="feature in features" :key="feature.title" class="flex items-start gap-3">
              <div class="w-9 h-9 flex items-center justify-center bg-primary/10 rounded-lg shrink-0 mt-0.5">
                <Icon :name="feature.icon" class="h-4 w-4 text-primary" />
              </div>
              <div>
                <p class="text-sm font-semibold">{{ feature.title }}</p>
                <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Quick Links -->
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="outline" class="justify-start h-auto py-3 px-4" as-child>
            <NuxtLink to="/chat">
              <Icon name="heroicons:chat-bubble-left-right" class="h-4 w-4 mr-2 shrink-0" />
              <span class="text-sm font-medium">Open Chat</span>
            </NuxtLink>
          </Button>
          <Button variant="outline" class="justify-start h-auto py-3 px-4" as-child>
            <NuxtLink to="/models">
              <Icon name="heroicons:cpu-chip" class="h-4 w-4 mr-2 shrink-0" />
              <span class="text-sm font-medium">Browse Models</span>
            </NuxtLink>
          </Button>
          <Button variant="outline" class="justify-start h-auto py-3 px-4" as-child>
            <NuxtLink to="/settings">
              <Icon name="heroicons:cog-6-tooth" class="h-4 w-4 mr-2 shrink-0" />
              <span class="text-sm font-medium">Settings</span>
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>

    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Home — AskChadAI' })

const chatStore = useChatStore()

const totalMessages = computed(() =>
  chatStore.conversations.reduce((sum, c) => sum + c.messages.length, 0)
)

const features = [
  {
    icon: 'heroicons:cpu-chip',
    title: 'Free AI Models',
    description: 'Access a curated list of free, state-of-the-art language models via OpenRouter — no API costs.'
  },
  {
    icon: 'heroicons:bolt',
    title: 'Streaming Responses',
    description: 'Responses stream in real-time so you see the answer as it generates, not all at once.'
  },
  {
    icon: 'heroicons:archive-box',
    title: 'Conversation History',
    description: 'All your conversations are saved locally in the browser — no account or server storage needed.'
  },
  {
    icon: 'heroicons:arrow-down-tray',
    title: 'Export Conversations',
    description: 'Export all your conversations to a JSON file for backup or offline use at any time.'
  },
  {
    icon: 'heroicons:photo',
    title: 'Image Support',
    description: 'Attach images to your messages for models that support vision input.'
  },
  {
    icon: 'heroicons:moon',
    title: 'Dark Mode',
    description: 'Full light and dark mode support that respects your system preference.'
  }
]
</script>
