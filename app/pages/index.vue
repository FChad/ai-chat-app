<template>
  <div class="flex-1 overflow-y-auto">
    <div class="min-h-full flex flex-col">

      <!-- Hero -->
      <div class="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 text-center">

        <!-- Headline -->
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          AskChadAI
        </h1>
        <p class="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm mb-5">
          Chat with state-of-the-art AI models, free, open-source, no account required.
        </p>

        <!-- Demo notice -->
        <div class="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3.5 py-1.5 text-sm text-yellow-600 dark:text-yellow-400 mb-7">
          <Icon name="heroicons:exclamation-triangle" class="h-3.5 w-3.5 shrink-0" />
          Demo, for demonstration purposes only
        </div>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row items-center gap-3">
          <NuxtLink to="/chat">
            <UButton size="lg" class="w-full sm:w-auto px-6">
              <Icon name="heroicons:chat-bubble-left-right" class="h-4 w-4 mr-2" />
              Start Chatting
            </UButton>
          </NuxtLink>
          <NuxtLink to="/models">
            <UButton variant="outline" size="lg" class="w-full sm:w-auto px-6">
              <Icon name="heroicons:cpu-chip" class="h-4 w-4 mr-2" />
              Browse Models
            </UButton>
          </NuxtLink>
        </div>
      </div>

      <!-- Features -->
      <div class="border-t border-border bg-muted/30 px-4 py-10 sm:py-12">
        <div class="max-w-2xl mx-auto">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-6">
            What's included
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="feature in features" :key="feature.title"
              class="flex flex-col gap-2.5 rounded-xl border border-border bg-background p-4">
              <div class="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg shrink-0">
                <Icon :name="feature.icon" class="h-4 w-4 text-primary" />
              </div>
              <div>
                <p class="text-sm font-semibold leading-snug">{{ feature.title }}</p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'AskChadAI - Home' })

const features = [
  {
    icon: 'heroicons:cpu-chip',
    title: 'Free AI Models',
    description: 'Curated free models via OpenRouter, no API costs.'
  },
  {
    icon: 'heroicons:bolt',
    title: 'Streaming',
    description: 'See responses appear in real-time as they generate.'
  },
  {
    icon: 'heroicons:archive-box',
    title: 'Local History',
    description: 'Conversations saved in your browser, no server needed.'
  },
  {
    icon: 'heroicons:arrow-down-tray',
    title: 'Export',
    description: 'Download all your chats as a JSON file anytime.'
  },
  {
    icon: 'heroicons:photo',
    title: 'Image Input',
    description: 'Attach images for models that support vision.'
  },
  {
    icon: 'heroicons:moon',
    title: 'Dark Mode',
    description: 'Light and dark theme with system preference support.'
  }
]
</script>
