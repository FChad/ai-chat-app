<template>
  <div class="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
    <div class="max-w-6xl mx-auto h-full flex flex-col">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-white mb-2">ChadGPT Arena</h1>
        <p class="text-gray-300">Lass Chad's KI-Modelle miteinander sprechen</p>
      </div>

      <!-- Controls -->
      <div class="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-6">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Max. Nachrichten</label>
              <input
                v-model.number="maxMessages"
                type="number"
                min="1"
                max="50"
                class="w-24 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                :disabled="isRunning"
              />
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" :class="isRunning ? 'bg-green-500' : 'bg-gray-500'"></div>
              <span class="text-sm text-gray-400">{{ isRunning ? 'Läuft' : 'Gestoppt' }}</span>
            </div>
            <div class="text-sm text-gray-400">Nachrichten: {{ messages.length }}/{{ maxMessages }}</div>
            <div v-if="isRunning" class="flex items-center space-x-2">
              <Icon name="heroicons:cpu-chip" class="h-4 w-4" :class="currentSpeaker === 'ai1' ? 'text-blue-400' : 'text-green-400'" />
              <span class="text-sm text-gray-400">{{ currentSpeaker === 'ai1' ? 'KI 1' : 'KI 2' }} spricht...</span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              @click="startConversation"
              :disabled="!initialMessage.trim() || isRunning"
              class="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Icon name="heroicons:play" class="h-5 w-5" />
              <span>Start</span>
            </button>
            <button
              @click="stopConversation"
              :disabled="!isRunning"
              class="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <Icon name="heroicons:stop" class="h-5 w-5" />
            </button>
            <button
              @click="clearConversation"
              :disabled="isRunning"
              class="px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <Icon name="heroicons:trash" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Chat container -->
      <div class="flex-1 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 flex flex-col max-w-full min-h-0">
        <!-- Messages -->
        <div 
          ref="messagesContainer"
          @scroll="handleScroll"
          class="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-4 min-h-0"
        >
          <div v-if="messages.length === 0" class="text-center text-gray-400 mt-20">
            <Icon name="heroicons:cpu-chip" class="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Starte eine KI-Unterhaltung!</p>
          </div>
          
          <ChatMessage
            v-for="(msg, index) in messages"
            :key="index"
            :message="msg.content"
            :is-user="msg.role === 'ai2'"
            :is-ai="msg.role === 'ai1'"
            :timestamp="msg.timestamp"
          />
          
          <!-- Typing indicator -->
          <ChatMessage
            v-if="isTyping"
            message=""
            :is-user="currentSpeaker === 'ai2'"
            :is-ai="currentSpeaker === 'ai1'"
            :is-typing="true"
            timestamp=""
          />
        </div>

        <!-- Initial message input area -->
        <div class="p-6 border-t border-white/10">
          <div class="mb-2">
            <label class="block text-sm font-medium text-gray-300">Startnachricht für die Arena</label>
          </div>
          <div class="flex items-end space-x-4">
            <div class="flex-1">
              <textarea
                ref="initialMessageRef"
                v-model="initialMessage"
                placeholder="Worüber sollen die KIs sprechen? (Shift+Enter für neue Zeile)"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[3rem] max-h-32 overflow-y-auto scrollbar-thin"
                :disabled="isRunning"
                rows="1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page title
useHead({
  title: 'ChadGPT Arena - KI vs KI'
})

interface AIMessage {
  role: 'ai1' | 'ai2'
  content: string
  timestamp: string
}

const messages = ref<AIMessage[]>([])
const initialMessage = ref('You are participating in a rap battle. Take turns creating short rap lines. Keep each line short and creative.')
const maxMessages = ref(10)
const isRunning = ref(false)
const isTyping = ref(false)
const currentSpeaker = ref<'ai1' | 'ai2'>('ai1')
const messagesContainer = ref<HTMLElement>()
const initialMessageRef = ref<HTMLTextAreaElement>()
const showScrollButton = ref(false)
const unreadMessages = ref(0)

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const autoResizeInitialMessage = () => {
  if (initialMessageRef.value) {
    initialMessageRef.value.style.height = 'auto'
    initialMessageRef.value.style.height = initialMessageRef.value.scrollHeight + 'px'
  }
}

// Watch for changes in initialMessage to auto-resize
watch(initialMessage, () => {
  nextTick(() => {
    autoResizeInitialMessage()
  })
})

// Auto-resize on mount
onMounted(() => {
  if (initialMessageRef.value) {
    autoResizeInitialMessage()
  }
})

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      unreadMessages.value = 0 // Reset unread count when manually scrolling to bottom
    }
  })
}

const handleScroll = () => {
  if (messagesContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    // Show button when not at bottom (with small threshold)
    showScrollButton.value = scrollTop < scrollHeight - clientHeight - 50
    
    // Reset unread messages if user scrolled to bottom
    if (scrollTop >= scrollHeight - clientHeight - 10) {
      unreadMessages.value = 0
    }
  }
}

const sendAIMessage = async (conversationHistory: string, speaker: 'ai1' | 'ai2'): Promise<string> => {
  isTyping.value = true
  currentSpeaker.value = speaker
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: conversationHistory
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    let aiResponse = ''
    const messageIndex = messages.value.length

    // Add empty message
    messages.value.push({
      role: speaker,
      content: '',
      timestamp: formatTime(new Date())
    })

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
              aiResponse += data.response
              messages.value[messageIndex].content = aiResponse
              scrollToBottom()
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }

    isTyping.value = false
    return aiResponse
  } catch (error) {
    console.error('Error sending AI message:', error)
    isTyping.value = false
    throw error
  }
}

const startConversation = async () => {
  if (!initialMessage.value.trim() || isRunning.value) return

  isRunning.value = true
  let conversationHistory = initialMessage.value.trim()
  let messageCount = 0

  try {
    while (messageCount < maxMessages.value && isRunning.value) {
      // AI 1 responds with full conversation context
      const ai1Prompt = `${conversationHistory}\n\nYou are AI1. Respond to the conversation above. Keep it short and relevant.`
      const ai1Response = await sendAIMessage(ai1Prompt, 'ai1')
      messageCount++
      
      if (messageCount >= maxMessages.value || !isRunning.value) break
      
      // Update conversation history with AI1's response
      conversationHistory += `\n\nAI1: ${ai1Response}`
      
      // Wait a bit before AI 2 responds
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // AI 2 responds with full conversation context
      const ai2Prompt = `${conversationHistory}\n\nYou are AI2. Respond to AI1's message above. Keep it short and relevant.`
      const ai2Response = await sendAIMessage(ai2Prompt, 'ai2')
      messageCount++
      
      // Update conversation history with AI2's response
      conversationHistory += `\n\nAI2: ${ai2Response}`
      
      // Wait a bit before next round
      if (messageCount < maxMessages.value && isRunning.value) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  } catch (error) {
    console.error('Conversation error:', error)
  } finally {
    isRunning.value = false
    isTyping.value = false
  }
}

const stopConversation = () => {
  isRunning.value = false
  isTyping.value = false
}

const clearConversation = () => {
  if (isRunning.value) return
  messages.value = []
  unreadMessages.value = 0
}

// Auto-scroll when new messages are added
watch(messages, (newMessages, oldMessages) => {
  const wasAtBottom = !showScrollButton.value
  
  if (wasAtBottom) {
    scrollToBottom()
  } else {
    // User is not at bottom, increment unread count
    const newMessageCount = newMessages.length - (oldMessages?.length || 0)
    if (newMessageCount > 0) {
      unreadMessages.value += newMessageCount
    }
  }
}, { deep: true })
</script> 