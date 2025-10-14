<template>
    <div>
        <!-- Trigger Button -->
        <button @click="openDialog" :disabled="disabled"
            class="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-primary-200/60 dark:border-primary-700/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-400 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-primary-300/70 dark:hover:border-primary-600/70 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-center justify-between">
            <span v-if="selectedModel">
                {{ getModelName(selectedModel) }}
            </span>
            <span v-else class="text-gray-500 dark:text-gray-400">
                Modell auswählen...
            </span>
            <Icon name="heroicons:chevron-down" class="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        </button>

        <!-- Modal Overlay -->
        <Teleport to="body">
            <Transition name="modal">
                <div v-if="isOpen" @click="closeDialog"
                    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

                    <!-- Modal Content -->
                    <div @click.stop
                        class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">

                        <!-- Header -->
                        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    KI-Modell auswählen
                                </h2>
                                <button @click="closeDialog"
                                    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <Icon name="heroicons:x-mark" class="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <!-- Search Bar -->
                            <div class="relative">
                                <Icon name="heroicons:magnifying-glass"
                                    class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input v-model="searchQuery" type="text" placeholder="Modelle durchsuchen..."
                                    class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                            </div>
                        </div>

                        <!-- Models Grid -->
                        <div class="flex-1 overflow-y-auto p-6">
                            <div v-if="filteredModels.length === 0" class="text-center py-12">
                                <Icon name="heroicons:magnifying-glass"
                                    class="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p class="text-gray-500 dark:text-gray-400">
                                    Keine Modelle gefunden
                                </p>
                            </div>

                            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button v-for="model in filteredModels" :key="model.model"
                                    @click="selectModel(model.model)"
                                    class="text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg group"
                                    :class="selectedModel === model.model
                                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-800'">

                                    <!-- Model Header -->
                                    <div class="flex items-start justify-between mb-2">
                                        <div class="flex-1 min-w-0">
                                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                                                {{ model.name }}
                                            </h3>
                                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {{ model.details.parameter_size }} • {{ model.details.family }}
                                            </p>
                                        </div>
                                        <div v-if="selectedModel === model.model"
                                            class="flex-shrink-0 ml-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                            <Icon name="heroicons:check" class="h-4 w-4 text-white" />
                                        </div>
                                    </div>

                                    <!-- Description -->
                                    <div v-if="model.details.description" class="mb-3">
                                        <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
                                            :class="expandedDescriptions[model.model] ? '' : 'line-clamp-2'">
                                            {{ model.details.description }}
                                        </p>
                                        <button v-if="model.details.description.length > 150"
                                            @click.stop="toggleDescription(model.model)"
                                            class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium mt-1 flex items-center gap-1">
                                            {{ expandedDescriptions[model.model] ? 'Weniger anzeigen' : 'Mehr anzeigen'
                                            }}
                                            <Icon
                                                :name="expandedDescriptions[model.model] ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                                                class="h-3 w-3" />
                                        </button>
                                    </div>

                                    <!-- Quick Stats -->
                                    <div class="flex items-center gap-3 text-xs">
                                        <!-- Context Length -->
                                        <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <Icon name="heroicons:document-text" class="h-3.5 w-3.5" />
                                            <span>{{ formatContextLength(model.details.context_length) }}</span>
                                        </div>

                                        <!-- Max Output -->
                                        <div v-if="model.details.top_provider"
                                            class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <Icon name="heroicons:arrow-up-tray" class="h-3.5 w-3.5" />
                                            <span>{{ formatNumber(model.details.top_provider.max_completion_tokens)
                                                }}</span>
                                        </div>

                                        <!-- Input Modalities -->
                                        <div v-if="model.details.architecture?.input_modalities && model.details.architecture.input_modalities.length > 1"
                                            class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <Icon name="heroicons:photo" class="h-3.5 w-3.5" />
                                            <span>Multi</span>
                                        </div>
                                    </div>

                                    <!-- Features Badge -->
                                    <div v-if="model.details.supported_parameters && model.details.supported_parameters.length > 0"
                                        class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <div class="flex items-center justify-between">
                                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                                {{ getImportantFeatures(model.details.supported_parameters).length }}
                                                Features
                                            </span>
                                            <div class="flex items-center gap-1.5">
                                                <span v-if="hasFeature(model, 'tools')"
                                                    class="w-2 h-2 rounded-full bg-blue-500"
                                                    title="Function Calling"></span>
                                                <span v-if="hasFeature(model, 'structured_outputs')"
                                                    class="w-2 h-2 rounded-full bg-green-500"
                                                    title="JSON Schema"></span>
                                                <span v-if="hasFeature(model, 'reasoning')"
                                                    class="w-2 h-2 rounded-full bg-purple-500" title="Reasoning"></span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <!-- Feature Legend -->
                            <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Feature-Indikatoren:</p>
                                <div class="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                                    <div class="flex items-center gap-1.5">
                                        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                                        <span>Function Calling</span>
                                    </div>
                                    <div class="flex items-center gap-1.5">
                                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span>JSON Schema</span>
                                    </div>
                                    <div class="flex items-center gap-1.5">
                                        <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                                        <span>Reasoning</span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center justify-between">
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    {{ filteredModels.length }} kostenlose {{ filteredModels.length === 1 ? 'Modell' :
                                    'Modelle' }}
                                </p>
                                <div class="flex gap-3">
                                    <button @click="closeDialog"
                                        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium">
                                        Abbrechen
                                    </button>
                                    <button @click="confirmSelection" :disabled="!selectedModel"
                                        class="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed">
                                        Auswählen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'

interface Props {
    models: AIModel[]
    modelValue?: string
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const selectedModel = ref(props.modelValue || '')
const expandedDescriptions = ref<Record<string, boolean>>({})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        selectedModel.value = newValue
    }
})

const openDialog = () => {
    isOpen.value = true
    searchQuery.value = ''
    expandedDescriptions.value = {} // Reset expanded states when opening
}

const closeDialog = () => {
    isOpen.value = false
}

const selectModel = (modelId: string) => {
    selectedModel.value = modelId
}

const toggleDescription = (modelId: string) => {
    expandedDescriptions.value[modelId] = !expandedDescriptions.value[modelId]
}

const confirmSelection = () => {
    emit('update:modelValue', selectedModel.value)
    closeDialog()
}

const getModelName = (modelId: string): string => {
    const model = props.models.find(m => m.model === modelId)
    return model ? model.name : modelId
}

const filteredModels = computed(() => {
    if (!searchQuery.value) return props.models

    const query = searchQuery.value.toLowerCase()
    return props.models.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.model.toLowerCase().includes(query) ||
        model.details.description?.toLowerCase().includes(query) ||
        model.details.family.toLowerCase().includes(query)
    )
})

// Helper functions
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

const getImportantFeatures = (params: string[]): string[] => {
    const important = ['tools', 'structured_outputs', 'response_format', 'reasoning', 'max_tokens', 'temperature']
    return params.filter(p => important.includes(p))
}

const hasFeature = (model: AIModel, feature: string): boolean => {
    return model.details.supported_parameters?.includes(feature) || false
}

// Close on Escape key
onMounted(() => {
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen.value) {
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

/* Line clamp for description */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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
