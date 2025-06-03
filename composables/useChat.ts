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
    
    console.log('Starting chat session:', { sessionId, conversationId, model: chatStore.currentConversation.model })
    
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
      // Prepare messages array for modern Chat API
      // Convert stored messages to the format expected by Ollama
      const messages = chatStore.currentConversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const requestBody: ChatRequest = {
        model: chatStore.currentConversation.model,
        messages: messages,
        stream: chatStore.isStreamModeEnabled, // Use the streaming setting from store
        sessionId: sessionId
      }

      console.log('Sending chat request:', {
        sessionId,
        model: requestBody.model,
        messageCount: requestBody.messages.length,
        stream: requestBody.stream
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal // Add abort signal
      })

      console.log('Chat response received:', {
        sessionId,
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('Chat API error:', response.status, response.statusText, errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      // Verify session ID from response headers
      const responseSessionId = response.headers.get('X-Session-ID')
      if (responseSessionId !== sessionId) {
        console.warn(`Session ID mismatch: expected ${sessionId}, got ${responseSessionId}`)
      }

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

      let assistantMessage = ''

      if (chatStore.isStreamModeEnabled) {
        console.log('Processing streaming response for session:', sessionId)
        // Handle streaming response
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body for streaming')
        }

        const decoder = new TextDecoder()
        let lastResponseData: any = null
        let chunkCount = 0

        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              console.log(`Streaming completed for session ${sessionId}, total chunks processed: ${chunkCount}`)
              break
            }

            chunkCount++
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const data = JSON.parse(line)
                  lastResponseData = data

                  // Check if this response belongs to current session
                  if (data.sessionId !== sessionId) {
                    console.warn(`Response session ID mismatch: expected ${sessionId}, got ${data.sessionId}`)
                    continue
                  }

                  if (data.response || (data.message && data.message.content)) {
                    // Handle both legacy (response) and modern (message.content) formats
                    const content = data.response || data.message.content
                    assistantMessage += content
                    
                    // Update the assistant message in real-time for the specific session
                    chatStore.updateLastMessage(assistantMessage, sessionId)
                  }

                  if (data.done) {
                    console.log('Streaming marked as done for session:', sessionId)
                    break
                  }
                } catch (e) {
                  console.warn('Error parsing JSON in stream:', e, 'Line:', line)
                }
              }
            }
          }
        } catch (streamError: any) {
          if (streamError.name === 'AbortError') {
            console.log('Streaming request was aborted for session:', sessionId)
          } else {
            console.error('Error reading stream for session:', sessionId, streamError)
            throw streamError
          }
        }
      } else {
        console.log('Processing non-streaming response for session:', sessionId)
        // Handle non-streaming response
        try {
          const data = await response.json()
          
          // Check if this response belongs to current session
          if (data.sessionId && data.sessionId !== sessionId) {
            console.warn(`Response session ID mismatch: expected ${sessionId}, got ${data.sessionId}`)
          }

          if (data.message && data.message.content) {
            // Modern chat API non-streaming response
            assistantMessage = data.message.content
            chatStore.updateLastMessage(assistantMessage, sessionId)
          } else if (data.response) {
            // Legacy format
            assistantMessage = data.response
            chatStore.updateLastMessage(assistantMessage, sessionId)
          }

          console.log('Non-streaming response processed for session:', sessionId)
        } catch (jsonError: any) {
          if (jsonError.name === 'AbortError') {
            console.log('Non-streaming request was aborted for session:', sessionId)
          } else {
            console.error('Error parsing JSON response for session:', sessionId, jsonError)
            throw jsonError
          }
        }
      }

    } catch (error: any) {
      console.error('Error sending message for session:', sessionId, error)
      
      // Remove the last user message if there was an error
      if (chatStore.currentConversation) {
        const messages = chatStore.currentConversation.messages
        if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
          messages.pop()
        }
      }

      if (error.name !== 'AbortError') {
        // Show error to user
        chatStore.addMessage({
          role: 'assistant',
          content: `Entschuldigung, es gab einen Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.\n\nFehlerdetails: ${error.message || 'Unbekannter Fehler'}`,
          timestamp: formatTime(new Date())
        })
      }
    } finally {
      // Always end the session and stop typing
      console.log('Ending chat session:', sessionId)
      chatStore.endChatSession(sessionId)
      chatStore.setTyping(false)
    }
  }

  const cancelMessage = (conversationId: string) => {
    // Find the session for this conversation
    const conversation = chatStore.conversations.find(c => c.id === conversationId)
    if (conversation?.sessionId) {
      chatStore.cancelChatSession(conversation.sessionId)
    }
  }

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      chatStore.setAvailableModels(data.models || [])
    } catch (error) {
      console.error('Error loading models:', error)
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