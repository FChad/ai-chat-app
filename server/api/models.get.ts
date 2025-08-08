import type { OllamaModel } from '~/types/chat'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  try {
    // Disable caching to avoid stale lists over changing networks
    setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
    setHeader(event, 'Pragma', 'no-cache')
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8')

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

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${ollamaApiUser}:${ollamaApiKey}`).toString('base64')}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw createError({
        statusCode: response.status,
        statusMessage: `Ollama API error: ${response.statusText} - ${errorText}`
      })
    }

    const data = await response.json()

    // Validate response structure
    if (!data || !Array.isArray(data.models)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Invalid response format from Ollama API'
      })
    }

    return {
      models: data.models as OllamaModel[]
    }

  } catch (error: any) {
    console.error('Models API error:', error)

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Handle other errors
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch models from Ollama API'
    })
  }
}) 