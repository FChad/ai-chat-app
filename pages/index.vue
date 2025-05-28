<template>
  <div class="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
    <div class="max-w-4xl mx-auto h-full flex flex-col">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-white mb-2">ChadGPT</h1>
        <p class="text-gray-300">Chatte mit Chad's KI-Assistant</p>
      </div>

      <!-- Chat container -->
      <div class="flex-1 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 flex flex-col max-w-full min-h-0">
        <!-- Messages -->
        <div 
          ref="messagesContainer"
          class="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-4 min-h-0"
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

const messages = ref<Message[]>([])
const newMessage = ref('')
const isTyping = ref(false)
const messagesContainer = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()

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
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage
      })
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
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line)
            if (data.response) {
              assistantMessage += data.response
              messages.value[assistantMessageIndex].content = assistantMessage
              scrollToBottom()
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON
          }
        }
      }
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
onMounted(() => {
  if (textareaRef.value) {
    autoResize()
  }
})

// Auto-scroll when new messages are added
watch(messages, () => {
  scrollToBottom()
}, { deep: true })
</script> 