import type { ChatRequest } from '../../types/chat'
import { DEFAULT_MODEL } from '../../app/config/constants'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  try {
    const body = await readBody<ChatRequest>(event)
    const { model = DEFAULT_MODEL, messages, sessionId } = body

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid messages array is required'
      })
    }

    if (!model || typeof model !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid model is required'
      })
    }

    if (!sessionId || typeof sessionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid sessionId (UUID) is required'
      })
    }

    // Limit messages array size to prevent abuse
    if (messages.length > 200) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Too many messages (max 200)'
      })
    }

    // Validate messages structure
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Each message must have role and content'
        })
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Message role must be user, assistant, or system'
        })
      }
      // Content can be string or array (for multi-modal)
      if (typeof msg.content !== 'string' && !Array.isArray(msg.content)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Message content must be a string or array'
        })
      }
    }

    // Get environment variables
    const openrouterApiKey = runtimeConfig.openrouterApiKey

    // Validate environment variables
    if (!openrouterApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'OPENROUTER_API_KEY environment variable is not set'
      })
    }

    // OpenRouter API endpoint
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

    // Prepare request body for OpenRouter API (OpenAI-compatible)
    const requestBody = {
      model: model.trim(),
      messages: messages.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content.trim() : msg.content
      })),
      stream: true
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'https://github.com/FChad/nuxt-ollama-chat', // Optional: für OpenRouter Tracking
        'X-OpenRouter-Title': 'AskChadAI' // Optional: für OpenRouter Tracking
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')

      // Try to extract a useful message from OpenRouter's JSON error response
      let errorMessage = ''
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson?.error?.message || errorJson?.message || errorText
      } catch {
        errorMessage = errorText
      }

      console.error('OpenRouter API error:', response.status, errorMessage)

      throw createError({
        statusCode: response.status,
        statusMessage: errorMessage || response.statusText
      })
    }

    if (!response.body) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No response body from OpenRouter API'
      })
    }

    // Stream the upstream SSE response directly to the client
    setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'Content-Encoding', 'identity')
    setHeader(event, 'X-Session-ID', sessionId)

    return sendStream(event, response.body)

  } catch (error: any) {
    // Ignore aborted/cancelled requests (client disconnected)
    if (error?.code === 'ABORT_ERR' ||
      error?.message?.includes('aborted') ||
      error?.message?.includes('cancelled') ||
      error?.code === 'ECONNRESET') {
      // Client disconnected, this is normal - don't log as error
      return
    }

    // If it's already an H3 error (from createError), re-throw it
    if (error.statusCode) {
      throw error
    }

    // Log actual errors for debugging
    console.error('Chat API error:', error)

    // Handle other errors
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to communicate with OpenRouter API'
    })
  }
}) 