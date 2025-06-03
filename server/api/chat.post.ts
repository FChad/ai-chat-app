import type { ChatRequest } from '~/types/chat'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  try {
    const body = await readBody<ChatRequest>(event)
    const { model = 'gemma3:4b', messages, stream = true, sessionId } = body

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

    if (!sessionId || typeof sessionId !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid sessionId is required'
      })
    }

    // Validate messages structure
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
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
    }

    // Get environment variables
    const ollamaApiUrl = runtimeConfig.ollamaApiUrl
    const ollamaApiUser = runtimeConfig.ollamaApiUser
    const ollamaApiKey = runtimeConfig.ollamaApiKey

    // Validate environment variables
    if (!ollamaApiUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: 'OLLAMA_API_URL environment variable is not set'
      })
    }

    if (!ollamaApiUser) {
      throw createError({
        statusCode: 500,
        statusMessage: 'OLLAMA_API_USER environment variable is not set'
      })
    }

    if (!ollamaApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'OLLAMA_API_KEY environment variable is not set'
      })
    }

    // Use the modern Ollama Chat API endpoint
    const apiUrl = `${ollamaApiUrl}/chat`

    // Prepare request body for modern Chat API
    const requestBody = {
      model: model.trim(),
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content.trim()
      })),
      stream: stream
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${ollamaApiUser}:${ollamaApiKey}`).toString('base64')}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw createError({
        statusCode: response.status,
        statusMessage: `Ollama API error: ${response.statusText} - ${errorText}`
      })
    }

    if (!response.body) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No response body from Ollama API'
      })
    }

    if (stream) {
      // Handle streaming response
      // Set headers for Server-Sent Events with session ID
      setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
      setHeader(event, 'Cache-Control', 'no-cache')
      setHeader(event, 'Connection', 'keep-alive')
      setHeader(event, 'Access-Control-Allow-Origin', '*')
      setHeader(event, 'Access-Control-Allow-Methods', 'POST')
      setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
      setHeader(event, 'X-Session-ID', sessionId)

      // Create a transform stream to add sessionId to each chunk and handle modern chat response format
      const transformedStream = new ReadableStream({
        start(controller) {
          const reader = response.body!.getReader()
          const decoder = new TextDecoder()

          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read()
                
                if (done) {
                  controller.close()
                  break
                }

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.trim()) {
                    try {
                      const data = JSON.parse(line)
                      
                      // Add sessionId to the response data
                      data.sessionId = sessionId
                      
                      // Transform modern chat response to maintain compatibility with frontend
                      if (data.message && data.message.content) {
                        // Modern chat API response format
                        data.response = data.message.content
                      }
                      
                      const modifiedLine = JSON.stringify(data) + '\n'
                      controller.enqueue(new TextEncoder().encode(modifiedLine))
                    } catch (e) {
                      // If JSON parsing fails, pass through the original line
                      controller.enqueue(new TextEncoder().encode(line + '\n'))
                    }
                  }
                }
              }
            } catch (error) {
              controller.error(error)
            }
          }

          pump()
        }
      })

      // Return the transformed stream
      return sendStream(event, transformedStream)
    } else {
      // Handle non-streaming response
      setHeader(event, 'Content-Type', 'application/json')
      setHeader(event, 'Access-Control-Allow-Origin', '*')
      setHeader(event, 'Access-Control-Allow-Methods', 'POST')
      setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
      setHeader(event, 'X-Session-ID', sessionId)

      const data = await response.json()
      
      // Add sessionId to the response data
      data.sessionId = sessionId
      
      // Transform modern chat response to maintain compatibility with frontend
      if (data.message && data.message.content) {
        // Modern chat API response format
        data.response = data.message.content
      }

      return data
    }

  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }
    
    // Handle other errors
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to communicate with Ollama API'
    })
  }
}) 