<template>
  <USelectMenu
    v-model="selected"
    :items="items"
    size="sm"
    variant="ghost"
    value-key="value"
    :search-input="{ placeholder: 'Search models...', icon: 'i-lucide-search' }"
    class="data-[state=open]:bg-elevated"
    :ui="{
      trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
      // Let the popover expand to fit the longest item (instead of being clamped
      // to the trigger width via the default `w-(--reka-combobox-trigger-width)`),
      // while capping it so it never overflows the viewport.
      content: 'min-w-(--reka-combobox-trigger-width) w-fit max-w-[min(32rem,calc(100vw-1rem))]'
    }"
  >
    <template #default>
      <span class="truncate">{{ selectedLabel || 'Select model' }}</span>
    </template>
    <template #item-label="{ item }">
      <span :title="item.label">{{ item.label }}</span>
    </template>
    <template #item-description="{ item }">
      <span :title="item.description">{{ item.description }}</span>
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
