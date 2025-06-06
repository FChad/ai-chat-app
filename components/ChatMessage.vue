<template>
  <div class="flex animate-fade-in" :class="isUser ? 'justify-end' : 'justify-start'">
    <div class="flex max-w-[95%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-4xl" :class="isUser ? 'flex-row-reverse' : 'flex-row'">
      <!-- Avatar -->
      <div class="flex-shrink-0" :class="isUser ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'">
        <div class="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg" 
             :class="avatarClasses">
          <Icon 
            :name="avatarIcon" 
            class="h-3 w-3 sm:h-5 sm:w-5 text-white flex-shrink-0" 
          />
        </div>
      </div>
      
      <!-- Message bubble -->
      <div class="relative min-w-0 flex-1">
        <div class="px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-sm sm:text-base backdrop-blur-sm border shadow-lg" 
             :class="bubbleClasses">
          
          <!-- Typing indicator -->
          <div v-if="isTyping" class="flex items-center space-x-1">
            <div class="typing-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-typing"></div>
            <div class="typing-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-typing [animation-delay:-0.16s]"></div>
            <div class="typing-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-typing [animation-delay:-0.32s]"></div>
            <span class="text-xs sm:text-sm ml-2 opacity-70">tippt...</span>
          </div>
          
          <!-- Message content with markdown support -->
          <div v-else class="prose prose-sm max-w-none text-inherit" :class="proseClasses">
            <div v-html="renderedMessage"></div>
          </div>
        </div>
        
        <!-- Timestamp -->
        <div v-if="timestamp" class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium" :class="isUser ? 'text-right' : 'text-left'">
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

const props = withDefaults(defineProps<Props>(), {
  isAi: false,
  isTyping: false
})

const { highlightCode, getLanguageName, configureHighlight, detectLanguage } = useHighlight()

// Configure marked with custom renderer for code blocks
const setupMarked = () => {
  // Set the global marked options with simple configuration
  marked.setOptions({
    breaks: true,
    gfm: true
    // Remove the highlight function since we're doing it in post-processing
  })
}

// Setup marked on mount and ensure it's properly configured
onMounted(() => {
  setupMarked()
  
  // Force re-render if needed
  nextTick(() => {
    // Ensure highlight.js is properly initialized
    configureHighlight()
  })
})

// Computed properties for styling
const avatarClasses = computed(() => {
  if (props.isUser) return 'bg-gradient-to-br from-primary-500 to-primary-600'
  if (props.isAi) return 'bg-gradient-to-br from-blue-500 to-blue-600'
  return 'bg-gradient-to-br from-green-500 to-green-600'
})

const avatarIcon = computed(() => {
  if (props.isUser) return 'heroicons:user'
  if (props.isAi) return 'heroicons:cpu-chip'
  return 'heroicons:sparkles'
})

const bubbleClasses = computed(() => {
  if (props.isUser) {
    return 'bg-gradient-to-br from-primary-500 to-primary-600 text-white border-primary-300/30'
  }
  if (props.isAi) {
    return 'bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 border-gray-200/50 dark:border-gray-700/50'
  }
  return 'bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 border-gray-200/50 dark:border-gray-700/50'
})

const proseClasses = computed(() => {
  if (props.isUser) {
    return 'prose-invert prose-headings:text-white prose-strong:text-white prose-code:text-primary-100 prose-code:bg-primary-800/50 prose-pre:bg-primary-800/50 prose-pre:text-primary-100 prose-a:text-primary-200'
  }
  if (props.isAi) {
    return 'prose-gray dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-blue-800 dark:prose-code:text-blue-200 prose-code:bg-blue-100/60 dark:prose-code:bg-blue-900/50 prose-pre:bg-blue-100/60 dark:prose-pre:bg-blue-900/50 prose-pre:text-blue-900 dark:prose-pre:text-blue-100 prose-a:text-blue-600 dark:prose-a:text-blue-400'
  }
  return 'prose-gray dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-green-800 dark:prose-code:text-green-200 prose-code:bg-green-100/60 dark:prose-code:bg-green-900/50 prose-pre:bg-green-100/60 dark:prose-pre:bg-green-900/50 prose-pre:text-green-900 dark:prose-pre:text-green-100 prose-a:text-green-600 dark:prose-a:text-green-400'
})

