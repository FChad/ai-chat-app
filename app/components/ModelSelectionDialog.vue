<template>
    <div>
        <!-- Trigger Button -->
        <button @click="openDialog" :disabled="disabled"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-center justify-between">
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
                    class="fixed inset-0 bg-black/20 dark:bg-black/40 z-[60] flex items-center justify-center p-4 sm:p-6 animate-fade-in">

                    <!-- Modal Content -->
                    <div @click.stop
                        class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden transform transition-all"
                        :class="isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'">

                        <!-- Header -->
                        <div class="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <div class="flex justify-between mb-4">
                                <div>
                                    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">KI-Modell
                                        auswählen</h2>
                                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Wähle das passende Modell
                                        für deine Anfrage</p>
                                </div>
                                <button @click="closeDialog"
                                    class="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 group">
                                    <Icon name="heroicons:x-mark"
                                        class="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
                                </button>
                            </div>

                            <!-- Filter and Search Bar -->
                            <div class="flex gap-2 sm:gap-3">
                                <!-- Family Filter -->
                                <div class="relative flex-shrink-0 w-28 sm:w-auto">
                                    <select v-model="selectedFamily"
                                        class="w-full pl-2 sm:pl-3 pr-7 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer text-sm">
                                        <option value="">Alle</option>
                                        <option v-for="family in availableFamilies" :key="family" :value="family">
                                            {{ family }}
                                        </option>
                                    </select>
                                    <Icon name="heroicons:chevron-down"
                                        class="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
                                </div>

                                <!-- Search Bar -->
                                <div class="relative flex-1 min-w-0">
                                    <Icon name="heroicons:magnifying-glass"
                                        class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input v-model="searchQuery" type="text" placeholder="Modelle durchsuchen..."
                                        class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                                </div>
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
                                    class="relative text-left p-5 rounded-lg border-2 transition-colors duration-200 group overflow-hidden"
                                    :class="tempSelectedModel === model.model
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 bg-white dark:bg-gray-800 shadow-sm'">

                                    <!-- Selection Badge -->
                                    <div v-if="tempSelectedModel === model.model"
                                        class="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center ring-2 ring-primary-200 dark:ring-primary-800">
                                        <Icon name="heroicons:check" class="h-4 w-4 text-white" />
                                    </div>

                                    <!-- Model Header -->
                                    <div class="mb-3">
                                        <h3
                                            class="font-bold text-base text-gray-900 dark:text-gray-100 mb-1.5 leading-tight">
                                            {{ model.name }}
                                        </h3>
                                        <div class="flex items-center justify-between gap-3 text-xs">
                                            <div class="flex items-center gap-2">
                                                <span
                                                    class="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
                                                    {{ model.details.family }}
                                                </span>
                                                <span
                                                    class="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                                                    <Icon name="heroicons:cpu-chip" class="h-3.5 w-3.5 mr-1" />
                                                    {{ model.details.parameter_size }}
                                                </span>
                                            </div>
                                            <div
                                                class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                <Icon name="heroicons:clock" class="h-3.5 w-3.5" />
                                                <span>{{ formatDate(model.modified_at) }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Description -->
                                    <div v-if="model.details.description" class="mb-3">
                                        <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
                                            :class="expandedDescriptions[model.model] ? '' : 'line-clamp-3'">
                                            {{ model.details.description }}
                                        </p>
                                        <button v-if="model.details.description.length > 150"
                                            @click.stop="toggleDescription(model.model)"
                                            class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold mt-1.5 flex items-center gap-1">
                                            {{ expandedDescriptions[model.model] ? 'Weniger' : 'Mehr' }}
                                            <Icon
                                                :name="expandedDescriptions[model.model] ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                                                class="h-3 w-3" />
                                        </button>
                                    </div>

                                    <!-- Quick Stats -->
                                    <div
                                        class="flex flex-wrap items-center gap-3 py-3 px-3 -mx-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                        <!-- Context Length -->
                                        <div
                                            class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                                            <Icon name="heroicons:document-text" class="h-4 w-4 text-primary-500" />
                                            <span>{{ formatContextLength(model.details.context_length) }} Kontext</span>
                                        </div>

                                        <!-- Max Output -->
                                        <div v-if="model.details.top_provider?.max_completion_tokens"
                                            class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                                            <Icon name="heroicons:arrow-up-tray" class="h-4 w-4 text-primary-500" />
                                            <span>{{ formatNumber(model.details.top_provider.max_completion_tokens) }}
                                                Max</span>
                                        </div>

                                        <!-- Input Modalities -->
                                        <div v-if="model.details.architecture?.input_modalities && model.details.architecture.input_modalities.length > 1"
                                            class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                                            <Icon name="heroicons:photo" class="h-4 w-4 text-primary-500" />
                                            <span>Multimodal</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <div class="flex items-center justify-end gap-3">
                                <button @click="confirmSelection" :disabled="!tempSelectedModel"
                                    class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 font-semibold disabled:cursor-not-allowed">
                                    Auswählen
                                </button>
                                <button @click="closeDialog"
                                    class="px-6 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 font-medium border border-gray-200 dark:border-gray-700">
                                    Schließen
                                </button>
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
const selectedFamily = ref('')
const selectedModel = ref(props.modelValue || '')
const tempSelectedModel = ref(props.modelValue || '')
const expandedDescriptions = ref<Record<string, boolean>>({})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        selectedModel.value = newValue
        tempSelectedModel.value = newValue
    }
})

// Compute available families
const availableFamilies = computed(() => {
    const families = new Set(props.models.map(model => model.details.family))
    return Array.from(families).sort()
})

const openDialog = () => {
    isOpen.value = true
    searchQuery.value = ''
    selectedFamily.value = ''
    expandedDescriptions.value = {} // Reset expanded states when opening
    tempSelectedModel.value = selectedModel.value // Set temp to current selection
}

const closeDialog = () => {
    isOpen.value = false
    tempSelectedModel.value = selectedModel.value // Reset temp selection on cancel
}

const selectModel = (modelId: string) => {
    tempSelectedModel.value = modelId
}

const toggleDescription = (modelId: string) => {
    expandedDescriptions.value[modelId] = !expandedDescriptions.value[modelId]
}

const confirmSelection = () => {
    selectedModel.value = tempSelectedModel.value
    emit('update:modelValue', selectedModel.value)
    closeDialog()
}

const getModelName = (modelId: string): string => {
    const model = props.models.find(m => m.model === modelId)
    return model ? model.name : modelId
}

const filteredModels = computed(() => {
    let models = props.models

    // Filter by family
    if (selectedFamily.value) {
        models = models.filter(model => model.details.family === selectedFamily.value)
    }

    // Filter by search query
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        models = models.filter(model =>
            model.name.toLowerCase().includes(query) ||
            model.model.toLowerCase().includes(query) ||
            model.details.description?.toLowerCase().includes(query) ||
            model.details.family.toLowerCase().includes(query)
        )
    }

    // Sort by modified_at date, newest first
    return [...models].sort((a, b) => {
        const dateA = new Date(a.modified_at).getTime()
        const dateB = new Date(b.modified_at).getTime()
        return dateB - dateA // Descending order (newest first)
    })
})

// Helper functions
const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
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
.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
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
