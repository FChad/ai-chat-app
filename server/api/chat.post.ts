import type { ChatRequest } from '../../types/chat'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  try {
    const body = await readBody<ChatRequest>(event)
    const { model = 'meta-llama/llama-3.3-8b-instruct:free', messages, sessionId } = body

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

    // Streaming response headers optimized for Cloudflare Pages
    setHeader(event, 'Content-Type', 'application/x-ndjson; charset=utf-8')
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'Content-Encoding', 'identity')
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
                    const jsonStr = trimmedLine.substring(6)
                    const data = JSON.parse(jsonStr)

                    const choice = data.choices?.[0]
                    if (choice?.error) {
                      const errorData = {
                        error: true,
                        message: choice.error.message || 'Model returned an error',
                        code: choice.error.code,
                        done: true,
                        sessionId: sessionId
                      }
                      controller.enqueue(encoder.encode(JSON.stringify(errorData) + '\n'))
                      continue
                    }

                    if (data.error) {
                      const errorData = {
                        error: true,
                        message: data.error.message || data.error || 'API returned an error',
                        code: data.error.code,
                        done: true,
                        sessionId: sessionId
                      }
                      controller.enqueue(encoder.encode(JSON.stringify(errorData) + '\n'))
                      continue
                    }

                    if (choice?.delta?.content) {
                      const transformedData = {
                        message: {
                          role: 'assistant',
                          content: choice.delta.content
                        },
                        done: false,
                        sessionId: sessionId
                      }
                      controller.enqueue(encoder.encode(JSON.stringify(transformedData) + '\n'))
                    }
                  } catch (e) {
                    // Ignore parsing errors for malformed lines
                  }
                }
              }
            }
          } catch (error: any) {
            clearInterval(keepAlive)
            if (error?.code === 'ABORT_ERR' || error?.message?.includes('aborted')) {
              controller.close()
            } else {
              controller.error(error)
            }
          }
        }

        pump()
      }
    })

    return sendStream(event, transformedStream)

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