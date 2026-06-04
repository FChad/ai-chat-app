import type { AIModel } from '../../types/chat'
import type { OpenRouterModel, OpenRouterModelsResponse } from '../../types/openrouter'
import { DEFAULT_MODEL } from '#shared/constants'

// Simple in-memory cache — avoids hammering the OpenRouter API on every request.
const CACHE_TTL = 300_000 // 5 minutes
let cache: { models: AIModel[]; expiresAt: number } | null = null

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  // Serve from cache when still fresh
  if (cache && Date.now() < cache.expiresAt) {
    return { models: cache.models }
  }

  try {
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
        'HTTP-Referer': 'https://github.com/FChad/ai-chat-app',
        'X-OpenRouter-Title': 'AskChadAI'
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

    const data = await response.json() as OpenRouterModelsResponse

    // Filter free models (prompt/completion price = 0), sort with DEFAULT_MODEL pinned first,
    // then by popularity (max_completion_tokens) descending.
    const freeModels: AIModel[] = data.data
      .filter((model: OpenRouterModel) => {
        const promptPrice = parseFloat(model.pricing?.prompt || '1')
        const completionPrice = parseFloat(model.pricing?.completion || '1')
        return promptPrice === 0 && completionPrice === 0
      })
      .map((model: OpenRouterModel): { model: AIModel; popularity: number } => {
        const sizeMatch = model.id.match(/(\d+\.?\d*[bmk])/i)
        const parameterSize = sizeMatch?.[1] ? sizeMatch[1].toUpperCase() : 'Unknown'
        const family = model.id.split('/')[0] || 'unknown'
        const popularity = model.top_provider?.max_completion_tokens || 0

        return {
          model: {
            name: model.name || model.id,
            model: model.id,
            modified_at: model.created ? new Date(model.created * 1000).toISOString() : new Date().toISOString(),
            details: {
              family: family,
              parameter_size: parameterSize,
              context_length: model.context_length || 0,
              description: model.description || '',
              popularity,
              canonical_slug: model.canonical_slug || model.id,
              architecture: model.architecture,
              pricing: model.pricing,
              top_provider: model.top_provider,
              supported_parameters: model.supported_parameters || []
            }
          },
          popularity
        }
      })
      .sort((a, b) => {
        if (a.model.model === DEFAULT_MODEL) return -1
        if (b.model.model === DEFAULT_MODEL) return 1
        return b.popularity - a.popularity
      })
      .map(({ model }) => model)

    // Store in-memory cache
    cache = { models: freeModels, expiresAt: Date.now() + CACHE_TTL }

    return { models: freeModels }

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