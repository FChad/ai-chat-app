import type { ChatRequest } from '../../types/chat'

export default defineEventHandler(async (event) => {
  // Handle CORS preflight requests
  if (getMethod(event) === 'OPTIONS') {
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
    setHeader(event, 'Access-Control-Max-Age', 86400)
    return {}
  }

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
      console.error('OLLAMA_API_URL environment variable is not set')
      throw createError({
        statusCode: 500,
        statusMessage: 'OLLAMA_API_URL environment variable is not set'
      })
    }

    if (!ollamaApiUser) {
      console.error('OLLAMA_API_USER environment variable is not set')
      throw createError({
        statusCode: 500,
        statusMessage: 'OLLAMA_API_USER environment variable is not set'
      })
    }

    if (!ollamaApiKey) {
      console.error('OLLAMA_API_KEY environment variable is not set')
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
      console.error('Ollama API error:', response.status, response.statusText, errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `Ollama API error: ${response.statusText} - ${errorText}`
      })
    }

    if (!response.body) {
      console.error('No response body from Ollama API')
      throw createError({
        statusCode: 500,
        statusMessage: 'No response body from Ollama API'
      })
    }

    if (stream) {
      // Handle streaming response
      // Enhanced headers for better compatibility (reduce proxy buffering and disable compression)
      setHeader(event, 'Content-Type', 'application/x-ndjson; charset=utf-8')
      setHeader(event, 'Cache-Control', 'no-transform, no-cache, no-store, must-revalidate, proxy-revalidate')
      setHeader(event, 'Pragma', 'no-cache')
      setHeader(event, 'Expires', '0')
      setHeader(event, 'Connection', 'keep-alive')
      setHeader(event, 'X-Accel-Buffering', 'no') // for nginx
      setHeader(event, 'Content-Encoding', 'identity') // disable gzip to avoid buffering
      setHeader(event, 'Vary', 'Accept-Encoding')
      setHeader(event, 'Access-Control-Allow-Origin', '*')
      setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
      setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
      setHeader(event, 'Access-Control-Expose-Headers', 'X-Session-ID')
      setHeader(event, 'X-Session-ID', sessionId)

      // Create a transform stream to add sessionId to each chunk and handle modern chat response format
      const transformedStream = new ReadableStream({
        start(controller) {
          const reader = response.body!.getReader()
          const decoder = new TextDecoder()
          let chunkCount = 0
          let buffer = '' // Buffer for incomplete JSON strings
          const encoder = new TextEncoder()
          // Periodic heartbeat to nudge proxies/browsers to flush (helps on IPv6/HTTP2)
          const keepAlive = setInterval(() => {
            try {
              controller.enqueue(encoder.encode('\n'))
            } catch (_) {
              // ignore if stream already closed
            }
          }, 15000)

          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read()

                if (done) {
                  // Process any remaining data in buffer
                  if (buffer.trim()) {
                    try {
                      const data = JSON.parse(buffer)
                      data.sessionId = sessionId

                      // Transform modern chat response to maintain compatibility with frontend
                      if (data.message && data.message.content) {
                        data.response = data.message.content
                      }

                      const finalLine = JSON.stringify(data) + '\n'
                      controller.enqueue(new TextEncoder().encode(finalLine))
                    } catch (e) {
                      console.warn('Error parsing final buffer JSON:', e)
                    }
                  }
                  clearInterval(keepAlive)
                  controller.close()
                  break
                }

                chunkCount++
                const chunk = decoder.decode(value, { stream: true })
                buffer += chunk

                // Try to extract complete JSON objects from buffer
                let startIndex = 0
                let braceCount = 0
                let inString = false
                let escaped = false

                for (let i = 0; i < buffer.length; i++) {
                  const char = buffer[i]

                  if (escaped) {
                    escaped = false
                    continue
                  }

                  if (char === '\\') {
                    escaped = true
                    continue
                  }

                  if (char === '"') {
                    inString = !inString
                    continue
                  }

                  if (!inString) {
                    if (char === '{') {
                      braceCount++
                    } else if (char === '}') {
                      braceCount--

                      if (braceCount === 0) {
                        // Found complete JSON object
                        const jsonString = buffer.substring(startIndex, i + 1)

                        try {
                          const data = JSON.parse(jsonString)

                          // Add sessionId to the response data
                          data.sessionId = sessionId

                          // Transform modern chat response to maintain compatibility with frontend
                          if (data.message && data.message.content) {
                            data.response = data.message.content
                          }

                          const modifiedLine = JSON.stringify(data) + '\n'
                          controller.enqueue(new TextEncoder().encode(modifiedLine))
                        } catch (e) {
                          console.warn('Error parsing JSON object:', e)
                        }

                        // Move to next potential JSON object
                        startIndex = i + 1
                        while (startIndex < buffer.length && buffer[startIndex] !== '{') {
                          startIndex++
                        }
                        i = startIndex - 1 // Will be incremented by for loop
                      }
                    }
                  }
                }

                // Keep incomplete JSON in buffer for next iteration
                if (startIndex < buffer.length) {
                  buffer = buffer.substring(startIndex)
                } else {
                  buffer = ''
                }
              }
            } catch (error) {
              console.error('Error in streaming for session', sessionId, ':', error)
              clearInterval(keepAlive)
              controller.error(error)
            }
          }

          pump()
        }
      })

      // Return the transformed stream (newline-delimited JSON)
      return sendStream(event, transformedStream)
    } else {
      // Handle non-streaming response
      setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
      setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
      setHeader(event, 'Pragma', 'no-cache')
      setHeader(event, 'Access-Control-Allow-Origin', '*')
      setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
      setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
      setHeader(event, 'Access-Control-Expose-Headers', 'X-Session-ID')
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
    console.error('Chat API error for session:', error.sessionId || 'unknown', error)

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