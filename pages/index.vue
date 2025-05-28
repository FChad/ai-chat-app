<template>
  <div class="container mx-auto px-4 h-full">
    <div class="max-w-7xl mx-auto h-full flex flex-col py-6">
      <!-- Top Controls -->
      <div class="flex justify-between items-center mb-6">
        <!-- Model Selection - Top Left -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            KI-Modell
            <span v-if="conversationContext && messages.length > 0" class="text-yellow-400 text-xs ml-2">
              ⚠️ Wechsel setzt Kontext zurück
            </span>
          </label>
          <select
            v-model="selectedModel"
            :disabled="isTyping"
            class="px-4 py-2 bg-black/20 backdrop-blur-lg border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px] appearance-none cursor-pointer hover:bg-black/30 transition-colors"
            style="color-scheme: dark;"
            :title="conversationContext && messages.length > 0 ? 'Achtung: Modellwechsel setzt den Kontext zurück!' : 'Wähle ein KI-Modell'"
          >
            <option v-for="model in availableModels" :key="model.name" :value="model.name" class="bg-gray-800 text-white">
              {{ model.name }} ({{ model.details.parameter_size }})
            </option>
          </select>
        </div>

        <!-- Clear Conversation Button - Top Right -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">&nbsp;</label>
          <button
            @click="clearConversation"
            :disabled="messages.length === 0 || isTyping"
            class="px-4 py-2 bg-red-700/70 hover:bg-red-600 disabled:bg-red-800/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            :title="messages.length === 0 ? 'Keine Unterhaltung zum Löschen' : isTyping ? 'Warten bis Antwort fertig ist' : 'Unterhaltung löschen'"
          >
            <Icon name="heroicons:trash" class="h-4 w-4" />
            <span>Unterhaltung löschen</span>
          </button>
        </div>
      </div>

      <!-- Chat container -->
      <div class="flex-1 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 flex flex-col max-w-full min-h-0">
        <!-- Messages -->
        <div 
          ref="messagesContainer"
          @scroll="handleScroll"
          class="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-2 min-h-0"
        >
          <div v-if="messages.length === 0" class="text-center text-gray-400 mt-20">
            <Icon name="heroicons:chat-bubble-left-right" class="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Starte eine Unterhaltung!</p>
          </div>
          
          <ChatMessage
            v-for="(msg, index) in messages"
            :key="index"
            :message="msg.content"
            :is-user="msg.role === 'user'"
            :timestamp="msg.timestamp"
          />
          
          <!-- Typing indicator -->
          <ChatMessage
            v-if="isTyping"
            message=""
            :is-user="false"
            :is-typing="true"
            timestamp=""
          />
        </div>

        <!-- Input area -->
        <div class="p-6 border-t border-white/10">
          <form @submit.prevent="sendMessage" class="flex items-end space-x-4">
            <div class="flex-1">
              <textarea
                ref="textareaRef"
                v-model="newMessage"
                placeholder="Schreibe eine Nachricht... (Enter zum Senden, Shift+Enter für neue Zeile)"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[3rem] max-h-32 overflow-y-auto scrollbar-thin"
                :disabled="isTyping"
                @keydown="handleKeydown"
                rows="1"
              />
            </div>
            <button
              type="submit"
              :disabled="!newMessage.trim() || isTyping"
              class="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center space-x-2 flex-shrink-0 self-start"
            >
              <Icon name="heroicons:paper-airplane" class="h-5 w-5" />
              <span>Senden</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page title
useHead({
  title: 'ChadGPT - Chat mit KI'
})

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ModelDetails {
  parent_model: string
  format: string
  family: string
  families: string[] | null
  parameter_size: string
  quantization_level: string
}

interface OllamaModel {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details: ModelDetails
}

