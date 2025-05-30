<template>
  <div class="flex" :class="isUser ? 'justify-end' : 'justify-start'">
    <div class="flex max-w-[85%] sm:max-w-xs lg:max-w-4xl" :class="isUser ? 'flex-row-reverse' : 'flex-row'">
      <!-- Avatar -->
      <div class="flex-shrink-0" :class="isUser ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'">
        <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" 
             :class="avatarClasses">
          <Icon 
            :name="avatarIcon" 
            class="h-3 w-3 sm:h-5 sm:w-5 text-white flex-shrink-0" 
          />
        </div>
      </div>
      
      <!-- Message bubble -->
      <div class="relative">
        <div class="px-2 py-1 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl text-sm sm:text-base" 
             :class="bubbleClasses">
          
          <!-- Typing indicator -->
          <div v-if="isTyping" class="flex items-center space-x-1">
            <div class="typing-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full"></div>
            <div class="typing-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full"></div>
            <div class="typing-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full"></div>
          </div>
          
          <!-- Message content with markdown support -->
          <div v-else class="prose prose-sm max-w-none" :class="proseClasses">
            <div v-html="renderedMessage"></div>
          </div>
        </div>
        
        <!-- Timestamp -->
        <div v-if="timestamp" class="text-xs text-gray-400 mt-1" :class="isUser ? 'text-right' : 'text-left'">
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
  if (props.isUser) return 'bg-purple-600'
  if (props.isAi) return 'bg-blue-600'
  return 'bg-green-600'
})

const avatarIcon = computed(() => {
  if (props.isUser) return 'heroicons:user'
  if (props.isAi) return 'heroicons:cpu-chip'
  return 'heroicons:sparkles'
})

const bubbleClasses = computed(() => {
  if (props.isUser) {
    return 'bg-teal-700 text-white'
  }
  if (props.isAi) {
    return 'bg-blue-600/20 text-blue-100 border border-blue-500/30'
  }
  return 'bg-green-600/20 text-green-100 border border-green-500/30'
})

const proseClasses = computed(() => {
  if (props.isUser) {
    return 'prose-invert prose-headings:text-white prose-strong:text-white prose-code:text-purple-200 prose-code:bg-purple-800/50 prose-pre:bg-purple-800/50 prose-pre:text-purple-100'
  }
  if (props.isAi) {
    return 'prose-blue prose-headings:text-blue-100 prose-strong:text-blue-100 prose-code:text-blue-200 prose-code:bg-blue-900/50 prose-pre:bg-blue-900/50 prose-pre:text-blue-100 prose-a:text-blue-300'
  }
  return 'prose-green prose-headings:text-green-100 prose-strong:text-green-100 prose-code:text-green-200 prose-code:bg-green-900/50 prose-pre:bg-green-900/50 prose-pre:text-green-100 prose-a:text-green-300'
})

