<template>
  <USlideover
    :open="isOpen"
    :title="model?.name || 'Model Information'"
    description="Details about this AI model"
    side="right"
    :ui="{ content: 'w-full max-w-2xl' }"
    @update:open="(val) => { if (!val) emit('close') }"
  >
    <template #body>
      <div v-if="model" class="flex flex-col gap-6">
        <!-- Header -->
        <div>
          <div class="flex items-start justify-between gap-3 mb-2">
            <h3 class="text-base font-semibold leading-snug text-highlighted">{{ model.name }}</h3>
            <div class="flex items-center gap-1.5 shrink-0">
              <UBadge color="primary" variant="soft">{{ model.details.family }}</UBadge>
              <UBadge color="neutral" variant="outline" icon="i-lucide-cpu">
                {{ model.details.parameter_size }}
              </UBadge>
            </div>
          </div>
          <UKbd class="font-mono break-all whitespace-normal">{{ model.model }}</UKbd>
          <p v-if="model.details.description" class="text-sm text-muted leading-relaxed mt-3">
            {{ model.details.description }}
          </p>
        </div>

        <USeparator />

        <!-- Stats grid -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg ring ring-default bg-elevated/40 p-3">
            <p class="text-xs text-muted mb-1">Context Length</p>
            <p class="text-xl font-semibold tabular-nums text-highlighted">{{ formatContextLength(model.details.context_length) }}</p>
            <p class="text-xs text-muted mt-0.5">max tokens</p>
          </div>
          <div v-if="model.details.top_provider?.max_completion_tokens" class="rounded-lg ring ring-default bg-elevated/40 p-3">
            <p class="text-xs text-muted mb-1">Max Output</p>
            <p class="text-xl font-semibold tabular-nums text-highlighted">{{ formatNumber(model.details.top_provider.max_completion_tokens) }}</p>
            <p class="text-xs text-muted mt-0.5">completion tokens</p>
          </div>
          <div class="rounded-lg ring ring-default bg-elevated/40 p-3">
            <p class="text-xs text-muted mb-1">Format</p>
            <p class="text-sm font-semibold font-mono text-highlighted">{{ model.details.format }}</p>
          </div>
          <div class="rounded-lg ring ring-default bg-elevated/40 p-3">
            <p class="text-xs text-muted mb-1">Quantization</p>
            <p class="text-sm font-semibold font-mono text-highlighted">{{ model.details.quantization_level }}</p>
          </div>
        </div>

        <!-- Architecture -->
        <div v-if="model.details.architecture">
          <USeparator class="mb-4" />
          <h4 class="text-sm font-medium mb-3 text-highlighted">Architecture</h4>
          <div class="flex flex-col gap-3">
            <div>
              <p class="text-xs text-muted mb-1.5">Input Modalities</p>
              <div class="flex flex-wrap gap-1.5">
                <UBadge v-for="m in model.details.architecture.input_modalities" :key="m" color="primary" variant="soft">{{ m }}</UBadge>
              </div>
            </div>
            <div>
              <p class="text-xs text-muted mb-1.5">Output Modalities</p>
              <div class="flex flex-wrap gap-1.5">
                <UBadge v-for="m in model.details.architecture.output_modalities" :key="m" color="neutral" variant="outline">{{ m }}</UBadge>
              </div>
            </div>
            <div class="rounded-lg ring ring-default overflow-hidden">
              <div class="flex items-center justify-between px-3 py-2 text-xs">
                <span class="text-muted">Tokenizer</span>
                <span class="font-mono font-medium text-highlighted">{{ model.details.architecture.tokenizer }}</span>
              </div>
              <div v-if="model.details.architecture.instruct_type" class="flex items-center justify-between px-3 py-2 text-xs border-t border-default">
                <span class="text-muted">Instruction Type</span>
                <span class="font-mono font-medium text-highlighted">{{ model.details.architecture.instruct_type }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pricing -->
        <div v-if="hasPricing">
          <USeparator class="mb-4" />
          <h4 class="text-sm font-medium mb-3 text-highlighted">Pricing</h4>
          <div class="rounded-lg ring ring-default overflow-hidden divide-y divide-default">
            <div v-if="model.details.pricing?.prompt && model.details.pricing.prompt !== '0'" class="flex items-center justify-between px-3 py-2.5 text-xs">
              <span class="text-muted">Input (per token)</span>
              <span class="font-mono font-medium text-highlighted">${{ model.details.pricing.prompt }}</span>
            </div>
            <div v-if="model.details.pricing?.completion && model.details.pricing.completion !== '0'" class="flex items-center justify-between px-3 py-2.5 text-xs">
              <span class="text-muted">Output (per token)</span>
              <span class="font-mono font-medium text-highlighted">${{ model.details.pricing.completion }}</span>
            </div>
            <div v-if="model.details.pricing?.request && model.details.pricing.request !== '0'" class="flex items-center justify-between px-3 py-2.5 text-xs">
              <span class="text-muted">Per request</span>
              <span class="font-mono font-medium text-highlighted">${{ model.details.pricing.request }}</span>
            </div>
            <div v-if="model.details.pricing?.image && model.details.pricing.image !== '0'" class="flex items-center justify-between px-3 py-2.5 text-xs">
              <span class="text-muted">Per image</span>
              <span class="font-mono font-medium text-highlighted">${{ model.details.pricing.image }}</span>
            </div>
          </div>
        </div>

        <!-- Supported parameters -->
        <div v-if="model.details.supported_parameters?.length">
          <USeparator class="mb-4" />
          <h4 class="text-sm font-medium mb-3 text-highlighted">Supported Parameters</h4>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="param in model.details.supported_parameters"
              :key="param"
              color="neutral"
              variant="soft"
              :title="getParameterDescription(param)"
            >
              {{ param }}
            </UBadge>
          </div>
        </div>

        <!-- Metadata -->
        <USeparator />
        <div class="rounded-lg ring ring-default overflow-hidden divide-y divide-default">
          <div v-if="model.details.canonical_slug" class="flex items-center justify-between px-3 py-2.5 text-xs">
            <span class="text-muted">Canonical Slug</span>
            <span class="font-mono font-medium text-highlighted">{{ model.details.canonical_slug }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2.5 text-xs">
            <span class="text-muted">Last updated</span>
            <span class="font-medium text-highlighted">{{ formatDate(model.modified_at) }}</span>
          </div>
          <div v-if="model.details.top_provider?.is_moderated !== undefined" class="flex items-center justify-between px-3 py-2.5 text-xs">
            <span class="text-muted">Content Moderation</span>
            <span class="font-medium text-highlighted">{{ model.details.top_provider.is_moderated ? 'Enabled' : 'Disabled' }}</span>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'

const props = defineProps<{
  isOpen: boolean
  model: AIModel | null
}>()

const emit = defineEmits<{ close: [] }>()

const hasPricing = computed(() => {
  const p = props.model?.details.pricing
  if (!p) return false
  return (p.prompt && p.prompt !== '0') || (p.completion && p.completion !== '0')
    || (p.request && p.request !== '0') || (p.image && p.image !== '0')
})

const parameterDescriptions: Record<string, string> = {
  tools: 'Function calling capabilities',
  tool_choice: 'Tool selection control',
  max_tokens: 'Response length limiting',
  temperature: 'Randomness control',
  top_p: 'Nucleus sampling',
  reasoning: 'Internal reasoning mode',
  include_reasoning: 'Include reasoning in response',
  structured_outputs: 'JSON schema enforcement',
  response_format: 'Output format specification',
  stop: 'Custom stop sequences',
  frequency_penalty: 'Repetition reduction',
  presence_penalty: 'Topic diversity',
  seed: 'Deterministic outputs'
}

const getParameterDescription = (p: string) => parameterDescriptions[p] || p

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

const formatContextLength = (n?: number): string => {
  if (!n) return 'N/A'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

const formatNumber = (n?: number): string => {
  if (!n) return 'N/A'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
</script>
