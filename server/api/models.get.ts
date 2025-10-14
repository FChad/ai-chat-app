import type { AIModel } from '../../types/chat'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  try {
    // Disable caching to avoid stale lists over changing networks
    setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
    setHeader(event, 'Pragma', 'no-cache')
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8')

    // Get environment variables
    const openrouterApiKey = runtimeConfig.openrouterApiKey

    // Validate environment variables
    if (!openrouterApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'OPENROUTER_API_KEY environment variable is not set'
      })
    }

    // Liste der kostenlosen, schnellen Modelle von OpenRouter
    // Aktuell nur Llama 3.3 8B Instruct
    const freeModels: AIModel[] = [
      {
        name: 'meta-llama/llama-3.3-70b-instruct:free',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        modified_at: new Date().toISOString(),
        size: 0,
        digest: '',
        details: {
          parent_model: '',
          format: '',
          family: 'llama',
          families: ['llama'],
          parameter_size: '70B',
          quantization_level: ''
        }
      },
      {
        name: 'meta-llama/llama-3.3-8b-instruct:free',
        model: 'meta-llama/llama-3.3-8b-instruct:free',
        modified_at: new Date().toISOString(),
        size: 0,
        digest: '',
        details: {
          parent_model: '',
          format: '',
          family: 'llama',
          families: ['llama'],
          parameter_size: '8B',
          quantization_level: ''
        }
      }
    ]

    return {
      models: freeModels
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
      statusMessage: error.message || 'Failed to fetch models from OpenRouter API'
    })
  }
}) 