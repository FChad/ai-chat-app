<template>
  <!-- Image Modal -->
  <Teleport to="body">
    <div v-if="showImageModal" @click="closeImageModal"
      class="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 animate-fade-in">
      <Button variant="ghost" size="icon" @click="closeImageModal"
        class="absolute top-4 right-4 bg-card hover:bg-muted rounded-full">
        <Icon name="heroicons:x-mark" class="h-6 w-6" />
      </Button>
      <img :src="selectedImageUrl" alt="Full size image" class="max-w-full max-h-full object-contain rounded-lg"
        @click.stop />
    </div>
  </Teleport>

  <!-- User message (left-aligned, same as AI) -->
  <div v-if="isUser"
    class="flex gap-2 px-2 hover:bg-accent/40 group animate-fade-in"
    :class="isGrouped ? '' : 'mt-3'">
    <!-- Left column: avatar or time-on-hover -->
    <div class="w-8 shrink-0 flex justify-center pt-1">
      <Avatar v-if="!isGrouped" class="size-8">
        <AvatarFallback class="bg-primary text-primary-foreground text-xs">
          <Icon name="heroicons:user" class="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <time v-else :datetime="timestamp"
        class="text-muted-foreground text-[10px] opacity-0 group-hover:opacity-100 transition-opacity leading-none mt-2">
        {{ shortTime }}
      </time>
    </div>
    <!-- Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <div v-if="!isGrouped" class="flex items-center gap-2 text-sm mb-0.5">
        <span class="font-medium">You</span>
        <time :datetime="timestamp" class="text-xs text-muted-foreground">{{ formattedTimestamp }}</time>
      </div>
      <div class="text-sm wrap-break-word" v-html="renderedMessage" />
      <div v-if="images && images.length > 0" :class="message ? 'mt-2' : ''" class="flex flex-wrap gap-2">
        <img v-for="(img, idx) in images" :key="idx"
          :src="img.url" :alt="img.name || 'Image'"
          class="max-w-xs max-h-48 object-contain rounded-lg border border-border cursor-pointer hover:opacity-90 transition-all"
          @click="openImageModal(img.url)" />
      </div>
    </div>
  </div>

  <!-- AI message (left-aligned) -->
  <div v-else
    class="flex gap-2 px-2 hover:bg-accent/40 group animate-fade-in"
    :class="isGrouped ? '' : 'mt-3'">
    <!-- Left column: avatar or time-on-hover -->
    <div class="w-8 shrink-0 flex justify-center pt-1">
      <Avatar v-if="!isGrouped" class="size-8">
        <AvatarFallback class="bg-secondary text-secondary-foreground text-xs">
          <Icon name="heroicons:cpu-chip" class="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <time v-else :datetime="timestamp"
        class="text-muted-foreground text-[10px] opacity-0 group-hover:opacity-100 transition-opacity leading-none mt-2">
        {{ shortTime }}
      </time>
    </div>
    <!-- Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <div v-if="!isGrouped" class="flex items-center gap-2 text-sm mb-0.5">
        <span class="font-medium">AI Assistant</span>
        <time :datetime="timestamp" class="text-xs text-muted-foreground">{{ formattedTimestamp }}</time>
      </div>
      <div v-if="message" class="prose prose-sm max-w-none text-sm" :class="proseClasses">
        <div v-html="renderedMessage" />
      </div>
      <div v-if="images && images.length > 0" :class="message ? 'mt-2' : ''" class="flex flex-wrap gap-2">
        <img v-for="(img, idx) in images" :key="idx"
          :src="img.url" :alt="img.name || 'Image'"
          class="max-w-xs max-h-48 object-contain rounded-lg border border-border cursor-pointer hover:opacity-90 transition-all"
          @click="openImageModal(img.url)" />
      </div>
      <!-- Typing indicator -->
      <div v-if="isTyping" class="flex items-center gap-1.5 py-1" :class="message ? 'mt-2' : ''">
        <div class="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing" />
        <div class="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing [animation-delay:-0.16s]" />
        <div class="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing [animation-delay:-0.32s]" />
        <span class="text-xs ml-1 text-muted-foreground">thinking…</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { useChatStore } from '@/stores/chat'

interface Props {
  message: string
  isUser: boolean
  isAi?: boolean
  isTyping?: boolean
  isStreaming?: boolean
  isGrouped?: boolean
  timestamp: string
  images?: Array<{
    url: string
    name?: string
  }>
}

const chatStore = useChatStore()

const props = withDefaults(defineProps<Props>(), {
  isAi: false,
  isTyping: false,
  isStreaming: false,
  isGrouped: false
})

const { highlightCode, getLanguageName, configureHighlight, detectLanguage } = useHighlight()

const showImageModal = ref(false)
const selectedImageUrl = ref('')

// Memoization cache for rendered markdown
// Using a Map with message content as key to avoid re-parsing unchanged content
const renderCache = new Map<string, { html: string; timestamp: number }>()
const CACHE_MAX_SIZE = 50 // Limit cache size to prevent memory issues
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes TTL

