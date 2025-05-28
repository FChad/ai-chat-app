export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

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

  // Construct the full URL for tags endpoint
  const apiUrl = `${ollamaApiUrl}/tags`

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${ollamaApiUser}:${ollamaApiKey}`).toString('base64')}`
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Ollama API error: ${response.statusText}`
      })
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Ollama Models API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch models from Ollama API'
    })
  }
}) 