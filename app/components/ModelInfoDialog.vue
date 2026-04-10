<template>
    <Sheet :open="isOpen" @update:open="(val: boolean) => { if (!val) closeDialog() }">
        <SheetContent side="right" class="sm:max-w-2xl w-full flex flex-col p-0 gap-0">
            <!-- Fixed Header -->
            <div class="p-6 border-b border-border flex-shrink-0">
                <h2 class="text-xl font-semibold">Model Information</h2>
                <p class="text-sm text-muted-foreground mt-0.5">Details about the current AI model</p>
            </div>

            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto p-6">
                <div v-if="model" class="space-y-6">
                    <!-- Model Header -->
                    <Card class="border-2 border-primary/20 bg-primary/5">
                        <CardContent class="p-5">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex-1">
                                    <h3 class="text-2xl font-bold mb-2">{{ model.name }}</h3>
                                    <code
                                        class="text-xs px-3 py-1.5 bg-card text-muted-foreground rounded-md border font-mono inline-block break-all">
                                        {{ model.model }}
                                    </code>
                                </div>
                                <div class="flex flex-col gap-2 items-end ml-4 flex-shrink-0">
                                    <Badge>{{ model.details.family }}</Badge>
                                    <Badge variant="secondary">
                                        <Icon name="heroicons:cpu-chip" class="h-4 w-4 mr-1.5" />
                                        {{ model.details.parameter_size }}
                                    </Badge>
                                </div>
                            </div>

                            <div v-if="model.details.description" class="mt-4 pt-4 border-t border-primary/20">
                                <p class="text-sm text-muted-foreground leading-relaxed">{{ model.details.description }}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Technical Details -->
                    <div class="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent class="p-4">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
                                        <Icon name="heroicons:document-text" class="h-4 w-4 text-primary" />
                                    </div>
                                    <h4 class="text-sm font-semibold text-muted-foreground">Context Length</h4>
                                </div>
                                <p class="text-2xl font-bold">{{ formatContextLength(model.details.context_length) }}
                                </p>
                                <p class="text-xs text-muted-foreground mt-1">Maximum token count</p>
                            </CardContent>
                        </Card>

                        <Card v-if="model.details.top_provider?.max_completion_tokens">
                            <CardContent class="p-4">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
                                        <Icon name="heroicons:arrow-up-tray" class="h-4 w-4 text-primary" />
                                    </div>
                                    <h4 class="text-sm font-semibold text-muted-foreground">Maximum Output</h4>
                                </div>
                                <p class="text-2xl font-bold">{{
                                    formatNumber(model.details.top_provider.max_completion_tokens) }}</p>
                                <p class="text-xs text-muted-foreground mt-1">Max completion tokens</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent class="p-4">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
                                        <Icon name="heroicons:cube" class="h-4 w-4 text-primary" />
                                    </div>
                                    <h4 class="text-sm font-semibold text-muted-foreground">Format</h4>
                                </div>
                                <p class="text-lg font-bold">{{ model.details.format }}</p>
                                <p class="text-xs text-muted-foreground mt-1">Model format</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent class="p-4">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
                                        <Icon name="heroicons:chart-bar" class="h-4 w-4 text-primary" />
                                    </div>
                                    <h4 class="text-sm font-semibold text-muted-foreground">Quantization</h4>
                                </div>
                                <p class="text-lg font-bold">{{ model.details.quantization_level }}</p>
                                <p class="text-xs text-muted-foreground mt-1">Quantization level</p>
                            </CardContent>
                        </Card>
                    </div>

                    <!-- Architecture Details -->
                    <Card v-if="model.details.architecture">
                        <CardContent class="p-5">
                            <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Icon name="heroicons:cog-6-tooth" class="h-5 w-5 text-primary" />
                                Architecture
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p class="text-xs font-semibold text-muted-foreground mb-2">Input Modalities</p>
                                    <div class="flex flex-wrap gap-2">
                                        <Badge v-for="modality in model.details.architecture.input_modalities"
                                            :key="modality" variant="secondary">{{ modality }}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-xs font-semibold text-muted-foreground mb-2">Output Modalities</p>
                                    <div class="flex flex-wrap gap-2">
                                        <Badge v-for="modality in model.details.architecture.output_modalities"
                                            :key="modality" variant="outline">{{ modality }}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-xs font-semibold text-muted-foreground mb-2">Tokenizer</p>
                                    <p class="text-sm font-mono">{{ model.details.architecture.tokenizer }}</p>
                                </div>
                                <div v-if="model.details.architecture.instruct_type">
                                    <p class="text-xs font-semibold text-muted-foreground mb-2">Instruction Type</p>
                                    <p class="text-sm font-mono">{{ model.details.architecture.instruct_type }}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Pricing Information -->
                    <Card v-if="model.details.pricing && hasPricing" class="border-yellow-500/20 bg-yellow-500/5">
                        <CardContent class="p-5">
                            <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Icon name="heroicons:currency-dollar" class="h-5 w-5 text-yellow-600" />
                                Pricing
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div v-if="model.details.pricing.prompt !== '0'"
                                    class="flex items-center justify-between p-3 bg-card rounded-lg">
                                    <span class="text-xs font-medium text-muted-foreground">Input (per token)</span>
                                    <span class="text-sm font-bold">${{ model.details.pricing.prompt }}</span>
                                </div>
                                <div v-if="model.details.pricing.completion !== '0'"
                                    class="flex items-center justify-between p-3 bg-card rounded-lg">
                                    <span class="text-xs font-medium text-muted-foreground">Output (per token)</span>
                                    <span class="text-sm font-bold">${{ model.details.pricing.completion }}</span>
                                </div>
                                <div v-if="model.details.pricing.request !== '0'"
                                    class="flex items-center justify-between p-3 bg-card rounded-lg">
                                    <span class="text-xs font-medium text-muted-foreground">Per request</span>
                                    <span class="text-sm font-bold">${{ model.details.pricing.request }}</span>
                                </div>
                                <div v-if="model.details.pricing.image !== '0'"
                                    class="flex items-center justify-between p-3 bg-card rounded-lg">
                                    <span class="text-xs font-medium text-muted-foreground">Per image</span>
                                    <span class="text-sm font-bold">${{ model.details.pricing.image }}</span>
                                </div>
                            </div>
                            <p class="text-xs text-yellow-600 mt-3 italic">
                                💡 All displayed models are free to use
                            </p>
                        </CardContent>
                    </Card>

                    <!-- Supported Parameters -->
                    <Card v-if="model.details.supported_parameters && model.details.supported_parameters.length > 0"
                        class="border-primary/20 bg-primary/5">
                        <CardContent class="p-5">
                            <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Icon name="heroicons:adjustments-horizontal" class="h-5 w-5 text-primary" />
                                Supported Parameters
                            </h4>
                            <div class="flex flex-wrap gap-2">
                                <Badge v-for="param in model.details.supported_parameters" :key="param"
                                    variant="secondary" :title="getParameterDescription(param)">{{ param }}</Badge>
                            </div>
                            <p class="text-xs text-primary mt-3">
                                These parameters can be used in API requests
                            </p>
                        </CardContent>
                    </Card>

                    <!-- Metadata -->
                    <Card>
                        <CardContent class="p-4">
                            <h4 class="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                <Icon name="heroicons:information-circle" class="h-4 w-4 text-primary" />
                                Additional Information
                            </h4>
                            <div class="space-y-2 text-xs">
                                <div v-if="model.details.canonical_slug" class="flex items-center justify-between">
                                    <span class="text-muted-foreground">Canonical Slug</span>
                                    <span class="font-mono">{{ model.details.canonical_slug }}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-muted-foreground">Last updated</span>
                                    <span class="font-medium">{{ formatDate(model.modified_at) }}</span>
                                </div>
                                <div v-if="model.details.top_provider?.is_moderated !== undefined"
                                    class="flex items-center justify-between">
                                    <span class="text-muted-foreground">Content Moderation</span>
                                    <span
                                        :class="model.details.top_provider.is_moderated ? 'text-primary' : 'text-muted-foreground'"
                                        class="font-semibold">
                                        {{ model.details.top_provider.is_moderated ? 'Enabled' : 'Disabled' }}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div v-else class="flex flex-col items-center justify-center py-20">
                    <Icon name="heroicons:exclamation-triangle" class="h-16 w-16 text-muted-foreground/40 mb-4" />
                    <p class="text-muted-foreground">Model information could not be loaded</p>
                </div>
            </div>

            <!-- Fixed Footer -->
            <div class="p-4 border-t border-border flex-shrink-0">
                <Button variant="outline" @click="closeDialog" class="w-full">Close</Button>
            </div>
        </SheetContent>
    </Sheet>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'

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
