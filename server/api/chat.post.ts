export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  const body = await readBody(event)

  const { message, model = 'gemma3:4b', context } = body

  if (!message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message is required'
    })
  }

  // Get environment variables directly as fallback
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

  // Set headers for Server-Sent Events
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'POST')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')

  try {
    const requestBody: any = {
      model,
      prompt: message,
      stream: true
    }

    // Add context if provided
    if (context && Array.isArray(context)) {
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
      throw createError({
        statusCode: response.status,
        statusMessage: `Ollama API error: ${response.statusText}`
      })
    }

    if (!response.body) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No response body from Ollama API'
      })
    }

    // Return the stream directly
    return sendStream(event, response.body)
  } catch (error) {
    console.error('Ollama API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to communicate with Ollama API'
    })
  }
}) 