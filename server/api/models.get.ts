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

    // Fetch available models from OpenRouter API
    const apiUrl = 'https://openrouter.ai/api/v1/models'

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'https://github.com/FChad/nuxt-ollama-chat',
        'X-Title': 'AskChadAI'
      }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('OpenRouter API error:', response.status, response.statusText, errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `OpenRouter API error: ${response.statusText}`
      })
    }

    const data = await response.json()

    // Filter nur kostenlose Modelle (pricing.prompt = "0" und pricing.completion = "0")
    const freeModels: AIModel[] = data.data
      .filter((model: any) => {
        // Konvertiere Strings zu Numbers für den Vergleich
        const promptPrice = parseFloat(model.pricing?.prompt || '1')
        const completionPrice = parseFloat(model.pricing?.completion || '1')
        const isFree = promptPrice === 0 && completionPrice === 0

        return isFree
      })
      .map((model: any) => {
        // Extrahiere Parameter-Größe aus dem Namen (z.B. "8b", "70b")
        const sizeMatch = model.id.match(/(\d+\.?\d*[bmk])/i)
        const parameterSize = sizeMatch ? sizeMatch[1].toUpperCase() : 'Unknown'

        // Extrahiere Familie aus dem Modell-Namen
        const family = model.id.split('/')[0] || 'unknown'

        return {
          name: model.name || model.id,
          model: model.id,
          canonical_slug: model.canonical_slug || model.id,
          modified_at: model.created ? new Date(model.created * 1000).toISOString() : new Date().toISOString(),
          size: 0,
          digest: '',
          details: {
            parent_model: '',
            format: '',
            family: family,
            families: [family],
            parameter_size: parameterSize,
            quantization_level: '',
            context_length: model.context_length || 0,
            description: model.description || '',
            popularity: model.top_provider?.max_completion_tokens || 0,
            canonical_slug: model.canonical_slug || model.id,
            // OpenRouter specific fields
            architecture: model.architecture ? {
              input_modalities: model.architecture.input_modalities || [],
              output_modalities: model.architecture.output_modalities || [],
              tokenizer: model.architecture.tokenizer || '',
              instruct_type: model.architecture.instruct_type || null
            } : undefined,
            pricing: model.pricing ? {
              prompt: model.pricing.prompt || '0',
              completion: model.pricing.completion || '0',
              request: model.pricing.request || '0',
              image: model.pricing.image || '0',
              web_search: model.pricing.web_search || '0',
              internal_reasoning: model.pricing.internal_reasoning || '0',
              input_cache_read: model.pricing.input_cache_read || '0',
              input_cache_write: model.pricing.input_cache_write || '0'
            } : undefined,
            top_provider: model.top_provider ? {
              context_length: model.top_provider.context_length || 0,
              max_completion_tokens: model.top_provider.max_completion_tokens || 0,
              is_moderated: model.top_provider.is_moderated || false
            } : undefined,
            supported_parameters: model.supported_parameters || []
          },
          // Speichere Popularität für Sortierung
          _popularity: model.top_provider?.max_completion_tokens || 0
        }
      })
      // Sortiere nach Beliebtheit (höhere Werte zuerst)
      .sort((a: any, b: any) => {
        return (b._popularity || 0) - (a._popularity || 0)
      })
      // Entferne temporäres Feld
      .map((model: any) => {
        const { _popularity, ...cleanModel } = model
        return cleanModel
      })

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