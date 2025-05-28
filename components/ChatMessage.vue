<template>
  <div class="flex" :class="isUser ? 'justify-end' : 'justify-start'">
    <div class="flex max-w-xs lg:max-w-2xl" :class="isUser ? 'flex-row-reverse' : 'flex-row'">
      <!-- Avatar -->
      <div class="flex-shrink-0" :class="isUser ? 'ml-3' : 'mr-3'">
        <div class="w-8 h-8 rounded-full flex items-center justify-center" 
             :class="isUser ? 'bg-purple-600' : (isAi ? 'bg-blue-600' : 'bg-green-600')">
          <Icon 
            :name="isUser ? 'heroicons:user' : (isAi ? 'heroicons:cpu-chip' : 'heroicons:sparkles')" 
            class="h-5 w-5 text-white flex-shrink-0" 
          />
        </div>
      </div>
      
      <!-- Message bubble -->
      <div class="relative">
        <div class="px-4 py-3 rounded-2xl" 
             :class="isUser 
               ? 'bg-purple-600 text-white' 
               : (isAi ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' : 'bg-green-600/20 text-green-100 border border-green-500/30')">
          
          <!-- Typing indicator -->
          <div v-if="isTyping" class="flex items-center space-x-1">
            <div class="typing-dot w-2 h-2 bg-current rounded-full"></div>
            <div class="typing-dot w-2 h-2 bg-current rounded-full"></div>
            <div class="typing-dot w-2 h-2 bg-current rounded-full"></div>
          </div>
          
          <!-- Message content with markdown support -->
          <div v-else class="prose prose-sm max-w-none" :class="getProseClasses()">
            <div v-html="renderedMessage"></div>
          </div>
        </div>
        
        <!-- Timestamp -->
        <div class="text-xs text-gray-400 mt-1" :class="isUser ? 'text-right' : 'text-left'">
          {{ timestamp }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

interface Props {
  message: string
  isUser: boolean
  isAi?: boolean
  isTyping?: boolean
  timestamp: string
}

const props = defineProps<Props>()

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Compute rendered markdown
const renderedMessage = computed(() => {
  if (!props.message) return ''
  return marked(props.message)
})

// Get appropriate prose classes based on message type
const getProseClasses = () => {
  if (props.isUser) {
    return 'prose-invert prose-headings:text-white prose-strong:text-white prose-code:text-purple-200 prose-code:bg-purple-800/50 prose-pre:bg-purple-800/50 prose-pre:text-purple-100'
  } else if (props.isAi) {
    return 'prose-blue prose-headings:text-blue-100 prose-strong:text-blue-100 prose-code:text-blue-200 prose-code:bg-blue-900/50 prose-pre:bg-blue-900/50 prose-pre:text-blue-100 prose-a:text-blue-300'
  } else {
    return 'prose-green prose-headings:text-green-100 prose-strong:text-green-100 prose-code:text-green-200 prose-code:bg-green-900/50 prose-pre:bg-green-900/50 prose-pre:text-green-100 prose-a:text-green-300'
  }
}
</script>

<style scoped>
/* Custom styles for markdown elements */
:deep(.prose) {
  color: inherit;
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

:deep(.prose h1) { font-size: 1.25rem; }
:deep(.prose h2) { font-size: 1.125rem; }
:deep(.prose h3) { font-size: 1rem; }

:deep(.prose p) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
}

:deep(.prose li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

:deep(.prose strong) {
  font-weight: 600;
}

:deep(.prose code) {
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
}

:deep(.prose pre) {
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

:deep(.prose pre code) {
  padding: 0;
  background: transparent;
  font-size: 0.875rem;
}

:deep(.prose a) {
  text-decoration: underline;
}

:deep(.prose a:hover) {
  text-decoration: none;
}

/* Typing animation */
.typing-dot {
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}
</style> 