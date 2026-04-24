<template>
  <UDashboardPanel id="models">
    <template #header>
      <Navbar>
        <span class="font-medium">Models</span>
      </Navbar>
    </template>

    <template #body>
      <UContainer class="py-6 flex flex-col gap-6">
        <!-- Search + Filters -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3 flex-wrap">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Search models..."
              class="flex-1 max-w-sm"
              size="md"
            />
            <UBadge color="neutral" variant="subtle" class="shrink-0">
              {{ filteredModels.length }} model{{ filteredModels.length !== 1 ? 's' : '' }}
            </UBadge>
            <UButton
              v-if="hasActiveFilters"
              variant="ghost"
              size="sm"
              color="neutral"
              icon="i-lucide-x"
              label="Clear"
              @click="clearFilters"
            />
          </div>

          <div class="flex flex-wrap gap-2 items-center">
            <USelectMenu
              v-model="selectedFamily"
              :items="familyItems"
              size="sm"
              value-key="value"
              class="min-w-40"
            />

            <USelectMenu
              v-model="minContext"
              :items="contextItems"
              size="sm"
              value-key="value"
              class="min-w-40"
            />

            <UButton
              :color="capabilities.includes('vision') ? 'primary' : 'neutral'"
              :variant="capabilities.includes('vision') ? 'soft' : 'outline'"
              size="sm"
              icon="i-lucide-eye"
              label="Vision"
              @click="toggleCapability('vision')"
            />
            <UButton
              :color="capabilities.includes('tools') ? 'primary' : 'neutral'"
              :variant="capabilities.includes('tools') ? 'soft' : 'outline'"
              size="sm"
              icon="i-lucide-wrench"
              label="Tools"
              @click="toggleCapability('tools')"
            />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="n in 6" :key="n" class="ring ring-default rounded-lg bg-default p-5 flex flex-col gap-3">
            <USkeleton class="h-5 w-3/4" />
            <USkeleton class="h-3 w-1/2" />
            <USkeleton class="h-12 w-full" />
            <div class="flex gap-2">
              <USkeleton class="h-5 w-16 rounded-full" />
              <USkeleton class="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>

        <!-- Error -->
        <UAlert
          v-else-if="loadError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Failed to load models"
          :description="loadError"
          :actions="[{ label: 'Retry', color: 'error', variant: 'solid', onClick: fetchModels }]"
        />

        <!-- Empty -->
        <div v-else-if="filteredModels.length === 0" class="text-center py-16 text-muted">
          <UIcon name="i-lucide-filter" class="size-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm font-medium">No models match the current filters</p>
          <UButton variant="ghost" size="sm" color="neutral" class="mt-3" label="Clear filters" @click="clearFilters" />
        </div>

        <!-- Models grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="model in filteredModels"
            :key="model.model"
            class="text-left ring ring-default rounded-lg bg-default p-5 flex flex-col gap-3 transition-colors hover:bg-elevated/50 hover:ring-accented cursor-pointer"
            @click="openModel(model)"
          >
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-sm font-semibold leading-tight line-clamp-2 flex-1 text-highlighted">
                {{ model.name }}
              </h3>
              <UBadge color="primary" variant="soft" class="shrink-0 text-xs capitalize">{{ model.details.family }}</UBadge>
            </div>
            <code class="text-xs text-muted font-mono truncate block">{{ model.model }}</code>
            <p v-if="model.details.description" class="text-xs text-muted leading-relaxed line-clamp-3">
              {{ model.details.description }}
            </p>
            <div class="flex flex-wrap gap-1.5 mt-auto">
              <UBadge color="neutral" variant="soft" icon="i-lucide-cpu">
                {{ model.details.parameter_size }}
              </UBadge>
              <UBadge v-if="model.details.context_length" color="neutral" variant="outline" icon="i-lucide-file-text">
                {{ formatContext(model.details.context_length) }} ctx
              </UBadge>
            </div>
          </button>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>

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
const selectedFamily = ref<string>('any')
const minContext = ref<string>('any')
const capabilities = ref<string[]>([])

const openModel = (m: AIModel) => {
  selectedModel.value = m
  showDialog.value = true
}

const availableFamilies = computed(() => {
  const seen = new Set<string>()
  for (const m of models.value) if (m.details.family) seen.add(m.details.family)
  return [...seen].sort()
})

const familyItems = computed(() => [
  { label: 'All families', value: 'any' },
  ...availableFamilies.value.map(f => ({ label: f, value: f }))
])

const contextItems = [
  { label: 'Any context', value: 'any' },
  { label: '32K+', value: '32k' },
  { label: '128K+', value: '128k' },
  { label: '200K+', value: '200k' },
  { label: '1M+', value: '1m' }
]

const hasActiveFilters = computed(() =>
  search.value.trim() !== ''
  || selectedFamily.value !== 'any'
  || minContext.value !== 'any'
  || capabilities.value.length > 0
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
  '1m': 1_000_000
}

const filteredModels = computed(() => {
  let result = models.value

  const q = search.value.trim().toLowerCase()
  if (q) {
    result = result.filter(m =>
      m.name.toLowerCase().includes(q)
      || m.model.toLowerCase().includes(q)
      || m.details.family.toLowerCase().includes(q)
      || m.details.description?.toLowerCase().includes(q)
    )
  }

  if (selectedFamily.value !== 'any') {
    result = result.filter(m => m.details.family === selectedFamily.value)
  }

  if (minContext.value !== 'any') {
    const threshold = contextThresholds[minContext.value] ?? 0
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
