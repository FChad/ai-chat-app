<template>
    <div>
        <!-- Trigger Button -->
        <Button @click="openDialog" :disabled="disabled" variant="outline"
            class="w-full justify-between text-left text-sm font-medium">
            <span v-if="selectedModel">
                {{ getModelName(selectedModel) }}
            </span>
            <span v-else class="text-muted-foreground">
                Select model...
            </span>
            <Icon name="heroicons:chevron-down" class="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </Button>

        <!-- Model Selection Sheet (bottom drawer) -->
        <Sheet :open="isOpen" @update:open="(val: boolean) => { if (!val) closeDialog() }">
            <SheetContent side="bottom" class="h-[92vh] flex flex-col p-0 gap-0 rounded-t-2xl">
                <!-- Drag handle -->
                <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div class="w-10 h-1.5 rounded-full bg-muted-foreground/25"></div>
                </div>

                <!-- Fixed Header -->
                <div class="px-6 pt-2 pb-4 border-b border-border flex-shrink-0">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h2 class="text-xl font-semibold">Select AI Model</h2>
                            <p class="text-sm text-muted-foreground mt-0.5">Choose the right model for your request</p>
                        </div>
                        <Badge v-if="filteredModels.length > 0" variant="secondary" class="mt-1">
                            {{ filteredModels.length }} models
                        </Badge>
                    </div>

                    <!-- Filter and Search Bar -->
                    <div class="flex gap-2 sm:gap-3">
                        <!-- Family Filter -->
                        <div class="relative flex-shrink-0 w-32 sm:w-auto">
                            <select v-model="selectedFamily"
                                class="w-full pl-3 pr-8 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer text-sm h-9">
                                <option value="">All families</option>
                                <option v-for="family in availableFamilies" :key="family" :value="family">
                                    {{ family }}
                                </option>
                            </select>
                            <Icon name="heroicons:chevron-down"
                                class="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>

                        <!-- Search Bar -->
                        <div class="relative flex-1 min-w-0">
                            <Icon name="heroicons:magnifying-glass"
                                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input v-model="searchQuery" type="text" placeholder="Search models..."
                                class="w-full h-9 pl-9 pr-4 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                        </div>
                    </div>
                </div>

                <!-- Scrollable Models Grid -->
                <div class="flex-1 overflow-y-auto p-6">
                    <div v-if="filteredModels.length === 0" class="flex flex-col items-center justify-center py-20">
                        <Icon name="heroicons:magnifying-glass" class="h-14 w-14 text-muted-foreground/30 mb-4" />
                        <p class="text-muted-foreground font-medium">No models found</p>
                        <p class="text-sm text-muted-foreground/70 mt-1">Try a different search term</p>
                    </div>

                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <button v-for="model in filteredModels" :key="model.model" @click="selectModel(model.model)"
                            class="relative text-left p-4 rounded-xl border-2 transition-all duration-200 group overflow-hidden"
                            :class="tempSelectedModel === model.model
                                ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                                : 'border-border hover:border-primary/50 bg-card shadow-sm hover:shadow-md'">

                            <!-- Selection indicator -->
                            <div v-if="tempSelectedModel === model.model"
                                class="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <Icon name="heroicons:check" class="h-3.5 w-3.5 text-primary-foreground" />
                            </div>

                            <!-- Model Header -->
                            <div class="mb-3 pr-8">
                                <h3 class="font-semibold text-sm text-foreground mb-2 leading-snug">
                                    {{ model.name }}
                                </h3>
                                <div class="flex flex-wrap items-center gap-1.5">
                                    <Badge variant="secondary" class="text-xs">
                                        {{ model.details.family }}
                                    </Badge>
                                    <Badge variant="outline" class="text-xs gap-1">
                                        <Icon name="heroicons:cpu-chip" class="h-3 w-3" />
                                        {{ model.details.parameter_size }}
                                    </Badge>
                                </div>
                            </div>

                            <!-- Description -->
                            <div v-if="model.details.description" class="mb-3">
                                <p class="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                    {{ model.details.description }}
                                </p>
                            </div>

                            <!-- Quick Stats -->
                            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-border/60">
                                <span class="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Icon name="heroicons:document-text" class="h-3.5 w-3.5 text-primary/70" />
                                    {{ formatContextLength(model.details.context_length) }}
                                </span>
                                <span v-if="model.details.top_provider?.max_completion_tokens"
                                    class="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Icon name="heroicons:arrow-up-tray" class="h-3.5 w-3.5 text-primary/70" />
                                    {{ formatNumber(model.details.top_provider.max_completion_tokens) }} max
                                </span>
                                <span
                                    v-if="model.details.architecture?.input_modalities && model.details.architecture.input_modalities.length > 1"
                                    class="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Icon name="heroicons:photo" class="h-3.5 w-3.5 text-primary/70" />
                                    Multimodal
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Fixed Footer -->
                <div
                    class="p-4 border-t border-border bg-muted/30 flex-shrink-0 flex items-center justify-between gap-3">
                    <p v-if="tempSelectedModel" class="text-sm text-muted-foreground truncate flex-1">
                        <span class="font-medium text-foreground">Selected:</span>
                        {{ getModelName(tempSelectedModel) }}
                    </p>
                    <p v-else class="text-sm text-muted-foreground flex-1">No model selected</p>
                    <div class="flex gap-2 flex-shrink-0">
                        <Button @click="closeDialog" variant="outline" size="sm">Cancel</Button>
                        <Button @click="confirmSelection" :disabled="!tempSelectedModel" size="sm">
                            <Icon name="heroicons:check" class="h-4 w-4 mr-1.5" />
                            Confirm
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    </div>
</template>

<script setup lang="ts">
import type { AIModel } from '../../types/chat'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
    tempSelectedModel.value = selectedModel.value
}

const closeDialog = () => {
    isOpen.value = false
    tempSelectedModel.value = selectedModel.value // Reset temp selection on cancel
}

const selectModel = (modelId: string) => {
    tempSelectedModel.value = modelId
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
