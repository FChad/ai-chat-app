import type { ChatRequest } from '~/types/chat'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  try {
    const body = await readBody<ChatRequest>(event)
    const { message, model = 'gemma3:4b', context, sessionId } = body

    // Validate input
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid message is required'
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

    // Construct the full URL
    const apiUrl = `${ollamaApiUrl}/generate`

    // Set headers for Server-Sent Events with session ID
    setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(event, 'Access-Control-Allow-Methods', 'POST')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
    setHeader(event, 'X-Session-ID', sessionId) // Add session ID to response headers

    const requestBody: any = {
      model: model.trim(),
      prompt: message.trim(),
      stream: true
    }

    // Add context if provided and valid
    if (context && Array.isArray(context) && context.length > 0) {
      requestBody.context = context
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

    // Create a transform stream to add sessionId to each chunk
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
                    const modifiedLine = JSON.stringify(data) + '\n'
                    controller.enqueue(new TextEncoder().encode(modifiedLine))
                  } catch (e) {
                    // If JSON parsing fails, pass through the original line
                    // but try to add sessionId if it looks like a valid response
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