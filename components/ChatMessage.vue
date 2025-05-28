<template>
  <div class="flex" :class="isUser ? 'justify-end' : 'justify-start'">
    <div class="flex max-w-xs lg:max-w-4xl" :class="isUser ? 'flex-row-reverse' : 'flex-row'">
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
        <div class="px-3 py-2 rounded-2xl" 
             :class="isUser 
               ? 'bg-teal-700 text-white' 
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
  
  // Escape HTML characters to prevent PHP tags and other HTML from being interpreted
  const escapeHtml = (text: string) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  // First escape HTML, then process markdown
  const escapedMessage = escapeHtml(props.message)
  return marked(escapedMessage)
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
  max-width: none;
}

/* Headings */
:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  margin-top: 0.8rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  line-height: 1.3;
}

:deep(.prose h1) { 
  font-size: 1.4rem; 
  color: inherit;
}
:deep(.prose h2) { 
  font-size: 1.25rem; 
  color: inherit;
}
:deep(.prose h3) { 
  font-size: 1.1rem; 
  color: inherit;
}

/* Paragraphs */
:deep(.prose p) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.5;
  color: inherit;
}

/* Strong/Bold text - much more visible */
:deep(.prose strong) {
  font-weight: 700;
  color: inherit;
  text-shadow: 0 0 1px currentColor;
}

/* Lists - much better visibility */
:deep(.prose ul),
:deep(.prose ol) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 2rem;
  color: inherit;
}

:deep(.prose ul) {
  list-style-type: disc;
}

:deep(.prose ol) {
  list-style-type: decimal;
}

:deep(.prose li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  line-height: 1.5;
  color: inherit;
  position: relative;
}

/* Custom bullet points for better visibility */
:deep(.prose ul li::marker) {
  color: inherit;
  font-weight: bold;
  font-size: 1.2em;
}

:deep(.prose ol li::marker) {
  color: inherit;
  font-weight: bold;
}

/* Nested lists */
:deep(.prose ul ul),
:deep(.prose ol ol),
:deep(.prose ul ol),
:deep(.prose ol ul) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
}

/* Code elements */
:deep(.prose code) {
  padding: 0.2rem 0.4rem;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-weight: 600;
}

/* Code styling for different message types */
.bg-teal-700 :deep(.prose code) {
  background-color: rgba(15, 118, 110, 0.4);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.bg-blue-600\/20 :deep(.prose code) {
  background-color: rgba(30, 58, 138, 0.5);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.bg-green-600\/20 :deep(.prose code) {
  color: #86efac;
}

/* Code blocks */
:deep(.prose pre) {
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bg-teal-700 :deep(.prose pre) {
  background-color: rgba(15, 118, 110, 0.5);
}

.bg-blue-600\/20 :deep(.prose pre) {
  background-color: rgba(30, 58, 138, 0.5);
}

.bg-green-600\/20 :deep(.prose pre) {
  background-color: rgba(5, 46, 22, 0.5);
}

:deep(.prose pre code) {
  padding: 0;
  background: transparent;
  font-size: 0.875rem;
  border: none;
  color: inherit;
}

/* Links */
:deep(.prose a) {
  text-decoration: underline;
  font-weight: 600;
  transition: all 0.2s ease;
}

.bg-teal-700 :deep(.prose a) {
  color: #fbbf24;
}

.bg-blue-600\/20 :deep(.prose a) {
  color: #60a5fa;
}

.bg-green-600\/20 :deep(.prose a) {
  color: #34d399;
}

:deep(.prose a:hover) {
  text-decoration: none;
  opacity: 0.8;
}

/* Blockquotes */
:deep(.prose blockquote) {
  border-left: 4px solid currentColor;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  opacity: 0.9;
}

/* Tables */
:deep(.prose table) {
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
}

:deep(.prose th),
:deep(.prose td) {
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: left;
}

:deep(.prose th) {
  font-weight: 700;
  background-color: rgba(255, 255, 255, 0.1);
}

/* Horizontal rules */
:deep(.prose hr) {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
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