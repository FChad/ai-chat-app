import type { ChatRequest, Message, AIModel, MessageContent } from '../../types/chat'
import type { OpenRouterStreamChunk } from '../../types/openrouter'
import type { UploadedImage } from './useChatInput'
import { generateUUID } from '~/utils/uuid'
import { persistImage, toDataUrl } from '~/utils/imageStorage'

export const useChat = () => {
  const chatStore = useChatStore()
  const toast = useToast()

  const sendMessage = async (message: string, images?: UploadedImage[], model?: string): Promise<void> => {
    if (!message.trim() && (!images || images.length === 0)) return

    const userMessage = message.trim()

    // If no current conversation, create one (use provided model or persisted selection)
    if (!chatStore.currentConversation) {
      const selectedModel = useSelectedModel()
      chatStore.createNewConversation(model || selectedModel.value, userMessage)
    }

    if (!chatStore.currentConversation) {
      return
    }

    // Generate unique session ID for this request
    const sessionId = generateUUID()
    const conversationId = chatStore.currentConversation.id

    // Create AbortController for this session
    const controller = new AbortController()

    // Build message content. Persist any new image File as a Blob in IDB and
    // store an `idb-blob:{uuid}` marker in the message. For regenerate, an
    // UploadedImage carries an `existingUrl` (the existing marker) that we
    // just pass through.
    let messageContent: MessageContent = userMessage

    if (images && images.length > 0) {
      const contentParts: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string; detail?: 'low' | 'high' | 'auto' } }> = []

      if (userMessage) {
        contentParts.push({
          type: 'text',
          text: userMessage
        })
      }

      for (const img of images) {
        let url: string
        if (img.file) {
          // New upload — persist the Blob, store only the marker on the message.
          url = await persistImage(img.file)
        } else if (img.existingUrl) {
          // Regenerate path — reuse the previously persisted reference.
          url = img.existingUrl
        } else {
          continue
        }
        contentParts.push({
          type: 'image_url',
          image_url: {
            url,
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
      // Prepare messages array for OpenRouter Chat API.
      // OpenRouter accepts data: and https: URLs but not idb-blob:, so resolve every
      // persisted marker back to a data: URL right before fetch. Resolution runs in
      // parallel; for typical conversations (few images, few MB each) the overhead is
      // single-digit milliseconds.
      const messages = await Promise.all(
        chatStore.currentConversation.messages.map(async (msg: Message) => {
          if (typeof msg.content === 'string') {
            return { role: msg.role, content: msg.content }
          }
          const resolvedParts = await Promise.all(
            msg.content.map(async (part) => {
              if (part.type === 'image_url' && part.image_url?.url) {
                const url = await toDataUrl(part.image_url.url)
                return { ...part, image_url: { ...part.image_url, url } }
              }
              return part
            })
          )
          return { role: msg.role, content: resolvedParts }
        })
      )

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

        let data: OpenRouterStreamChunk
        try {
          data = JSON.parse(payload) as OpenRouterStreamChunk
        } catch {
          return
        }

        // OpenRouter reports stream errors at the top level (NOT inside choices[0]).
        // See https://openrouter.ai/docs/api/reference/errors-and-debugging
        if (data.error) {
          throw new Error(`STREAM_ERROR:${data.error.code ?? 0}:${data.error.message || 'API returned an error'}`)
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

      // Remove the last assistant message if it was empty (streaming error case).
      // The user message stays in the conversation — losing typed input on a transient
      // network error is worse UX than leaving it visible so the user can retry.
      if (chatStore.currentConversation) {
        const messages = chatStore.currentConversation.messages
        if (messages && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content) {
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

        toast.add({
          color: 'error',
          title: errorTitle,
          description: errorDetail,
          icon: 'i-lucide-circle-alert',
          duration: 0
        })
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
    const conversation = chatStore.conversations.find(c => c.id === conversationId)
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

  return {
    sendMessage,
    cancelMessage,
    loadModels
  }
} 