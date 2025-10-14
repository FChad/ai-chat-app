import type { ChatRequest, Conversation, Message, AIModel } from '../../types/chat'
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

        // Handle specific error codes with user-friendly messages
        if (response.status === 429) {
          // Rate limit error
          throw new Error('RATE_LIMIT_ERROR')
        }

        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
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
                  // Ignore parsing errors
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
                  if (effectiveSessionId === sessionId) {
                    const content = data.response || data.message?.content
                    if (content) {
                      assistantMessage += content
                      chatStore.updateLastMessage(assistantMessage, sessionId)
                    }
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
              newlineIndex = buffer.indexOf('\n')
            }
          }
        } catch (streamError: any) {
          if (streamError.name !== 'AbortError') {
            throw streamError
          }
        }
      } else {
        // Handle non-streaming response
        try {
          const data = await response.json()

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
            throw jsonError
          }
        }
      }

    } catch (error: any) {

      // Remove the last user message if there was an error
      if (chatStore.currentConversation) {
        const messages = chatStore.currentConversation.messages
        if (messages && messages.length > 0 && messages[messages.length - 1]?.role === 'user') {
          messages.pop()
        }
      }

      if (error.name !== 'AbortError') {
        // Determine user-friendly error message
        let userMessage = 'Entschuldigung, es gab einen Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.'

        if (error.message === 'RATE_LIMIT_ERROR') {
          userMessage = '⚠️ Das Modell ist vorübergehend ausgelastet.\n\n' +
            'Das kostenlose Modell hat ein Rate-Limit erreicht. Bitte versuchen Sie es in wenigen Minuten erneut oder wählen Sie ein anderes Modell aus.'
        } else if (error.message && error.message.includes('429')) {
          userMessage = '⚠️ Zu viele Anfragen.\n\n' +
            'Der Dienst ist vorübergehend überlastet. Bitte warten Sie einen Moment und versuchen Sie es erneut.'
        } else if (error.message && error.message.includes('503')) {
          userMessage = '⚠️ Der Dienst ist vorübergehend nicht verfügbar.\n\n' +
            'Bitte versuchen Sie es in wenigen Minuten erneut.'
        } else if (error.message && error.message.includes('401')) {
          userMessage = '⚠️ Authentifizierungsfehler.\n\n' +
            'Es gab ein Problem mit der API-Authentifizierung. Bitte kontaktieren Sie den Administrator.'
        }

        // Show error to user
        chatStore.addMessage({
          role: 'assistant',
          content: userMessage,
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

  const loadModels = async (): Promise<AIModel[]> => {
    try {
      const response = await fetch('/api/models', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.models || []
    } catch (error) {
      // Silently fail - return empty array
      return []
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