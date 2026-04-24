<template>
  <USelectMenu
    v-model="selected"
    :items="items"
    size="sm"
    variant="ghost"
    value-key="value"
    :search-input="{ placeholder: 'Search models...', icon: 'i-lucide-search' }"
    class="data-[state=open]:bg-elevated"
    :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200', content: 'max-w-sm' }"
  >
    <template #default>
      <span class="truncate">{{ selectedLabel || 'Select model' }}</span>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { DEFAULT_MODEL } from '~/config/constants'

const chatStore = useChatStore()
const selectedModel = useSelectedModel()

const selected = computed({
  get: () => selectedModel.value,
  set: v => { selectedModel.value = v }
})

const items = computed(() =>
  chatStore.availableModels.map(m => ({
    label: m.name,
    value: m.model,
    description: m.details.family
  }))
)

const selectedLabel = computed(() => {
  const m = chatStore.availableModels.find(m => m.model === selected.value)
  return m?.name || selected.value || DEFAULT_MODEL
})
</script>
