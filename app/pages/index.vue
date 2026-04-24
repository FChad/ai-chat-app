<template>
  <UDashboardPanel id="home">
    <template #header>
      <Navbar>
        <span class="font-medium">Home</span>
      </Navbar>
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col">
        <!-- Hero -->
        <div class="flex-1 flex flex-col items-center justify-center py-12 sm:py-20 text-center gap-6">
          <UBadge
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            size="md"
            class="rounded-full"
          >
            Demo, for demonstration purposes only
          </UBadge>

          <h1 class="text-4xl sm:text-6xl font-bold tracking-tight text-highlighted">
            AskChadAI
          </h1>
          <p class="text-muted text-base sm:text-lg leading-relaxed max-w-xl">
            Chat with state-of-the-art AI models — free, open source, no account required.
          </p>

          <div class="flex flex-col sm:flex-row items-center gap-3">
            <UButton
              to="/chat/new"
              size="xl"
              color="primary"
              icon="i-lucide-sparkles"
              label="Start chatting"
            />
            <UButton
              to="/models"
              size="xl"
              color="neutral"
              variant="outline"
              icon="i-lucide-cpu"
              label="Browse models"
            />
          </div>
        </div>

        <!-- Features -->
        <div class="border-t border-default py-12 sm:py-16">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted text-center mb-8">
            What's included
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            <div
              v-for="f in features"
              :key="f.title"
              class="flex flex-col gap-3 rounded-xl ring ring-default bg-elevated/40 p-5"
            >
              <div class="size-9 flex items-center justify-center bg-primary/10 rounded-lg shrink-0">
                <UIcon :name="f.icon" class="size-4.5 text-primary" />
              </div>
              <div>
                <p class="text-sm font-semibold leading-snug text-highlighted">{{ f.title }}</p>
                <p class="text-xs text-muted mt-1 leading-relaxed">{{ f.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
useHead({ title: 'AskChadAI - Home' })

const features = [
  { icon: 'i-lucide-cpu', title: 'Free AI Models', description: 'Curated free models via OpenRouter, no API costs.' },
  { icon: 'i-lucide-zap', title: 'Streaming', description: 'Responses appear in real-time as they generate.' },
  { icon: 'i-lucide-archive', title: 'Local History', description: 'Conversations saved in your browser, no server needed.' },
  { icon: 'i-lucide-download', title: 'Export', description: 'Download all your chats as a JSON file anytime.' },
  { icon: 'i-lucide-image', title: 'Image Input', description: 'Attach images for models that support vision.' },
  { icon: 'i-lucide-moon', title: 'Dark Mode', description: 'Light and dark themes with system preference support.' }
]
</script>
