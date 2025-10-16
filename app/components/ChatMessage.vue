<template>
  <div class="flex animate-fade-in" :class="isUser ? 'justify-end' : 'justify-start'">
    <div class="flex max-w-[95%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-4xl"
      :class="isUser ? 'flex-row-reverse' : 'flex-row'">
      <!-- Avatar -->
      <div class="flex-shrink-0" :class="isUser ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'">
        <div class="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center" :class="avatarClasses">
          <Icon :name="avatarIcon" class="h-3 w-3 sm:h-5 sm:w-5 text-white flex-shrink-0" />
        </div>
      </div>

      <!-- Message bubble -->
      <div class="relative min-w-0 flex-1">
        <div class="px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base border" :class="bubbleClasses">

          <!-- Message content with markdown support -->
          <div v-if="message" class="prose prose-sm max-w-none text-inherit" :class="proseClasses">
            <div v-html="renderedMessage"></div>
          </div>

          <!-- Typing indicator shown below the message content when AI is typing -->
          <div v-if="isTyping" class="flex items-center space-x-1"
            :class="message ? 'mt-3 pt-3 border-t border-gray-200 dark:border-gray-700' : ''">
            <div class="typing-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-typing"></div>
            <div
              class="typing-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-typing [animation-delay:-0.16s]">
            </div>
            <div
              class="typing-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-typing [animation-delay:-0.32s]">
            </div>
            <span class="text-xs sm:text-sm ml-2 opacity-70">tippt...</span>
          </div>
        </div>

        <!-- Timestamp -->
        <div v-if="timestamp" class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium"
          :class="isUser ? 'text-right' : 'text-left'">
          {{ formattedTimestamp }}
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
  isStreaming?: boolean
  timestamp: string
}

const props = withDefaults(defineProps<Props>(), {
  isAi: false,
  isTyping: false,
  isStreaming: false
})

const { highlightCode, getLanguageName, configureHighlight, detectLanguage } = useHighlight()

