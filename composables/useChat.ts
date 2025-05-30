import type { ChatRequest } from '~/types/chat'

export const useChat = () => {
  const chatStore = useChatStore()

  const sendMessage = async (message: string, model?: string) => {
    if (!message.trim()) return

    const userMessage = message.trim()
    
    // If no current conversation and model is provided, create new conversation
    if (!chatStore.currentConversation && model) {
      chatStore.createNewConversation(model, userMessage)
    }
    
    if (!chatStore.currentConversation) {
      console.error('No conversation available')
      return
    }

    // Add user message
    chatStore.addMessage({
      role: 'user',
      content: userMessage,
      timestamp: formatTime(new Date())
    })

    chatStore.setTyping(true)

    try {
      const requestBody: ChatRequest = {
        message: userMessage,
        model: chatStore.currentConversation.model
      }

      // Add context if available
      if (chatStore.currentConversation.context) {
        requestBody.context = chatStore.currentConversation.context
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
      
      // Add empty assistant message
      chatStore.addMessage({
        role: 'assistant',
        content: '',
        timestamp: formatTime(new Date())
      })

      chatStore.setTyping(false)

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
                chatStore.updateLastMessage(assistantMessage)
              }
            } catch (e) {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }

      // Update context from the last response
      if (lastResponseData && lastResponseData.context) {
        chatStore.setContext(lastResponseData.context)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      chatStore.setTyping(false)
      
      // Add error message
      chatStore.addMessage({
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler bei der Kommunikation mit der KI.',
        timestamp: formatTime(new Date())
      })
    }
  }

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models')
      if (response.ok) {
        const data = await response.json()
        chatStore.setAvailableModels(data.models || [])
      }
    } catch (error) {
      console.error('Failed to load models:', error)
      // Fallback to default model
      chatStore.setAvailableModels([{
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
      }])
    }
  }

  const startNewConversation = (model: string) => {
    chatStore.createNewConversation(model)
  }

  return {
    sendMessage,
    loadModels,
    startNewConversation
  }
}

// Helper function
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
} 