// Generate cache key from message content and streaming state
const getCacheKey = (content: string, isStreaming: boolean): string => {
  // Don't cache streaming messages as they change frequently
  if (isStreaming) return ''
  return content
}

// Clean old cache entries
const cleanCache = () => {
  const now = Date.now()
  for (const [key, value] of renderCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      renderCache.delete(key)
    }
  }
  // If still over limit, remove oldest entries
  if (renderCache.size > CACHE_MAX_SIZE) {
    const entries = Array.from(renderCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toRemove = entries.slice(0, entries.length - CACHE_MAX_SIZE)
    toRemove.forEach(([key]) => renderCache.delete(key))
  }
}

const openImageModal = (url: string) => {
  selectedImageUrl.value = url
  showImageModal.value = true
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden'
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImageUrl.value = ''
  // Restore body scroll
  document.body.style.overflow = ''
}

// Close modal on Escape key
onMounted(() => {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && showImageModal.value) {
      closeImageModal()
    }
  }
  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

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

// Short time (HH:MM) for grouped message hover
const shortTime = computed(() => {
  if (!props.timestamp) return ''
  try {
    return new Date(props.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: chatStore.isTimeFormat12h
    })
  } catch {
    return ''
  }
})

// Format timestamp for display
const formattedTimestamp = computed(() => {
  if (!props.timestamp) return ''

  try {
    const date = new Date(props.timestamp)
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: chatStore.isTimeFormat12h
    })
  } catch (error) {
    // If timestamp is already formatted or invalid, return as is
    return props.timestamp
  }
})

const proseClasses = computed(() => {
  return 'prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary'
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
        <div class="code-block-container">
          <div class="code-block-header">
            <span class="code-block-language">${languageName}</span>
            <button class="code-block-copy" onclick="copyToClipboard(this)" data-code="${encodeURIComponent(decodedCode)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Copy
            </button>
          </div>
          <pre class="code-block-content scrollbar-thin"><code class="hljs language-${language}">${highlightedCode}</code></pre>
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
        <div class="code-block-container">
          <div class="code-block-header">
            <span class="code-block-language">${languageName}</span>
            <button class="code-block-copy" onclick="copyToClipboard(this)" data-code="${encodeURIComponent(decodedCode)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Copy
            </button>
          </div>
          <pre class="code-block-content scrollbar-thin"><code class="hljs language-${detectedLanguage}">${highlightedCode}</code></pre>
        </div>
      `
    }
  )

  return result
}

// Compute rendered markdown with memoization
const renderedMessage = computed(() => {
  if (!props.message) return ''

  // User messages should not be rendered as Markdown - just escape HTML
  if (props.isUser) {
    return escapeHtml(props.message)
  }

  try {
    // For AI messages, split into stable and streaming tail to avoid flicker during streaming
    const shouldSplit = props.isAi && props.isStreaming
    const { safe, tail } = shouldSplit ? splitStreamingSafe(props.message) : { safe: props.message, tail: '' }

    // Check cache for non-streaming, stable content
    const cacheKey = getCacheKey(safe, props.isStreaming || false)
    if (cacheKey && renderCache.has(cacheKey)) {
      const cached = renderCache.get(cacheKey)!
      // For streaming with tail, append the tail
      if (tail) {
        return cached.html + `<span class="streaming-tail">${escapeHtml(tail)}</span>`
      }
      return cached.html
    }

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

    // Cache the result for non-streaming content
    if (cacheKey) {
      renderCache.set(cacheKey, { html: enhanced, timestamp: Date.now() })
      // Periodically clean cache
      if (renderCache.size > CACHE_MAX_SIZE * 0.8) {
        cleanCache()
      }
    }

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
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Copied!
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

/* Always reset hljs background — the code-block-content bg takes over */
:deep(.hljs) {
  background: transparent !important;
  padding: 0;
}

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
  padding: 0.2em 0.4em;
  border-radius: calc(var(--radius) - 4px);
  font-size: 0.875em;
  font-weight: 500;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-word;
  background-color: var(--muted);
  border: 1px solid var(--border);
  color: var(--foreground);
}

:deep(.prose code:not(.code-block-content code)::before),
:deep(.prose code:not(.code-block-content code)::after) {
  content: none;
}

/* Links */
:deep(.prose a) {
  color: var(--primary);
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.15s, opacity 0.15s;
}

:deep(.prose a:hover) {
  opacity: 0.8;
}

/* Code block chrome */
:deep(.code-block-container) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
}

:deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: var(--muted);
  border-bottom: 1px solid var(--border);
}

:deep(.code-block-language) {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

:deep(.code-block-copy) {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: calc(var(--radius) - 4px);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-foreground);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

:deep(.code-block-copy:hover) {
  background-color: var(--accent);
  color: var(--accent-foreground);
}

:deep(.code-block-content) {
  margin: 0;
  padding: 1rem;
  background-color: var(--card);
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.7;
  tab-size: 2;
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