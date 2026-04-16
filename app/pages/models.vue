<template>
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-5xl mx-auto space-y-6">

      <!-- Search + Filters -->
      <div class="space-y-3">
        <!-- Search row -->
        <div class="flex items-center gap-3">
          <div class="relative flex-1 max-w-sm">
            <Icon name="heroicons:magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <UInput v-model="search" placeholder="Search models..." class="pl-9" />
          </div>
          <UBadge variant="secondary" class="text-xs shrink-0">
            {{ filteredModels.length }} model{{ filteredModels.length !== 1 ? 's' : '' }}
          </UBadge>
          <UButton v-if="hasActiveFilters" variant="ghost" size="sm" class="text-xs h-8 px-2 text-muted-foreground"
            @click="clearFilters">
            <Icon name="heroicons:x-mark" class="h-3.5 w-3.5 mr-1" />
            Clear
          </UButton>
        </div>

        <!-- Filter chips row -->
        <div class="flex flex-wrap gap-2 items-center">
          <!-- Family select -->
          <select v-model="selectedFamily"
            class="h-7 text-xs w-auto gap-1.5 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="any">All families</option>
            <option v-for="fam in availableFamilies" :key="fam" :value="fam">{{ fam }}</option>
          </select>

          <!-- Context size -->
          <select v-model="minContext"
            class="h-7 text-xs w-auto gap-1.5 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="any">Any context</option>
            <option value="32k">32K+</option>
            <option value="128k">128K+</option>
            <option value="200k">200K+</option>
            <option value="1m">1M+</option>
          </select>

          <!-- Capability toggles -->
          <button
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors"
            :class="capabilities.includes('vision')
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'"
            @click="toggleCapability('vision')">
            <Icon name="heroicons:eye" class="h-3 w-3" />
            Vision
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors"
            :class="capabilities.includes('tools')
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'"
            @click="toggleCapability('tools')">
            <Icon name="heroicons:wrench-screwdriver" class="h-3 w-3" />
            Tools
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard v-for="n in 6" :key="n">
          <UCardContent class="p-5 space-y-3">
            <USkeleton class="h-5 w-3/4" />
            <USkeleton class="h-3 w-1/2" />
            <USkeleton class="h-12 w-full" />
            <div class="flex gap-2">
              <USkeleton class="h-5 w-16 rounded-full" />
              <USkeleton class="h-5 w-16 rounded-full" />
            </div>
          </UCardContent>
        </UCard>
      </div>

      <!-- Error -->
      <UCard v-else-if="loadError" class="border-destructive/50">
        <UCardContent class="p-6 text-center">
          <Icon name="heroicons:exclamation-triangle" class="h-8 w-8 text-destructive mx-auto mb-3" />
          <p class="text-sm font-medium">Failed to load models</p>
          <p class="text-xs text-muted-foreground mt-1 mb-4">{{ loadError }}</p>
          <UButton variant="outline" size="sm" @click="fetchModels">
            <Icon name="heroicons:arrow-path" class="h-4 w-4 mr-2" />
            Retry
          </UButton>
        </UCardContent>
      </UCard>

      <!-- Empty search result -->
      <div v-else-if="filteredModels.length === 0" class="text-center py-16 text-muted-foreground">
        <Icon name="heroicons:funnel" class="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p class="text-sm font-medium">No models match the current filters</p>
        <UButton variant="ghost" size="sm" class="mt-3" @click="clearFilters">Clear filters</UButton>
      </div>

      <!-- Models grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard v-for="model in filteredModels" :key="model.model"
          class="flex flex-col cursor-pointer transition-colors hover:bg-accent/50" @click="openModel(model)">
          <UCardHeader class="pb-3">
            <div class="flex items-start justify-between gap-2">
              <UCardTitle class="text-sm font-semibold leading-tight line-clamp-2 flex-1">{{ model.name }}</UCardTitle>
              <UBadge class="shrink-0 text-xs capitalize">{{ model.details.family }}</UBadge>
            </div>
            <code class="text-xs text-muted-foreground font-mono truncate block mt-1">{{ model.model }}</code>
          </UCardHeader>
          <UCardContent class="flex-1 pt-0 pb-4 space-y-3">
            <p v-if="model.details.description" class="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {{ model.details.description }}
            </p>
            <div class="flex flex-wrap gap-1.5">
              <UBadge variant="secondary" class="text-xs gap-1">
                <Icon name="heroicons:cpu-chip" class="h-3 w-3" />
                {{ model.details.parameter_size }}
              </UBadge>
              <UBadge variant="outline" class="text-xs gap-1" v-if="model.details.context_length">
                <Icon name="heroicons:document-text" class="h-3 w-3" />
                {{ formatContext(model.details.context_length) }} ctx
              </UBadge>
            </div>
          </UCardContent>
        </UCard>
      </div>

    </div>
  </div>

  <ModelInfoDialog :is-open="showDialog" :model="selectedModel" @close="showDialog = false" />
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'

useHead({ title: 'AskChadAI - Models' })

const { loadModels } = useChat()

const search = ref('')
const models = ref<AIModel[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const selectedModel = ref<AIModel | null>(null)
const showDialog = ref(false)
const selectedFamily = ref('any')
const minContext = ref('any')
const capabilities = ref<string[]>([])

const openModel = (model: AIModel) => {
  selectedModel.value = model
  showDialog.value = true
}

const availableFamilies = computed(() => {
  const seen = new Set<string>()
  for (const m of models.value) {
    if (m.details.family) seen.add(m.details.family)
  }
  return [...seen].sort()
})

const hasActiveFilters = computed(() =>
  search.value.trim() !== '' ||
  selectedFamily.value !== 'any' ||
  minContext.value !== 'any' ||
  capabilities.value.length > 0
)

const clearFilters = () => {
  search.value = ''
  selectedFamily.value = 'any'
  minContext.value = 'any'
  capabilities.value = []
}

const toggleCapability = (cap: string) => {
  const idx = capabilities.value.indexOf(cap)
  if (idx >= 0) capabilities.value.splice(idx, 1)
  else capabilities.value.push(cap)
}

const contextThresholds: Record<string, number> = {
  '32k': 32_000,
  '128k': 128_000,
  '200k': 200_000,
  '1m': 1_000_000,
}

const filteredModels = computed(() => {
  let result = models.value

  const q = search.value.trim().toLowerCase()
  if (q) {
    result = result.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      m.details.family.toLowerCase().includes(q) ||
      m.details.description?.toLowerCase().includes(q)
    )
  }

  if (selectedFamily.value !== 'any') {
    result = result.filter(m => m.details.family === selectedFamily.value)
  }

  if (minContext.value !== 'any') {
    const threshold = contextThresholds[minContext.value]
    result = result.filter(m => (m.details.context_length ?? 0) >= threshold)
  }

  if (capabilities.value.includes('vision')) {
    result = result.filter(m => m.details.architecture?.input_modalities?.includes('image'))
  }

  if (capabilities.value.includes('tools')) {
    result = result.filter(m => m.details.supported_parameters?.includes('tools'))
  }

  return result
})

const formatContext = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

const fetchModels = async () => {
  isLoading.value = true
  loadError.value = null
  try {
    models.value = await loadModels()
  } catch (e: any) {
    loadError.value = e?.message ?? 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchModels)
</script>