// Post-process HTML to add copy buttons and improve code blocks
const postProcessHTML = (html: string): string => {
  // Replace code blocks with enhanced versions - improved regex to handle special characters
  let result = html.replace(
    /<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/g,
    (match, language, code) => {
      // Decode HTML entities
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
      
      // Apply syntax highlighting to the decoded code
      const highlightedCode = highlightCode(decodedCode, language)
      const languageName = getLanguageName(language)
      
      return `
        <div class="code-block-container my-3 rounded-xl overflow-hidden border border-gray-300/30 bg-white/10 backdrop-blur-2xl shadow-lg dark:border-gray-600/40 dark:bg-gray-800/60 dark:shadow-black/30">
          <div class="code-block-header flex justify-between items-center px-4 py-3 bg-white/20 border-b border-gray-300/20 text-xs dark:bg-gray-800/80 dark:border-gray-600/30">
            <span class="code-block-language text-gray-600 font-semibold uppercase tracking-wider dark:text-gray-300">${languageName}</span>
            <button class="code-block-copy flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-blue-500/20 hover:border-blue-500/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/15 dark:bg-blue-400/10 dark:border-blue-400/20 dark:text-blue-400 dark:hover:bg-blue-400/20 dark:hover:border-blue-400/30 dark:hover:shadow-blue-400/15" onclick="copyToClipboard(this)" data-code="${encodeURIComponent(decodedCode)}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Kopieren
            </button>
          </div>
          <pre class="code-block-content m-0 p-4 bg-transparent overflow-x-auto font-mono text-sm leading-relaxed max-w-full overscroll-none scrollbar-thin scrollbar-thumb-gray-400/40 scrollbar-track-transparent dark:scrollbar-thumb-gray-600/40"><code class="hljs language-${language}">${highlightedCode}</code></pre>
        </div>
      `
    }
  )
  
  // Also handle code blocks without language class
  result = result.replace(
    /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
    (match, code) => {
      // Skip if already processed
      if (match.includes('code-block-container')) {
        return match
      }
      
      // Decode HTML entities
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
      
      // Auto-detect language
      const detectedLanguage = detectLanguage(decodedCode)
      const highlightedCode = highlightCode(decodedCode, detectedLanguage)
      const languageName = getLanguageName(detectedLanguage)
      
      return `
        <div class="code-block-container my-3 rounded-xl overflow-hidden border border-gray-300/30 bg-white/10 backdrop-blur-2xl shadow-lg dark:border-gray-600/40 dark:bg-gray-800/60 dark:shadow-black/30">
          <div class="code-block-header flex justify-between items-center px-4 py-3 bg-white/20 border-b border-gray-300/20 text-xs dark:bg-gray-800/80 dark:border-gray-600/30">
            <span class="code-block-language text-gray-600 font-semibold uppercase tracking-wider dark:text-gray-300">${languageName}</span>
            <button class="code-block-copy flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-blue-500/20 hover:border-blue-500/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/15 dark:bg-blue-400/10 dark:border-blue-400/20 dark:text-blue-400 dark:hover:bg-blue-400/20 dark:hover:border-blue-400/30 dark:hover:shadow-blue-400/15" onclick="copyToClipboard(this)" data-code="${encodeURIComponent(decodedCode)}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Kopieren
            </button>
          </div>
          <pre class="code-block-content m-0 p-4 bg-transparent overflow-x-auto font-mono text-sm leading-relaxed max-w-full overscroll-none scrollbar-thin scrollbar-thumb-gray-400/40 scrollbar-track-transparent dark:scrollbar-thumb-gray-600/40"><code class="hljs language-${detectedLanguage}">${highlightedCode}</code></pre>
        </div>
      `
    }
  )
  
  return result
}