// Escape helper for rendering the unfinished streaming tail as plain text
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Split message into a stable (safe to markdown-parse) part and a tail that is still streaming
// Heuristics:
// - If there is an unclosed fenced code block (odd count of ```), everything from the last ``` is tail
// - Otherwise, if the message does not end with a newline, treat the last line as tail to avoid
//   transient markdown (e.g., lists or horizontal rules) flicker while the line is incomplete
const splitStreamingSafe = (input: string): { safe: string; tail: string } => {
  if (!input) return { safe: '', tail: '' }

  let cutIndex = input.length

  // Detect unclosed fenced code block
  const fenceRegex = /```/g
  let fenceCount = 0
  let match: RegExpExecArray | null
  let lastFenceIndex = -1
  while ((match = fenceRegex.exec(input)) !== null) {
    fenceCount++
    lastFenceIndex = match.index
  }
  const hasUnclosedFence = fenceCount % 2 === 1
  if (hasUnclosedFence && lastFenceIndex >= 0) {
    cutIndex = Math.min(cutIndex, lastFenceIndex)
  }

  // If not ending with newline, avoid parsing the last incomplete line
  if (!input.endsWith('\n')) {
    const lastNewline = input.lastIndexOf('\n')
    const incompleteLineStart = lastNewline >= 0 ? lastNewline + 1 : 0
    cutIndex = Math.min(cutIndex, incompleteLineStart)
  }

  if (cutIndex < input.length) {
    return { safe: input.slice(0, cutIndex), tail: input.slice(cutIndex) }
  }
  return { safe: input, tail: '' }
}

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
  if (props.isUser) return 'bg-primary-600 dark:bg-primary-500'
  if (props.isAi) return 'bg-blue-600 dark:bg-blue-500'
  return 'bg-green-600 dark:bg-green-500'
})

// Format timestamp for display
const formattedTimestamp = computed(() => {
  if (!props.timestamp) return ''

  try {
    const date = new Date(props.timestamp)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    // If timestamp is already formatted or invalid, return as is
    return props.timestamp
  }
})

const avatarIcon = computed(() => {
  if (props.isUser) return 'heroicons:user'
  if (props.isAi) return 'heroicons:cpu-chip'
  return 'heroicons:sparkles'
})

const bubbleClasses = computed(() => {
  // Both user and AI messages now use the same styling
  return 'bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600'
})

const proseClasses = computed(() => {
  // Both user and AI messages now use the same styling
  return 'prose-gray dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-primary-700 dark:prose-code:text-primary-300 prose-code:bg-primary-100 dark:prose-code:bg-primary-900/30 prose-pre:bg-primary-100 dark:prose-pre:bg-primary-900/30 prose-pre:text-primary-900 dark:prose-pre:text-primary-100 prose-a:text-primary-600 dark:prose-a:text-primary-400'
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
        <div class="code-block-container my-3 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800">
          <div class="code-block-header flex justify-between items-center px-4 py-3 bg-gray-200 border-b border-gray-300 text-xs dark:bg-gray-700 dark:border-gray-600">
            <span class="code-block-language text-gray-600 font-semibold uppercase tracking-wider dark:text-gray-300">${languageName}</span>
            <button class="code-block-copy flex items-center gap-1 px-3 py-1.5 bg-primary-100 border border-primary-200 rounded-lg text-primary-700 text-xs font-medium cursor-pointer transition-colors duration-200 hover:bg-primary-200 hover:border-primary-300 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800/40 dark:hover:border-primary-600" onclick="copyToClipboard(this)" data-code="${encodeURIComponent(decodedCode)}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Kopieren
            </button>
          </div>
          <pre class="code-block-content m-0 p-4 bg-transparent overflow-x-auto font-mono text-sm leading-relaxed max-w-full overscroll-none scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent dark:scrollbar-thumb-gray-600"><code class="hljs language-${language}">${highlightedCode}</code></pre>
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
        <div class="code-block-container my-3 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800">
          <div class="code-block-header flex justify-between items-center px-4 py-3 bg-gray-200 border-b border-gray-300 text-xs dark:bg-gray-700 dark:border-gray-600">
            <span class="code-block-language text-gray-600 font-semibold uppercase tracking-wider dark:text-gray-300">${languageName}</span>
            <button class="code-block-copy flex items-center gap-1 px-3 py-1.5 bg-primary-100 border border-primary-200 rounded-lg text-primary-700 text-xs font-medium cursor-pointer transition-colors duration-200 hover:bg-primary-200 hover:border-primary-300 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800/40 dark:hover:border-primary-600" onclick="copyToClipboard(this)" data-code="${encodeURIComponent(decodedCode)}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Kopieren
            </button>
          </div>
          <pre class="code-block-content m-0 p-4 bg-transparent overflow-x-auto font-mono text-sm leading-relaxed max-w-full overscroll-none scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent dark:scrollbar-thumb-gray-600"><code class="hljs language-${detectedLanguage}">${highlightedCode}</code></pre>
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
    // For AI messages, split into stable and streaming tail to avoid flicker during streaming
    // For user messages, render completely without the split to preserve formatting
    const shouldSplit = props.isAi && props.isStreaming
    const { safe, tail } = shouldSplit ? splitStreamingSafe(props.message) : { safe: props.message, tail: '' }

    // Process markdown with syntax highlighting (synchronous) for stable part only
    const result = marked(safe)

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
    const enhanced = postProcessHTML(htmlResult)

    // Append the unparsed tail as escaped plaintext to prevent transient formatting
    if (tail) {
      return enhanced + `<span class="streaming-tail">${escapeHtml(tail)}</span>`
    }
    return enhanced
  } catch (error) {
    console.error('Markdown parsing error:', error)
    // Fallback to escaped HTML
    const div = document.createElement('div')
    div.textContent = props.message
    return div.innerHTML
  }
})

// Add copy to clipboard function to global scope
if (typeof window !== 'undefined') {
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
/* Import highlight.js themes for light and dark modes */
@import 'highlight.js/styles/github.css';

/* Dark mode highlight.js theme */
@media (prefers-color-scheme: dark) {
  :deep(.hljs) {
    background: transparent !important;
    color: inherit !important;
  }

  :deep(.hljs-doctag),
  :deep(.hljs-keyword),
  :deep(.hljs-meta .hljs-keyword),
  :deep(.hljs-template-tag),
  :deep(.hljs-template-variable),
  :deep(.hljs-type),
  :deep(.hljs-variable.language_) {
    color: #ff7b72 !important;
  }

  :deep(.hljs-title),
  :deep(.hljs-title.class_),
  :deep(.hljs-title.class_.inherited__),
  :deep(.hljs-title.function_) {
    color: #d2a8ff !important;
  }

  :deep(.hljs-attr),
  :deep(.hljs-attribute),
  :deep(.hljs-literal),
  :deep(.hljs-meta),
  :deep(.hljs-number),
  :deep(.hljs-operator),
  :deep(.hljs-selector-attr),
  :deep(.hljs-selector-class),
  :deep(.hljs-selector-id),
  :deep(.hljs-variable) {
    color: #44a8ff !important;
  }

  :deep(.hljs-string),
  :deep(.hljs-meta .hljs-string),
  :deep(.hljs-regexp) {
    color: #ffb341 !important;
  }

  :deep(.hljs-built_in),
  :deep(.hljs-symbol) {
    color: #ffa657 !important;
  }

  :deep(.hljs-code),
  :deep(.hljs-comment),
  :deep(.hljs-formula) {
    color: #8b949e !important;
  }

  :deep(.hljs-name),
  :deep(.hljs-quote),
  :deep(.hljs-selector-pseudo),
  :deep(.hljs-selector-tag) {
    color: #7ee787 !important;
  }

  :deep(.hljs-subst) {
    color: #e6edf3 !important;
  }

  :deep(.hljs-section) {
    color: #1f6feb !important;
    font-weight: bold;
  }

  :deep(.hljs-bullet) {
    color: #f2cc60 !important;
  }

  :deep(.hljs-emphasis) {
    color: #e6edf3 !important;
    font-style: italic;
  }

  :deep(.hljs-strong) {
    color: #e6edf3 !important;
    font-weight: bold;
  }

  :deep(.hljs-addition) {
    color: #aff5b4 !important;
    background-color: #033a16 !important;
  }

  :deep(.hljs-deletion) {
    color: #ffdcd7 !important;
    background-color: #67060c !important;
  }
}

/* Dark mode class-based theme for Nuxt color mode */
.dark :deep(.hljs) {
  background: transparent !important;
  color: #e6edf3 !important;
}

.dark :deep(.hljs-doctag),
.dark :deep(.hljs-keyword),
.dark :deep(.hljs-meta .hljs-keyword),
.dark :deep(.hljs-template-tag),
.dark :deep(.hljs-template-variable),
.dark :deep(.hljs-type),
.dark :deep(.hljs-variable.language_) {
  color: #ff7b72 !important;
}

.dark :deep(.hljs-title),
.dark :deep(.hljs-title.class_),
.dark :deep(.hljs-title.class_.inherited__),
.dark :deep(.hljs-title.function_) {
  color: #d2a8ff !important;
}

.dark :deep(.hljs-attr),
.dark :deep(.hljs-attribute),
.dark :deep(.hljs-literal),
.dark :deep(.hljs-meta),
.dark :deep(.hljs-number),
.dark :deep(.hljs-operator),
.dark :deep(.hljs-selector-attr),
.dark :deep(.hljs-selector-class),
.dark :deep(.hljs-selector-id),
.dark :deep(.hljs-variable) {
  color: #79c0ff !important;
}

.dark :deep(.hljs-string),
.dark :deep(.hljs-meta .hljs-string),
.dark :deep(.hljs-regexp) {
  color: #a5d6ff !important;
}

.dark :deep(.hljs-built_in),
.dark :deep(.hljs-symbol) {
  color: #ffa657 !important;
}

.dark :deep(.hljs-code),
.dark :deep(.hljs-comment),
.dark :deep(.hljs-formula) {
  color: #8b949e !important;
}

.dark :deep(.hljs-name),
.dark :deep(.hljs-quote),
.dark :deep(.hljs-selector-pseudo),
.dark :deep(.hljs-selector-tag) {
  color: #7ee787 !important;
}

.dark :deep(.hljs-subst) {
  color: #e6edf3 !important;
}

.dark :deep(.hljs-section) {
  color: #1f6feb !important;
  font-weight: bold;
}

.dark :deep(.hljs-bullet) {
  color: #f2cc60 !important;
}

.dark :deep(.hljs-emphasis) {
  color: #e6edf3 !important;
  font-style: italic;
}

.dark :deep(.hljs-strong) {
  color: #e6edf3 !important;
  font-weight: bold;
}

.dark :deep(.hljs-addition) {
  color: #aff5b4 !important;
  background-color: #033a16 !important;
}

.dark :deep(.hljs-deletion) {
  color: #ffdcd7 !important;
  background-color: #67060c !important;
}

/* Custom prose styles for better markdown integration */
:deep(.prose) {
  color: inherit !important;
  max-width: none !important;
}

/* Prose typography with standard CSS */
:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  line-height: 1.25;
  color: inherit;
}

:deep(.prose p) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.625;
  color: inherit;
}

:deep(.prose strong) {
  font-weight: 700;
  color: inherit;
}

:deep(.prose ul) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  color: inherit;
  list-style-type: disc;
}

:deep(.prose ol) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  color: inherit;
  list-style-type: decimal;
}

:deep(.prose li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  line-height: 1.5;
  color: inherit;
}

/* Inline code styling */
:deep(.prose code:not(.code-block-content code)) {
  padding: 0.125rem 0.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-word;
}

:deep(.prose code:not(.code-block-content code)) {
  background-color: rgb(219 234 254);
  border: 1px solid rgb(191 219 254);
  color: rgb(29 78 216);
}

:deep(.dark .prose code:not(.code-block-content code)) {
  background-color: rgb(29 78 216 / 0.3);
  color: rgb(147 197 253);
  border-color: rgb(29 78 216 / 0.5);
}

/* Links */
:deep(.prose a) {
  color: rgb(37 99 235);
  text-decoration: underline;
  font-weight: 500;
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

:deep(.prose a:hover) {
  color: rgb(29 78 216);
}

:deep(.dark .prose a) {
  color: rgb(96 165 250);
}

:deep(.dark .prose a:hover) {
  color: rgb(147 197 253);
}

/* Mobile responsive code blocks */
@media (max-width: 640px) {
  :deep(.code-block-container) {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 0.5rem;
    max-width: calc(100vw - 4rem);
  }

  :deep(.code-block-content) {
    font-size: 0.75rem;
    padding: 0.75rem;
    line-height: 1.375;
  }

  :deep(.code-block-header) {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    font-size: 0.6875rem;
  }

  :deep(.code-block-copy) {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
    font-size: 0.6875rem;
    gap: 0.125rem;
  }

  :deep(.code-block-copy svg) {
    width: 0.875rem;
    height: 0.875rem;
  }

  :deep(.prose code:not(.code-block-content code)) {
    font-size: 0.75rem;
    padding-left: 0.375rem;
    padding-right: 0.375rem;
    padding-top: 0.125rem;
    padding-bottom: 0.125rem;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  :deep(.code-block-container) {
    margin-top: 0.375rem;
    margin-bottom: 0.375rem;
    max-width: calc(100vw - 3rem);
  }

  :deep(.code-block-content) {
    font-size: 0.6875rem;
    padding: 0.5rem;
    line-height: 1.25;
  }
}
</style>