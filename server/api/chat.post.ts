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
    const { model = 'meta-llama/llama-3.3-8b-instruct:free', messages, stream = true, sessionId } = body

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
        content: msg.content.trim()
      })),
      stream: stream
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'https://github.com/FChad/nuxt-ollama-chat', // Optional: für OpenRouter Tracking
        'X-Title': 'AskChadAI' // Optional: für OpenRouter Tracking
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw createError({
        statusCode: response.status,
        statusMessage: `OpenRouter API error: ${response.statusText} - ${errorText}`
      })
    }

    if (!response.body) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No response body from OpenRouter API'
      })
    }

    if (stream) {
      // Handle streaming response - OpenRouter uses OpenAI format (SSE with "data:" prefix)
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

      // Create a transform stream to convert OpenAI SSE format to our format
      const transformedStream = new ReadableStream({
        start(controller) {
          const reader = response.body!.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          const encoder = new TextEncoder()

          // Periodic heartbeat to nudge proxies/browsers to flush
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
                  clearInterval(keepAlive)
                  controller.close()
                  break
                }

                const chunk = decoder.decode(value, { stream: true })
                buffer += chunk

                // Process complete lines (SSE format: "data: {...}\n\n")
                const lines = buffer.split('\n')
                buffer = lines.pop() || '' // Keep incomplete line in buffer

                for (const line of lines) {
                  const trimmedLine = line.trim()

                  // Skip empty lines and comments
                  if (!trimmedLine || trimmedLine.startsWith(':')) {
                    continue
                  }

                  // Check for [DONE] message
                  if (trimmedLine === 'data: [DONE]') {
                    // Send final done message in our format
                    const doneMessage = JSON.stringify({
                      done: true,
                      sessionId: sessionId
                    }) + '\n'
                    controller.enqueue(encoder.encode(doneMessage))
                    continue
                  }

                  // Parse SSE data lines
                  if (trimmedLine.startsWith('data: ')) {
                    try {
                      const jsonStr = trimmedLine.substring(6) // Remove "data: " prefix
                      const data = JSON.parse(jsonStr)

                      // Transform OpenAI format to our format
                      if (data.choices && data.choices[0]?.delta?.content) {
                        const transformedData = {
                          message: {
                            role: 'assistant',
                            content: data.choices[0].delta.content
                          },
                          response: data.choices[0].delta.content, // Legacy compatibility
                          done: false,
                          sessionId: sessionId
                        }

                        const modifiedLine = JSON.stringify(transformedData) + '\n'
                        controller.enqueue(encoder.encode(modifiedLine))
                      }
                    } catch (e) {
                      // Ignore parsing errors
                    }
                  }
                }
              }
            } catch (error) {
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

      // Transform OpenAI format to our format
      const transformedData = {
        message: {
          role: 'assistant',
          content: data.choices?.[0]?.message?.content || ''
        },
        response: data.choices?.[0]?.message?.content || '', // Legacy compatibility
        done: true,
        sessionId: sessionId
      }

      return transformedData
    }

  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Handle other errors
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to communicate with OpenRouter API'
    })
  }
}) 