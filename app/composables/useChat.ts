import type { ChatRequest, Conversation, Message, AIModel, MessageContent } from '../../types/chat'
import { generateUUID } from '~/utils/uuid'

interface ImageFile {
  file: File
  preview: string
  name: string
  base64: string
}

export const useChat = () => {
  const chatStore = useChatStore()

  const sendMessage = async (message: string, images?: ImageFile[], model?: string): Promise<void> => {
    if (!message.trim() && (!images || images.length === 0)) return

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

    // Build message content
    let messageContent: MessageContent = userMessage

    if (images && images.length > 0) {
      // Multi-modal message with text and images
      const contentParts: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string; detail?: 'low' | 'high' | 'auto' } }> = []

      if (userMessage) {
        contentParts.push({
          type: 'text',
          text: userMessage
        })
      }

      for (const img of images) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: img.base64,
            detail: 'auto'
          }
        })
      }

      messageContent = contentParts
    }

    // Add user message (images are stored in content array, not separately)
    chatStore.addMessage({
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
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
        stream: true,
        sessionId: sessionId
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal, // Add abort signal
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')

        // Try to parse JSON error from the server
        let errorMessage = ''
        let statusCode = response.status
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson?.statusMessage || errorJson?.message || errorJson?.statusText || ''
        } catch {
          errorMessage = errorText
        }

        // Handle specific error codes with user-friendly messages
        if (statusCode === 429) {
          throw new Error('RATE_LIMIT_ERROR')
        }

        throw new Error(`HTTP_ERROR:${statusCode}:${errorMessage}`)
      }

      // Add empty assistant message to the conversation associated with this session
      chatStore.addMessage({
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      }, conversationId)

      chatStore.setTyping(false)

      let assistantMessage = ''

      // Handle streaming response using SSE line parsing
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body for streaming')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      const handleSseLine = (line: string) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) return
        if (!trimmed.startsWith('data:')) return
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') return

        let data: any
        try {
          data = JSON.parse(payload)
        } catch {
          return
        }

        // OpenRouter can report errors at the top level or inside choices[0]
        const choiceError = data.choices?.[0]?.error
        if (choiceError) {
          throw new Error(`STREAM_ERROR:${choiceError.code || 0}:${choiceError.message || 'Model returned an error'}`)
        }
        if (data.error) {
          const msg = typeof data.error === 'string' ? data.error : (data.error.message || 'API returned an error')
          throw new Error(`STREAM_ERROR:${data.error.code || 0}:${msg}`)
        }

        const content = data.choices?.[0]?.delta?.content
        if (content) {
          assistantMessage += content
          chatStore.updateLastMessage(assistantMessage, sessionId)
        }
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            if (buffer.trim()) handleSseLine(buffer)
            break
          }

          buffer += decoder.decode(value, { stream: true })

          let newlineIndex = buffer.indexOf('\n')
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex)
            buffer = buffer.slice(newlineIndex + 1)
            handleSseLine(line)
            newlineIndex = buffer.indexOf('\n')
          }
        }
      } catch (streamError: any) {
        if (streamError.name !== 'AbortError') {
          throw streamError
        }
      }

    } catch (error: any) {

      // Remove the last assistant message if it was empty (streaming error case)
      if (chatStore.currentConversation) {
        const messages = chatStore.currentConversation.messages
        if (messages && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content) {
          messages.pop()
        }
      }

      // Remove the last user message if there was an error
      if (chatStore.currentConversation) {
        const messages = chatStore.currentConversation.messages
        if (messages && messages.length > 0 && messages[messages.length - 1]?.role === 'user') {
          messages.pop()
        }
      }

      if (error.name !== 'AbortError') {
        // Determine user-friendly error message
        let errorTitle = 'Something went wrong'
        let errorDetail = 'Sorry, there was an error sending the message. Please try again.'

        const errorMsg = error.message || ''

        if (errorMsg === 'RATE_LIMIT_ERROR' || errorMsg.includes('HTTP_ERROR:429')) {
          errorTitle = 'Rate limit reached'
          errorDetail = 'The free model is temporarily busy. Please try again in a few minutes or select another model.'
        } else if (errorMsg.includes(':429:') || errorMsg.includes('rate limit')) {
          errorTitle = 'Too many requests'
          errorDetail = 'The service is temporarily overloaded. Please wait a moment and try again.'
        } else if (errorMsg.includes(':503:') || errorMsg.includes('HTTP_ERROR:503')) {
          errorTitle = 'Service unavailable'
          errorDetail = 'The service is temporarily unavailable. Please try again in a few minutes.'
        } else if (errorMsg.includes(':401:') || errorMsg.includes('HTTP_ERROR:401')) {
          errorTitle = 'Authentication error'
          errorDetail = 'There was a problem with API authentication. Please contact the administrator.'
        } else if (errorMsg.startsWith('STREAM_ERROR:')) {
          const parts = errorMsg.split(':')
          errorTitle = 'Model error'
          errorDetail = parts.slice(2).join(':') || 'Unknown model error'
        } else if (errorMsg.startsWith('HTTP_ERROR:')) {
          const parts = errorMsg.split(':')
          const statusCode = parts[1] || '?'
          errorTitle = `Error (${statusCode})`
          errorDetail = parts.slice(2).join(':') || 'Unknown error'
        }

        chatStore.setApiError(errorTitle, errorDetail)
      }

      return
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
      const response = await fetch('/api/models')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const models = data.models || []
      chatStore.setAvailableModels(models)
      return models
    } catch (error) {
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