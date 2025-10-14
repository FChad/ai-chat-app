import type { ChatRequest, Conversation, Message } from '../../types/chat'
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
      // Prepare messages array for OpenRouter Chat API
      // Convert stored messages to the format expected by OpenRouter
      const messages = chatStore.currentConversation.messages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      }))

      const requestBody: ChatRequest = {
        model: chatStore.currentConversation.model,
        messages: messages,
        stream: chatStore.isStreamModeEnabled, // Use the streaming setting from store
        sessionId: sessionId
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/x-ndjson'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal, // Add abort signal
        cache: 'no-store'
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
      const targetConversation = chatStore.conversations.find((c: Conversation) => c.id === conversationId)
      if (targetConversation) {
        chatStore.addMessageToConversation(conversationId, {
          role: 'assistant',
          content: '',
          timestamp: formatTime(new Date())
        })
      }

      chatStore.setTyping(false)

      let assistantMessage = ''

      if (chatStore.isStreamModeEnabled) {
        // Handle streaming response using NDJSON line parsing
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body for streaming')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // Process any remaining line
              const line = buffer.trim()
              if (line) {
                try {
                  const data = JSON.parse(line)
                  const effectiveSessionId = data.sessionId ?? sessionId
                  if (effectiveSessionId === sessionId) {
                    const content = data.response || data.message?.content
                    if (content) {
                      assistantMessage += content
                      chatStore.updateLastMessage(assistantMessage, sessionId)
                    }
                  }
                } catch (e) {
                  console.warn('Error parsing final NDJSON line:', e)
                }
              }
              break
            }

            buffer += decoder.decode(value, { stream: true })

            // Consume complete lines
            let newlineIndex = buffer.indexOf('\n')
            while (newlineIndex !== -1) {
              const line = buffer.slice(0, newlineIndex).trim()
              buffer = buffer.slice(newlineIndex + 1)
              if (line) {
                try {
                  const data = JSON.parse(line)
                  const effectiveSessionId = data.sessionId ?? sessionId
                  if (effectiveSessionId !== sessionId) {
                    console.warn(`Response session ID mismatch: expected ${sessionId}, got ${effectiveSessionId}`)
                  } else {
                    const content = data.response || data.message?.content
                    if (content) {
                      assistantMessage += content
                      chatStore.updateLastMessage(assistantMessage, sessionId)
                    }
                  }
                } catch (e) {
                  console.warn('Error parsing NDJSON line:', e)
                }
              }
              newlineIndex = buffer.indexOf('\n')
            }
          }
        } catch (streamError: any) {
          if (streamError.name !== 'AbortError') {
            console.error('Error reading stream for session:', sessionId, streamError)
            throw streamError
          }
        }
      } else {
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
        } catch (jsonError: any) {
          if (jsonError.name !== 'AbortError') {
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
      chatStore.endChatSession(sessionId)
      chatStore.setTyping(false)
    }
  }

  const cancelMessage = (conversationId: string) => {
    // Find the session for this conversation
    const conversation = chatStore.conversations.find((c: Conversation) => c.id === conversationId)
    if (conversation?.sessionId) {
      chatStore.cancelChatSession(conversation.sessionId)
    }
  }

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models', { cache: 'no-store' })
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