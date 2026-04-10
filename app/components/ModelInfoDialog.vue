<template>
    <Sheet :open="isOpen" @update:open="(val: boolean) => { if (!val) closeDialog() }">
        <SheetContent side="right" class="sm:max-w-2xl w-full flex flex-col p-0 gap-0">
            <!-- Fixed Header -->
            <div class="p-6 border-b border-border shrink-0">
                <h2 class="text-xl font-semibold">Model Information</h2>
                <p class="text-sm text-muted-foreground mt-0.5">Details about the current AI model</p>
            </div>

            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto p-6">
                <div v-if="model" class="space-y-6">

                    <!-- Model Header -->
                    <div>
                        <div class="flex items-start justify-between gap-3 mb-2">
                            <h3 class="text-base font-semibold leading-snug">{{ model.name }}</h3>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <Badge>{{ model.details.family }}</Badge>
                                <Badge variant="secondary" class="gap-1">
                                    <Icon name="heroicons:cpu-chip" class="h-3 w-3" />
                                    {{ model.details.parameter_size }}
                                </Badge>
                            </div>
                        </div>
                        <code class="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md border font-mono inline-block break-all">{{ model.model }}</code>
                        <p v-if="model.details.description" class="text-sm text-muted-foreground leading-relaxed mt-3">{{ model.details.description }}</p>
                    </div>

                    <Separator />

                    <!-- Stats grid -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="rounded-lg border bg-card p-3">
                            <p class="text-xs text-muted-foreground mb-1">Context Length</p>
                            <p class="text-xl font-semibold tabular-nums">{{ formatContextLength(model.details.context_length) }}</p>
                            <p class="text-xs text-muted-foreground mt-0.5">max tokens</p>
                        </div>
                        <div v-if="model.details.top_provider?.max_completion_tokens" class="rounded-lg border bg-card p-3">
                            <p class="text-xs text-muted-foreground mb-1">Max Output</p>
                            <p class="text-xl font-semibold tabular-nums">{{ formatNumber(model.details.top_provider.max_completion_tokens) }}</p>
                            <p class="text-xs text-muted-foreground mt-0.5">completion tokens</p>
                        </div>
                        <div class="rounded-lg border bg-card p-3">
                            <p class="text-xs text-muted-foreground mb-1">Format</p>
                            <p class="text-sm font-semibold font-mono">{{ model.details.format }}</p>
                        </div>
                        <div class="rounded-lg border bg-card p-3">
                            <p class="text-xs text-muted-foreground mb-1">Quantization</p>
                            <p class="text-sm font-semibold font-mono">{{ model.details.quantization_level }}</p>
                        </div>
                    </div>

                    <!-- Architecture -->
                    <div v-if="model.details.architecture">
                        <Separator class="mb-4" />
                        <h4 class="text-sm font-medium mb-3">Architecture</h4>
                        <div class="space-y-3">
                            <div>
                                <p class="text-xs text-muted-foreground mb-1.5">Input Modalities</p>
                                <div class="flex flex-wrap gap-1.5">
                                    <Badge v-for="m in model.details.architecture.input_modalities" :key="m" variant="secondary">{{ m }}</Badge>
                                </div>
                            </div>
                            <div>
                                <p class="text-xs text-muted-foreground mb-1.5">Output Modalities</p>
                                <div class="flex flex-wrap gap-1.5">
                                    <Badge v-for="m in model.details.architecture.output_modalities" :key="m" variant="outline">{{ m }}</Badge>
                                </div>
                            </div>
                            <div class="rounded-lg border overflow-hidden">
                                <div class="flex items-center justify-between px-3 py-2 text-xs">
                                    <span class="text-muted-foreground">Tokenizer</span>
                                    <span class="font-mono font-medium">{{ model.details.architecture.tokenizer }}</span>
                                </div>
                                <div v-if="model.details.architecture.instruct_type" class="flex items-center justify-between px-3 py-2 text-xs border-t">
                                    <span class="text-muted-foreground">Instruction Type</span>
                                    <span class="font-mono font-medium">{{ model.details.architecture.instruct_type }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pricing -->
                    <div v-if="model.details.pricing && hasPricing">
                        <Separator class="mb-4" />
                        <h4 class="text-sm font-medium mb-3">Pricing</h4>
                        <div class="rounded-lg border overflow-hidden">
                            <div v-if="model.details.pricing.prompt !== '0'" class="flex items-center justify-between px-3 py-2.5 text-xs odd:bg-muted/40">
                                <span class="text-muted-foreground">Input (per token)</span>
                                <span class="font-mono font-medium">${{ model.details.pricing.prompt }}</span>
                            </div>
                            <div v-if="model.details.pricing.completion !== '0'" class="flex items-center justify-between px-3 py-2.5 text-xs odd:bg-muted/40">
                                <span class="text-muted-foreground">Output (per token)</span>
                                <span class="font-mono font-medium">${{ model.details.pricing.completion }}</span>
                            </div>
                            <div v-if="model.details.pricing.request !== '0'" class="flex items-center justify-between px-3 py-2.5 text-xs odd:bg-muted/40">
                                <span class="text-muted-foreground">Per request</span>
                                <span class="font-mono font-medium">${{ model.details.pricing.request }}</span>
                            </div>
                            <div v-if="model.details.pricing.image !== '0'" class="flex items-center justify-between px-3 py-2.5 text-xs odd:bg-muted/40">
                                <span class="text-muted-foreground">Per image</span>
                                <span class="font-mono font-medium">${{ model.details.pricing.image }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Supported Parameters -->
                    <div v-if="model.details.supported_parameters && model.details.supported_parameters.length > 0">
                        <Separator class="mb-4" />
                        <h4 class="text-sm font-medium mb-3">Supported Parameters</h4>
                        <div class="flex flex-wrap gap-1.5">
                            <Badge v-for="param in model.details.supported_parameters" :key="param"
                                variant="secondary" :title="getParameterDescription(param)">{{ param }}</Badge>
                        </div>
                    </div>

                    <!-- Metadata -->
                    <Separator class="mb-4" />
                    <div class="rounded-lg border overflow-hidden">
                        <div v-if="model.details.canonical_slug" class="flex items-center justify-between px-3 py-2.5 text-xs odd:bg-muted/40">
                            <span class="text-muted-foreground">Canonical Slug</span>
                            <span class="font-mono font-medium">{{ model.details.canonical_slug }}</span>
                        </div>
                        <div class="flex items-center justify-between px-3 py-2.5 text-xs odd:bg-muted/40">
                            <span class="text-muted-foreground">Last updated</span>
                            <span class="font-medium">{{ formatDate(model.modified_at) }}</span>
                        </div>
                        <div v-if="model.details.top_provider?.is_moderated !== undefined" class="flex items-center justify-between px-3 py-2.5 text-xs odd:bg-muted/40">
                            <span class="text-muted-foreground">Content Moderation</span>
                            <span class="font-medium">{{ model.details.top_provider.is_moderated ? 'Enabled' : 'Disabled' }}</span>
                        </div>
                    </div>

                </div>

                <div v-else class="flex flex-col items-center justify-center py-20">
                    <Icon name="heroicons:exclamation-triangle" class="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p class="text-sm text-muted-foreground">Model information could not be loaded</p>
                </div>
            </div>

            <!-- Fixed Footer -->
            <div class="p-4 border-t border-border shrink-0">
                <Button variant="outline" @click="closeDialog" class="w-full">Close</Button>
            </div>
        </SheetContent>
    </Sheet>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'
import { Separator } from '@/components/ui/separator'

interface Props {
    isOpen: boolean
    model: AIModel | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'close': []
}>()

const closeDialog = () => {
    emit('close')
}

// Check if model has pricing information (any non-zero price)
const hasPricing = computed(() => {
    if (!props.model?.details.pricing) return false
    const pricing = props.model.details.pricing
    return pricing.prompt !== '0' || pricing.completion !== '0' ||
        pricing.request !== '0' || pricing.image !== '0'
})

// Parameter descriptions for tooltips
const parameterDescriptions: Record<string, string> = {
    'tools': 'Function calling capabilities',
    'tool_choice': 'Tool selection control',
    'max_tokens': 'Response length limiting',
    'temperature': 'Randomness control',
    'top_p': 'Nucleus sampling',
    'reasoning': 'Internal reasoning mode',
    'include_reasoning': 'Include reasoning in response',
    'structured_outputs': 'JSON schema enforcement',
    'response_format': 'Output format specification',
    'stop': 'Custom stop sequences',
    'frequency_penalty': 'Repetition reduction',
    'presence_penalty': 'Topic diversity',
    'seed': 'Deterministic outputs'
}

const getParameterDescription = (param: string): string => {
    return parameterDescriptions[param] || param
}

// Helper functions
const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatContextLength = (length?: number): string => {
    if (!length) return 'N/A'
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`
    return length.toString()
}

const formatNumber = (num?: number): string => {
    if (!num) return 'N/A'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
}
</script>