// Post-process HTML to add copy buttons and improve code blocks
const postProcessHTML = (html: string): string => {
  // Replace code blocks with enhanced versions
  return html.replace(
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
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
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Kopieren
            </button>
          </div>
          <pre class="code-block-content"><code class="hljs language-${language}">${highlightedCode}</code></pre>
        </div>
      `
    }
  )
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
/* Import highlight.js theme */
@import 'highlight.js/styles/github-dark.css';

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

/* Custom styles for markdown elements */
:deep(.prose) {
  color: inherit;
  max-width: none;
}

/* Code block styling */
:deep(.code-block-container) {
  margin: 0.75rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
}

:deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
}

:deep(.code-block-language) {
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.code-block-copy) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0.25rem;
  color: #94a3b8;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.code-block-copy:hover) {
  background: rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
}

:deep(.code-block-content) {
  margin: 0;
  padding: 1rem;
  background: transparent;
  overflow-x: auto;
  font-family: 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

:deep(.code-block-content code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
  display: block;
  white-space: pre;
}

/* Inline code styling */
:deep(.inline-code) {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  font-weight: 600;
}

/* Headings */
:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  margin-top: 0.5rem;
  margin-bottom: 0.3rem;
  font-weight: 700;
  line-height: 1.3;
}

:deep(.prose h1) { 
  font-size: 1.2rem;
  color: inherit;
}
:deep(.prose h2) { 
  font-size: 1.1rem;
  color: inherit;
}
:deep(.prose h3) { 
  font-size: 1rem;
  color: inherit;
}

/* Paragraphs */
:deep(.prose p) {
  margin-top: 0.3rem;
  margin-bottom: 0.3rem;
  line-height: 1.4;
  color: inherit;
}

/* Strong/Bold text */
:deep(.prose strong) {
  font-weight: 700;
  color: inherit;
  text-shadow: 0 0 1px currentColor;
}

/* Lists */
:deep(.prose ul),
:deep(.prose ol) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  color: inherit;
}

:deep(.prose ul) {
  list-style-type: disc;
}

:deep(.prose ol) {
  list-style-type: decimal;
}

:deep(.prose li) {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  line-height: 1.4;
  color: inherit;
  position: relative;
}

/* Custom bullet points */
:deep(.prose ul li::marker) {
  color: inherit;
  font-weight: bold;
  font-size: 1.1em;
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
  margin-top: 0.3rem;
  margin-bottom: 0.3rem;
  padding-left: 1rem;
}

/* Links */
:deep(.prose a) {
  text-decoration: underline;
  font-weight: 500;
}

:deep(.prose a:hover) {
  opacity: 0.8;
}

/* Blockquotes */
:deep(.prose blockquote) {
  border-left: 4px solid currentColor;
  padding-left: 1rem;
  margin: 0.5rem 0;
  opacity: 0.8;
  font-style: italic;
}

/* Tables */
:deep(.prose table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
}

:deep(.prose th),
:deep(.prose td) {
  border: 1px solid currentColor;
  padding: 0.5rem;
  text-align: left;
}

:deep(.prose th) {
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.1);
}

/* Enhanced highlight.js integration */
:deep(.hljs) {
  background: transparent !important;
  color: #e2e8f0 !important;
  padding: 0 !important;
  display: block !important;
  overflow-x: auto !important;
}

/* Force proper code block styling */
:deep(pre code) {
  background: transparent !important;
  color: inherit !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-family: 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace !important;
}

/* Override any conflicting prose styles */
:deep(.prose pre) {
  background: transparent !important;
  color: inherit !important;
  border: none !important;
}

:deep(.prose code) {
  background: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
}

/* Improved syntax highlighting colors for dark theme */
:deep(.hljs-keyword),
:deep(.hljs-selector-tag),
:deep(.hljs-literal),
:deep(.hljs-section),
:deep(.hljs-link) { 
  color: #c792ea !important; 
  font-weight: 600 !important;
}

:deep(.hljs-string),
:deep(.hljs-attr) { 
  color: #c3e88d !important; 
}

:deep(.hljs-number),
:deep(.hljs-regexp),
:deep(.hljs-addition) { 
  color: #f78c6c !important; 
}

:deep(.hljs-comment),
:deep(.hljs-quote),
:deep(.hljs-deletion) { 
  color: #546e7a !important; 
  font-style: italic !important; 
}

:deep(.hljs-function),
:deep(.hljs-title),
:deep(.hljs-class) { 
  color: #82aaff !important; 
  font-weight: 600 !important;
}

:deep(.hljs-variable),
:deep(.hljs-template-variable),
:deep(.hljs-name) { 
  color: #eeffff !important; 
}

:deep(.hljs-type),
:deep(.hljs-built_in),
:deep(.hljs-builtin-name) { 
  color: #ffcb6b !important; 
  font-weight: 500 !important;
}

:deep(.hljs-tag),
:deep(.hljs-selector-id),
:deep(.hljs-selector-class) { 
  color: #f07178 !important; 
}

:deep(.hljs-attribute),
:deep(.hljs-symbol),
:deep(.hljs-bullet) { 
  color: #c792ea !important; 
}

:deep(.hljs-operator),
:deep(.hljs-punctuation) { 
  color: #89ddff !important; 
}

:deep(.hljs-meta),
:deep(.hljs-meta-keyword) { 
  color: #ffcb6b !important; 
}

:deep(.hljs-emphasis) { 
  font-style: italic !important; 
}

:deep(.hljs-strong) { 
  font-weight: bold !important; 
}

/* PHP specific highlighting */
:deep(.hljs-meta.hljs-keyword) { 
  color: #c792ea !important; 
}

:deep(.hljs-variable.hljs-language_) { 
  color: #f07178 !important; 
}

/* Ensure proper spacing and formatting */
:deep(.code-block-content .hljs) {
  line-height: 1.5 !important;
  tab-size: 2 !important;
  -moz-tab-size: 2 !important;
  -o-tab-size: 2 !important;
  white-space: pre !important;
  word-wrap: normal !important;
}
</style> 