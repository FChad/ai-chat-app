<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" @click="closeDialog"
                class="fixed inset-0 bg-black/20 dark:bg-black/40 z-[60] flex items-center justify-center p-4 sm:p-6 animate-fade-in">

                <!-- Modal Content -->
                <div @click.stop
                    class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden transform transition-all"
                    :class="isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'">

                    <!-- Header -->
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div class="flex justify-between items-start">
                            <div>
                                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    Model Information
                                </h2>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    Details about the current AI model
                                </p>
                            </div>
                            <button @click="closeDialog"
                                class="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 group">
                                <Icon name="heroicons:x-mark"
                                    class="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
                            </button>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <div v-if="model" class="space-y-6">
                            <!-- Model Header -->
                            <div
                                class="p-5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border-2 border-primary-200 dark:border-primary-800">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex-1">
                                        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                            {{ model.name }}
                                        </h3>
                                        <code
                                            class="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700 font-mono inline-block">
                                            {{ model.model }}
                                        </code>
                                    </div>
                                    <div class="flex flex-col gap-2 items-end">
                                        <span
                                            class="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-600 dark:bg-primary-500 text-white text-sm font-bold shadow-sm">
                                            {{ model.details.family }}
                                        </span>
                                        <span
                                            class="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                                            <Icon name="heroicons:cpu-chip" class="h-4 w-4 mr-1.5" />
                                            {{ model.details.parameter_size }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Description -->
                                <div v-if="model.details.description"
                                    class="mt-4 pt-4 border-t border-primary-200 dark:border-primary-700">
                                    <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {{ model.details.description }}
                                    </p>
                                </div>
                            </div>

                            <!-- Technical Details -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Context Length -->
                                <div
                                    class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div class="flex items-center gap-2 mb-2">
                                        <div
                                            class="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                            <Icon name="heroicons:document-text"
                                                class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Context Length
                                        </h4>
                                    </div>
                                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {{ formatContextLength(model.details.context_length) }}
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Maximum token count
                                    </p>
                                </div>

                                <!-- Max Output -->
                                <div v-if="model.details.top_provider?.max_completion_tokens"
                                    class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div class="flex items-center gap-2 mb-2">
                                        <div
                                            class="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                            <Icon name="heroicons:arrow-up-tray"
                                                class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Maximum Output
                                        </h4>
                                    </div>
                                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {{ formatNumber(model.details.top_provider.max_completion_tokens) }}
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Max completion tokens
                                    </p>
                                </div>

                                <!-- Format -->
                                <div
                                    class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div class="flex items-center gap-2 mb-2">
                                        <div
                                            class="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                            <Icon name="heroicons:cube"
                                                class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Format
                                        </h4>
                                    </div>
                                    <p class="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {{ model.details.format }}
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Model format
                                    </p>
                                </div>

                                <!-- Quantization -->
                                <div
                                    class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div class="flex items-center gap-2 mb-2">
                                        <div
                                            class="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                            <Icon name="heroicons:chart-bar"
                                                class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Quantization
                                        </h4>
                                    </div>
                                    <p class="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {{ model.details.quantization_level }}
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Quantization level
                                    </p>
                                </div>
                            </div>

                            <!-- Architecture Details -->
                            <div v-if="model.details.architecture"
                                class="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4
                                    class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <Icon name="heroicons:cog-6-tooth" class="h-5 w-5 text-primary-500" />
                                    Architecture
                                </h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <!-- Input Modalities -->
                                    <div>
                                        <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                            Input Modalities
                                        </p>
                                        <div class="flex flex-wrap gap-2">
                                            <span v-for="modality in model.details.architecture.input_modalities"
                                                :key="modality"
                                                class="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-md">
                                                {{ modality }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Output Modalities -->
                                    <div>
                                        <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                            Output Modalities
                                        </p>
                                        <div class="flex flex-wrap gap-2">
                                            <span v-for="modality in model.details.architecture.output_modalities"
                                                :key="modality"
                                                class="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-md">
                                                {{ modality }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Tokenizer -->
                                    <div>
                                        <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                            Tokenizer
                                        </p>
                                        <p class="text-sm text-gray-700 dark:text-gray-300 font-mono">
                                            {{ model.details.architecture.tokenizer }}
                                        </p>
                                    </div>

                                    <!-- Instruct Type -->
                                    <div v-if="model.details.architecture.instruct_type">
                                        <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                            Instruction Type
                                        </p>
                                        <p class="text-sm text-gray-700 dark:text-gray-300 font-mono">
                                            {{ model.details.architecture.instruct_type }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Pricing Information -->
                            <div v-if="model.details.pricing && hasPricing"
                                class="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                                <h4
                                    class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <Icon name="heroicons:currency-dollar"
                                        class="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    Pricing
                                </h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div v-if="model.details.pricing.prompt !== '0'"
                                        class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                                            Input (per token)
                                        </span>
                                        <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            ${{ model.details.pricing.prompt }}
                                        </span>
                                    </div>
                                    <div v-if="model.details.pricing.completion !== '0'"
                                        class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                                            Output (per token)
                                        </span>
                                        <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            ${{ model.details.pricing.completion }}
                                        </span>
                                    </div>
                                    <div v-if="model.details.pricing.request !== '0'"
                                        class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                                            Per request
                                        </span>
                                        <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            ${{ model.details.pricing.request }}
                                        </span>
                                    </div>
                                    <div v-if="model.details.pricing.image !== '0'"
                                        class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                                            Per image
                                        </span>
                                        <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            ${{ model.details.pricing.image }}
                                        </span>
                                    </div>
                                </div>
                                <p class="text-xs text-amber-700 dark:text-amber-300 mt-3 italic">
                                    💡 All displayed models are free to use
                                </p>
                            </div>

                            <!-- Supported Parameters -->
                            <div v-if="model.details.supported_parameters && model.details.supported_parameters.length > 0"
                                class="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4
                                    class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <Icon name="heroicons:adjustments-horizontal"
                                        class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    Supported Parameters
                                </h4>
                                <div class="flex flex-wrap gap-2">
                                    <span v-for="param in model.details.supported_parameters" :key="param"
                                        class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-md border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                        :title="getParameterDescription(param)">
                                        {{ param }}
                                    </span>
                                </div>
                                <p class="text-xs text-blue-700 dark:text-blue-300 mt-3">
                                    These parameters can be used in API requests
                                </p>
                            </div>

                            <!-- Metadata -->
                            <div
                                class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4
                                    class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <Icon name="heroicons:information-circle" class="h-4 w-4 text-primary-500" />
                                    Additional Information
                                </h4>
                                <div class="space-y-2 text-xs">
                                    <div v-if="model.details.canonical_slug" class="flex items-center justify-between">
                                        <span class="text-gray-600 dark:text-gray-400">Canonical Slug</span>
                                        <span class="font-mono text-gray-900 dark:text-gray-100">
                                            {{ model.details.canonical_slug }}
                                        </span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-gray-600 dark:text-gray-400">Last updated</span>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">
                                            {{ formatDate(model.modified_at) }}
                                        </span>
                                    </div>
                                    <div v-if="model.details.top_provider?.is_moderated !== undefined"
                                        class="flex items-center justify-between">
                                        <span class="text-gray-600 dark:text-gray-400">Content Moderation</span>
                                        <span
                                            :class="model.details.top_provider.is_moderated ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'"
                                            class="font-semibold">
                                            {{ model.details.top_provider.is_moderated ? 'Enabled' : 'Disabled' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="text-center py-12">
                            <Icon name="heroicons:exclamation-triangle"
                                class="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p class="text-gray-500 dark:text-gray-400">
                                Model information could not be loaded
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div class="flex items-center justify-end">
                            <button @click="closeDialog"
                                class="px-6 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 font-medium border border-gray-200 dark:border-gray-700">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
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

// Close on Escape key
onMounted(() => {
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && props.isOpen) {
            closeDialog()
        }
    }
    window.addEventListener('keydown', handleEscape)

    onUnmounted(() => {
        window.removeEventListener('keydown', handleEscape)
    })
})
</script>

<style scoped>
/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
    transform: scale(0.95);
    opacity: 0;
}

/* Custom scrollbar */
.overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.4);
    border-radius: 6px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.6);
}

.dark .overflow-y-auto {
    scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(75, 85, 99, 0.4);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background-color: rgba(75, 85, 99, 0.6);
}
</style>
