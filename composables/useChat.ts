import type { ChatRequest } from '~/types/chat'
import { generateUUID } from '~/utils/uuid'

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

    // Generate unique session ID for this request
    const sessionId = generateUUID()
    const conversationId = chatStore.currentConversation.id
    
    // Create AbortController for this session
    const controller = new AbortController()

    // Add user message
    chatStore.addMessage({
      role: 'user',
      content: userMessage,
      timestamp: formatTime(new Date())
    })

    // Start the chat session
    chatStore.startChatSession(sessionId, conversationId, controller)
    chatStore.setTyping(true)

    try {
      const requestBody: ChatRequest = {
        message: userMessage,
        model: chatStore.currentConversation.model,
        sessionId: sessionId
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
        body: JSON.stringify(requestBody),
        signal: controller.signal // Add abort signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Verify session ID from response headers
      const responseSessionId = response.headers.get('X-Session-ID')
      if (responseSessionId !== sessionId) {
        console.warn(`Session ID mismatch: expected ${sessionId}, got ${responseSessionId}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let assistantMessage = ''
      
      // Add empty assistant message to the conversation associated with this session
      const targetConversation = chatStore.conversations.find(c => c.id === conversationId)
      if (targetConversation) {
        chatStore.addMessage({
          role: 'assistant',
          content: '',
          timestamp: formatTime(new Date())
        })
      }

      chatStore.setTyping(false)

      const decoder = new TextDecoder()
      let lastResponseData: any = null
      let pendingChunks: any[] = []
      let processedChunks = new Set<string>()
      let lastProcessedIndex = 0
      
      while (true) {
        // Check if session is still active (not cancelled)
        if (!chatStore.isSessionActive(sessionId)) {
          break
        }

        const { done, value } = await reader.read()
        
        if (done) {
          // Process any remaining chunks
          if (pendingChunks.length > 0) {
            pendingChunks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            
            for (let i = lastProcessedIndex; i < pendingChunks.length; i++) {
              const sortedChunk = pendingChunks[i]
              lastResponseData = sortedChunk
              
              if (sortedChunk.response) {
                assistantMessage += sortedChunk.response
                chatStore.updateLastMessage(assistantMessage, sessionId)
              }
            }
          }
          break
        }
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              
              // Verify this chunk belongs to our session
              if (data.sessionId && data.sessionId !== sessionId) {
                console.warn(`Received chunk for different session: ${data.sessionId}, expected: ${sessionId}`)
                continue
              }

              if (data.created_at) {
                // Collect chunks with timestamps
                pendingChunks.push(data)
                
                // Sort chunks by created_at timestamp
                pendingChunks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                
                // Process only new chunks in order
                for (let i = lastProcessedIndex; i < pendingChunks.length; i++) {
                  const sortedChunk = pendingChunks[i]
                  const chunkId = `${sortedChunk.created_at}_${sortedChunk.response || ''}_${sessionId}`
                  
                  if (!processedChunks.has(chunkId)) {
                    processedChunks.add(chunkId)
                    lastResponseData = sortedChunk
                    
                    if (sortedChunk.response) {
                      assistantMessage += sortedChunk.response
                      chatStore.updateLastMessage(assistantMessage, sessionId)
                    }
                    
                    lastProcessedIndex = i + 1
                  }
                }
              } else {
                // Fallback for chunks without timestamp (process immediately)
                lastResponseData = data
                if (data.response) {
                  assistantMessage += data.response
                  chatStore.updateLastMessage(assistantMessage, sessionId)
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
        chatStore.setContext(lastResponseData.context, sessionId)
      }

      // End the session
      chatStore.endChatSession(sessionId)

    } catch (error: any) {
      console.error('Error sending message:', error)
      
      // End the session on error
      chatStore.endChatSession(sessionId)
      chatStore.setTyping(false)
      
      // Only add error message if the request wasn't aborted
      if (error.name !== 'AbortError') {
        // Add error message to the specific conversation
        const targetConversation = chatStore.conversations.find(c => c.id === conversationId)
        if (targetConversation) {
          chatStore.addMessage({
            role: 'assistant',
            content: 'Entschuldigung, es gab einen Fehler bei der Kommunikation mit der KI.',
            timestamp: formatTime(new Date())
          })
        }
      }
    }
  }

  const cancelMessage = (conversationId?: string) => {
    if (conversationId) {
      const conversation = chatStore.conversations.find(c => c.id === conversationId)
      if (conversation && conversation.sessionId) {
        chatStore.cancelChatSession(conversation.sessionId)
      }
    } else if (chatStore.currentConversation?.sessionId) {
      chatStore.cancelChatSession(chatStore.currentConversation.sessionId)
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
    cancelMessage,
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