// Compute rendered markdown
const renderedMessage = computed(() => {
  if (!props.message) return ''
  
  try {
    // Process markdown with syntax highlighting (synchronous)
    const result = marked(props.message)
    
    // Handle both string and Promise returns
    let htmlResult = ''
    if (typeof result === 'string') {
      htmlResult = result
    } else if (result && typeof result.then === 'function') {
      // If it's a Promise, return the original message for now
      console.warn('Marked returned a Promise, falling back to plain text')
      return props.message
    } else {
      htmlResult = String(result)
    }
    
    // Post-process to add copy buttons and enhance code blocks
    return postProcessHTML(htmlResult)
  } catch (error) {
    console.error('Markdown parsing error:', error)
    // Fallback to escaped HTML
    const div = document.createElement('div')
    div.textContent = props.message
    return div.innerHTML
  }
})

// Add copy to clipboard function to global scope
if (process.client) {
  (window as any).copyToClipboard = (button: HTMLElement) => {
    const code = decodeURIComponent(button.getAttribute('data-code') || '')
    navigator.clipboard.writeText(code).then(() => {
      const originalText = button.innerHTML
      button.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Kopiert!
      `
      setTimeout(() => {
        button.innerHTML = originalText
      }, 2000)
    }).catch(() => {
      console.error('Failed to copy code to clipboard')
    })
  }
}
</script>

<style scoped>
/* Import highlight.js theme for light mode */
@import 'highlight.js/styles/github.css';

/* Custom prose styles for better markdown integration */
:deep(.prose) {
  color: inherit !important;
  max-width: none !important;
}

/* Prose typography with Tailwind integration */
:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  @apply mt-3 mb-2 font-bold leading-tight text-inherit;
}

:deep(.prose p) {
  @apply my-2 leading-relaxed text-inherit;
}

:deep(.prose strong) {
  @apply font-bold text-inherit;
}

:deep(.prose ul) {
  @apply my-3 pl-6 text-inherit list-disc;
}

:deep(.prose ol) {
  @apply my-3 pl-6 text-inherit list-decimal;
}

:deep(.prose li) {
  @apply my-1 leading-normal text-inherit;
}

/* Inline code styling with Tailwind */
:deep(.prose code:not(.code-block-content code)) {
  @apply px-1 py-0.5 rounded-md text-sm font-semibold bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 dark:bg-blue-400/10 dark:border-blue-400/20 dark:text-blue-400 break-words font-mono;
}

:deep(.dark .prose code:not(.code-block-content code)) {
  @apply bg-blue-400/15 text-blue-200 border-blue-400/25;
}

/* Links with Tailwind */
:deep(.prose a) {
  @apply text-blue-600 underline font-medium transition-colors hover:text-blue-800;
}

:deep(.dark .prose a) {
  @apply text-blue-400 hover:text-blue-200;
}

/* Mobile responsive code blocks */
@media (max-width: 640px) {
  :deep(.code-block-container) {
    @apply my-2 rounded-lg max-w-[calc(100vw-4rem)];
  }
  
  :deep(.code-block-content) {
    @apply text-xs p-3 leading-snug;
  }
  
  :deep(.code-block-header) {
    @apply px-3 py-2 text-[0.6875rem];
  }
  
  :deep(.code-block-copy) {
    @apply px-2 py-1 text-[0.6875rem] gap-0.5;
  }
  
  :deep(.code-block-copy svg) {
    @apply w-3.5 h-3.5;
  }
  
  :deep(.prose code:not(.code-block-content code)) {
    @apply text-xs px-1.5 py-0.5;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  :deep(.code-block-container) {
    @apply my-1.5 max-w-[calc(100vw-3rem)];
  }
  
  :deep(.code-block-content) {
    @apply text-[0.6875rem] p-2 leading-tight;
  }
}
</style> 