const messages = ref<Message[]>([])
const newMessage = ref('')
const isTyping = ref(false)
const messagesContainer = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const isAtBottom = ref(true)
const conversationContext = ref<number[] | null>(null)
const selectedModel = ref('gemma3:4b')
const availableModels = ref<OllamaModel[]>([])

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      isAtBottom.value = true
    }
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isTyping.value) return

  const userMessage = newMessage.value.trim()
  newMessage.value = ''
  
  // Reset textarea height
  nextTick(() => {
    autoResize()
  })

  // Add user message
  messages.value.push({
    role: 'user',
    content: userMessage,
    timestamp: formatTime(new Date())
  })

  scrollToBottom()
  isTyping.value = true

  try {
    const requestBody: any = {
      message: userMessage,
      model: selectedModel.value
    }

    // Add context if available
    if (conversationContext.value) {
      requestBody.context = conversationContext.value
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    let assistantMessage = ''
    const assistantMessageIndex = messages.value.length

    // Add empty assistant message
    messages.value.push({
      role: 'assistant',
      content: '',
      timestamp: formatTime(new Date())
    })

    isTyping.value = false
    scrollToBottom()

    const decoder = new TextDecoder()
    let lastResponseData: any = null
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line)
            lastResponseData = data
            if (data.response) {
              assistantMessage += data.response
              messages.value[assistantMessageIndex].content = assistantMessage
              // Only auto-scroll if user is at bottom
              if (isAtBottom.value) {
                scrollToBottom()
              }
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON
          }
        }
      }
    }

    // Update context from the last response
    if (lastResponseData && lastResponseData.context) {
      conversationContext.value = lastResponseData.context
    }

  } catch (error) {
    console.error('Error sending message:', error)
    isTyping.value = false
    
    // Add error message
    messages.value.push({
      role: 'assistant',
      content: 'Entschuldigung, es gab einen Fehler bei der Kommunikation mit der KI.',
      timestamp: formatTime(new Date())
    })
    
    scrollToBottom()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const autoResize = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

// Watch for changes in newMessage to auto-resize
watch(newMessage, () => {
  nextTick(() => {
    autoResize()
  })
})

// Auto-resize on mount
onMounted(async () => {
  try {
    const response = await fetch('/api/models')
    if (response.ok) {
      const data = await response.json()
      availableModels.value = data.models || []
      
      // Set default model if available
      if (availableModels.value.length > 0 && !selectedModel.value) {
        selectedModel.value = availableModels.value[0].name
      }
    }
  } catch (error) {
    console.error('Failed to load models:', error)
    // Fallback to default model
    availableModels.value = [{
      name: 'gemma3:4b',
      model: 'gemma3:4b',
      modified_at: '',
      size: 0,
      digest: '',
      details: {
        parent_model: '',
        format: 'gguf',
        family: 'gemma3',
        families: ['gemma3'],
        parameter_size: '4.3B',
        quantization_level: 'Q4_K_M'
      }
    }]
  }
  
  if (textareaRef.value) {
    autoResize()
  }
})

// Auto-scroll when new messages are added
watch(messages, () => {
  // Only auto-scroll if user is at bottom
  if (isAtBottom.value) {
    scrollToBottom()
  }
}, { deep: true })

const handleScroll = () => {
  if (messagesContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    // Check if user is at bottom (with small threshold)
    isAtBottom.value = scrollTop + clientHeight >= scrollHeight - 10
  }
}

const clearConversation = () => {
  if (isTyping.value) return
  messages.value = []
  conversationContext.value = null
}

// Watch for model changes and reset context
watch(selectedModel, (newModel, oldModel) => {
  if (oldModel && newModel !== oldModel && conversationContext.value) {
    // Reset context when model changes
    conversationContext.value = null
    
    // Add a system message to inform the user
    if (messages.value.length > 0) {
      messages.value.push({
        role: 'assistant',
        content: `🔄 Modell gewechselt zu **${newModel}**. Der Kontext wurde zurückgesetzt für eine neue Unterhaltung.`,
        timestamp: formatTime(new Date())
      })
      
      nextTick(() => {
        scrollToBottom()
      })
    }
  }
})
</script> 